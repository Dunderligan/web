import { defineContext } from './util';

const { get, set } = defineContext<ConfirmState>('$_confirm_state');

export class ConfirmState {
	static get = get;
	static set = set;

	current: {
		title: string;
		description: string;
	} | null = $state(null);

	#callbackValue: boolean | null = false;

	show = async (title: string, description: string) => {
		this.current = {
			title,
			description
		};

		await new Promise(() => this.#callbackValue !== null);

		const confirmed = this.#callbackValue!;
		this.#callbackValue = null;
		this.current = null;

		return confirmed;
	};

	hide = () => {
		this.current = null;
	};

	callback = (confirmed: boolean) => {
		if (!this.current) return;
		this.#callbackValue = confirmed;
	};
}
