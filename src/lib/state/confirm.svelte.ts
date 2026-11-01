import { defineContext } from './util';

const { get, set } = defineContext<ConfirmContext>('$_confirm_state');

export type ConfirmData = {
	title: string;
	description: string;
	destructive?: boolean;
	icon?: string;
	action?: () => Promise<void>;
};

/**
 * Context for managing confirmation dialogs.
 * A ConfirmDialog component needs to be on the page to display the confirmation UI.
 */
export class ConfirmContext {
	static get = get;
	static set = set;

	// the current confirmation being shown
	// this is read directly by the ConfirmDialog component
	current: ConfirmData | null = $state(null);

	// the `resolve` method of the current confirmation Promise
	private resolver: ((confirmed: boolean) => void) | null = null;

	/**
	 * Shows a confirmation menu to the user and returns a promise that resolves with the user's choice.
	 * The dialog can be closed with the escape key, which will resolve to false.
	 */
	async confirm(data: ConfirmData): Promise<boolean> {
		this.current = data;

		return new Promise<boolean>((resolve) => {
			this.resolver = resolve;
		});
	}

	// should only be called by the ConfirmDialog component
	async submit(result: boolean) {
		if (!this.resolver) return;

		// ConfirmData.action is ran by the component before we reach this point

		this.resolver(result);
		this.resolver = null;
		this.current = null;
	}
}
