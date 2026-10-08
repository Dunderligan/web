import { beforeNavigate, invalidateAll } from '$app/navigation';
import { ConfirmContext, type ConfirmData } from './confirm.svelte';
import { defineContext } from './util';

const { get, set } = defineContext<SaveContext>('$_save_state');

type ConfirmDataFn = () => Omit<ConfirmData, 'action'> | null | undefined;

/**
 * Context for managing save state on a page.
 *
 * It is initialized with two async methods: save and discard. When a change is made to the page,
 * setDirty() should be called. If SaveToast is on the page, the user will be then prompted to save
 * or discard their changes.
 *
 * Currently, we don't have a setUndirty(), so even if the user manually undoes their changes, the
 * isDirty flag will remain set until they save or discard.
 *
 * This also handles navigation hooks so the user is prompted if they try to leave with unsaved changes.
 */
export class SaveContext {
	static get = get;
	static set = set;

	// whether there are unsaved changes on the page
	isDirty = $state(false);

	saving = $state(false);
	discarding = $state(false);

	private saveAction?: () => Promise<void>;
	private discardAction: () => Promise<void>;

	private confirmSave?: ConfirmDataFn;
	private confirmContext?: ConfirmContext;

	autoSave = $state(false);

	// the href to return to after saving/discarding
	href?: string;

	constructor(options?: {
		save?: () => Promise<void>;
		discard?: () => Promise<void>;
		autoSave?: boolean;
		href?: string;
		confirmSave?: ConfirmDataFn;
	}) {
		this.saveAction = options?.save;
		this.discardAction = options?.discard ?? invalidateAll;
		this.confirmSave = options?.confirmSave;

		this.autoSave = options?.autoSave ?? false;
		this.href = options?.href;

		this.confirmContext = ConfirmContext.get();

		beforeNavigate(({ cancel }) => {
			if (!this.isDirty) return;

			if (
				!confirm(
					'Är du säker på att du vill lämna sidan? Du har osparade ändringar som kommer förloras!'
				)
			) {
				cancel();
			}
		});
	}

	setDirty = () => {
		if (this.autoSave) {
			this.saveAction?.();
		} else {
			this.isDirty = true;
		}
	};

	save = async (): Promise<boolean> => {
		const confirm = this.confirmSave?.();
		if (confirm) {
			if (this.confirmContext) {
				const confimed = await this.confirmContext.confirm(confirm);
				if (!confimed) return false;
			} else {
				console.warn(
					'SaveContext is missing a ConfirmContext, but confirmSave was provided. The confirmation dialog will be skipped.'
				);
			}
		}

		try {
			this.saving = true;
			await this.saveAction?.();

			this.isDirty = false;
		} catch (error) {
			this.saving = false;
			throw error;
		}

		this.saving = false;
		return true;
	};

	discard = async () => {
		try {
			this.discarding = true;
			await this.discardAction?.();

			this.isDirty = false;
		} finally {
			this.discarding = false;
		}
	};
}
