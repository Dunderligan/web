import { beforeNavigate, invalidateAll } from '$app/navigation';
import { defineContext } from './util';

const { get, set } = defineContext<SaveContext>('$_save_state');

export class SaveContext {
	static get = get;
	static set = set;

	isDirty = $state(false);

	saving = $state(false);
	discarding = $state(false);

	private saveAction?: () => Promise<void>;
	private discardAction: () => Promise<void>;

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
			await this.discardAction();

			this.isDirty = false;
		} finally {
			this.discarding = false;
		}
	};
}
