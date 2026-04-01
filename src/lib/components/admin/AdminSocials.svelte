<script lang="ts">
	import { SaveContext } from '$lib/state/save.svelte';
	import { SocialPlatform, type Social } from '$lib/types';
	import { formatSocialPlatform } from '$lib/util';
	import Button from '../ui/Button.svelte';
	import Icon from '../ui/Icon.svelte';
	import InputField from '../ui/InputField.svelte';
	import Label from '../ui/Label.svelte';
	import Select from '../ui/Select.svelte';
	import AdminCard from './AdminCard.svelte';
	import AdminEmptyNotice from './AdminEmptyNotice.svelte';
	import CreateDialog from './CreateDialog.svelte';

	type Props = {
		emptyText: string;
		socials: Social[];
	};

	let { emptyText, socials = $bindable() }: Props = $props();

	const saveCtx = SaveContext.get();

	let newDialogOpen = $state(false);
	let newPlatform = $state(SocialPlatform.TWITTER);
	let newUrl = $state('');

	const remainingPlatforms = $derived(
		Object.values(SocialPlatform).filter(
			(platform) => !socials.some((social) => social.platform === platform)
		)
	);

	async function submit() {
		socials.push({
			platform: newPlatform,
			url: newUrl
		});

		saveCtx.setDirty();
		reset();
	}

	function reset() {
		newDialogOpen = false;
		newUrl = '';

		if (remainingPlatforms.length > 0) {
			newPlatform = remainingPlatforms[0];
		}
	}
</script>

<AdminCard title="Sociala medier">
	{#if socials.length === 0}
		<AdminEmptyNotice oncreateclick={() => (newDialogOpen = true)}>
			{emptyText}
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1.5 py-1">
			{#each socials as social, i (social.platform)}
				<Label>
					{#snippet label()}
						<Icon class="text-2xl" icon="ph:{social.platform}-logo-fill" />
						{formatSocialPlatform(social.platform)}
					{/snippet}

					<InputField bind:value={social.url} placeholder="URL" />

					<Button
						icon="ph:trash"
						class="ml-2"
						kind="tertiary"
						title="Radera"
						onclick={() => {
							socials.splice(i, 1);
							saveCtx.setDirty();
						}}
					/>
				</Label>
			{/each}
		</div>

		{#if remainingPlatforms.length > 0}
			<Button icon="ph:plus" onclick={() => (newDialogOpen = true)} />
		{/if}
	{/if}
</AdminCard>

<CreateDialog
	title="Lägg till social media"
	bind:open={newDialogOpen}
	oncreate={submit}
	onclose={reset}
	disabled={!newUrl || !newPlatform}
>
	<Label label="Platform">
		<Select
			type="single"
			class="grow"
			bind:value={newPlatform}
			itemIcon={(platform) => `ph:${platform}-logo-fill`}
			items={remainingPlatforms.map((platform) => ({
				label: formatSocialPlatform(platform),
				value: platform
			}))}
		/>
	</Label>

	<Label label="URL">
		<InputField bind:value={newUrl} placeholder="https://{newPlatform}.com/..." />
	</Label>
</CreateDialog>
