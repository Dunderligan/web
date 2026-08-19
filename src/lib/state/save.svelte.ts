import { beforeNavigate, invalidateAll } from '$app/navigation';
import { defineContext } from './util';

const { get, set } = defineContext<SaveContext>('$_save_state');

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

	// the href to return to after saving/discarding
	href?: string;

	constructor(options?: {
		save?: () => Promise<void>;
		discard?: () => Promise<void>;
		href?: string;
	}) {
		this.saveAction = options?.save;
		this.discardAction = options?.discard ?? invalidateAll;

		this.href = options?.href;

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
		this.isDirty = true;
	};

	save = async () => {
		try {
			this.saving = true;
			await this.saveAction?.();

			this.isDirty = false;
		} finally {
			this.saving = false;
		}
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
