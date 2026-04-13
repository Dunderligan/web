<script lang="ts">
	import { SaveContext } from '$lib/state/save.svelte';
	import { SocialPlatform, type Social } from '$lib/types';
	import { formatSocialPlatform, socialMediaPlatformDomains } from '$lib/util';
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

	const newPlatformDomains = $derived(socialMediaPlatformDomains(newPlatform));
	const invalid = $derived.by(() => {
		if (!newPlatform || !newUrl) return true;

		if (newPlatform === SocialPlatform.DISCORD) {
			// check for a discord snowflake ID
			return !/^\d{17,19}$/.test(newUrl);
		} else {
			return !newPlatformDomains.some((domain) => newUrl.includes(domain));
		}
	});

	const remainingPlatforms = $derived(
		Object.values(SocialPlatform).filter(
			(platform) => !socials.some((social) => social.platform === platform)
		)
	);

	async function submit() {
		if (invalid) return;

		if (newPlatform === SocialPlatform.DISCORD) {
			newUrl = `https://discord.com/users/${newUrl}`;
		}

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
	disabled={invalid}
>
	<Label label="Platform">
		<Select
			type="single"
			class="grow"
			bind:value={newPlatform}
			itemIcon={(platform) => `ph:${platform}-logo`}
			items={remainingPlatforms.map((platform) => ({
				label: formatSocialPlatform(platform),
				value: platform
			}))}
		/>
	</Label>

	{#if newPlatform === SocialPlatform.DISCORD}
		<Label label="Användar-ID">
			<InputField bind:value={newUrl} placeholder="T.ex. 308117922260451340..." />
		</Label>

		<a
			href="https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID#h_01HRSTXPS5H5D7JBY2QKKPVKNA"
			target="_blank"
			rel="noopener noreferrer"
			class="my-1 font-medium text-accent-600 hover:underline"
		>
			<Icon icon="ph:arrow-square-out" />
			Hur hittar jag mitt användar-ID?
		</a>
	{:else}
		<Label label="URL">
			<InputField bind:value={newUrl} placeholder="https://{newPlatformDomains[0]}/..." />
		</Label>
	{/if}
</CreateDialog>
