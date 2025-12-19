<script lang="ts">
	type Props = {
		class?: string;
		disabled?: boolean;
		required?: boolean;
		value?: Date | null;
		oninput?: () => void;
		type?: 'datetime-local' | 'date';
	};

	let {
		class: classProp,
		disabled,
		required = false,
		value: date = $bindable(),
		oninput,
		type = 'datetime-local'
	}: Props = $props();

	function toInputString(date: Date) {
		// input type="datetime-local" requires a date string in the format "yyyy-MM-dd(Thh:mm)"
		const pad = (n: number) => String(n).padStart(2, '0');

		const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

		if (type == 'date') {
			return dateString;
		}

		return `${dateString}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}
</script>

<input
	{type}
	bind:value={
		() => (date ? toInputString(date) : null),
		(newValue) => (date = newValue ? new Date(newValue) : null)
	}
	class={[
		classProp,
		'min-w-0 grow rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-800 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-400'
	]}
	{oninput}
	{disabled}
	{required}
/>
