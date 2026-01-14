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
	class={[classProp, 'field min-w-0 grow rounded-md']}
	{oninput}
	{disabled}
	{required}
/>
