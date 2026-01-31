<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import Icon from '../ui/Icon.svelte';
	import Button from '../ui/Button.svelte';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { logout } from '$lib/remote/auth.remote';
	import { ThemeState } from '$lib/state/theme.svelte';
	import Dropdown from '../ui/Dropdown.svelte';
	import logo from '$lib/assets/images/logo.webp';

	type Props = {
		dark?: boolean;
	};

	let { dark }: Props = $props();

	const links = [
		{
			href: '/stallningar',
			label: 'Ställningar'
		},
		{
			href: '/arkiv',
			label: 'Arkiv'
		},
		{
			href: '/faq',
			label: 'FAQ'
		},
		{
			href: '/om',
			label: 'Om oss'
		}
	];

	const theme = ThemeState.get();

	const shownName = $derived.by(() => {
		const battletag = page.data.user?.battletag;
		if (!battletag) return null;
		return battletag.split('#')[0];
	});

	const userDropdownItems = $derived([
		{
			label: 'Admin',
			href: '/admin',
			hidden: !page.data.user?.isAdmin
		},
		{
			label: 'Logga ut',
			onclick: onLogout
		}
	]);

	async function onLogout() {
		await logout();
		await invalidateAll();
	}
</script>

<nav
	class={[
		dark && 'dark',
		'fixed z-30 h-18 w-screen bg-linear-to-t to-gray-300/80 px-8 pt-4 text-gray-800 backdrop-blur-[1px] dark:to-gray-900/30 dark:text-gray-200'
	]}
>
	<div class="mx-auto flex h-full max-w-5xl items-center justify-between gap-2">
		<div class="flex items-center gap-12 font-display">
			<a href="/" class="mr-8 shrink-0">
				<img src={logo} alt="Dunderligan logotyp" class="size-12" />
			</a>

			{#each links as { href, label } (href)}
				<a class="hidden font-medium hover:underline sm:block" {href}>{label}</a>
			{/each}
		</div>

		<div class="flex items-center gap-8">
			<button onclick={() => theme.toggle()} class="p-2 text-lg" title="Byt tema">
				<Icon icon={theme.current === 'light' ? 'ph:sun-fill' : 'ph:moon-fill'} />
			</button>

			{#if page.data.user}
				<Dropdown items={userDropdownItems} class="font-display font-medium">
					{shownName}
				</Dropdown>
			{:else}
				<Button
					href="/api/login/battlenet?next={page.url.pathname}"
					kind="tertiary"
					label="Logga in"
				/>
			{/if}

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="flex items-center sm:hidden" aria-label="Meny">
					<Icon icon="ph:list" class="text-2xl" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					class="z-50 flex w-lvw flex-col items-stretch gap-1 bg-white py-6 shadow-lg"
					avoidCollisions={false}
				>
					{#each links as { href, label } (href)}
						<DropdownMenu.Item>
							<a
								class="block px-8 py-2 text-xl font-semibold text-gray-800 hover:bg-gray-100 hover:text-accent-600 hover:underline"
								{href}>{label}</a
							>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</nav>
