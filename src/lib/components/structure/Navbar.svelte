<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import Icon from '../ui/Icon.svelte';
	import Button from '../ui/Button.svelte';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { logout } from '$lib/remote/auth.remote';
	import { PreferencesState } from '$lib/state/preferences.svelte';
	import Dropdown from '../ui/Dropdown.svelte';
	import logo from '$lib/assets/images/logo.webp';
	import { onMount } from 'svelte';
	import { isModerator } from '$lib/authRole';
	import type { DropdownItem } from '$lib/types';
	import SearchDialog from './SearchDialog.svelte';

	type Props = {
		alwaysWhiteTextAtTop?: boolean;
	};

	let { alwaysWhiteTextAtTop }: Props = $props();

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

	const prefs = PreferencesState.get();

	let scrolled = $state(false);
	let loggingIn = $state(false);

	let searchOpen = $state(false);

	const user = $derived(page.data.user);

	const loginHref = $derived(`/api/login/battlenet?next=${page.url.pathname}`);

	const hamburgerLinks = $derived.by(() => {
		if (user) return links;

		return [
			...links,
			{
				href: loginHref,
				label: 'Logga in'
			}
		];
	});

	const shownName = $derived.by(() => {
		const battletag = user?.battletag;
		if (!battletag) return null;
		return battletag.split('#')[0];
	});

	const preferencesDropdownItems: DropdownItem[] = $derived([
		{
			type: 'checkbox',
			icon: prefs.theme === 'dark' ? 'ph:moon' : 'ph:sun',
			label: 'Mörkt tema',
			checked: prefs.theme === 'dark',
			onchange: (newValue) => prefs.setTheme(newValue ? 'dark' : 'light')
		},
		{
			type: 'checkbox',
			icon: prefs.spoilerMode ? 'ph:eye-slash' : 'ph:eye',
			label: 'Spoilerläge',
			checked: prefs.spoilerMode,
			onchange: (newValue) => prefs.setSpoilerMode(newValue)
		}
	]);

	const userDropdownItems: DropdownItem[] = $derived([
		{
			type: 'button',
			icon: 'ph:user',
			label: 'Min profil',
			href: `/jag`
		},
		{
			type: 'button',
			icon: 'ph:wrench',
			label: 'Admin',
			href: '/admin',
			hidden: !isModerator(user?.role)
		},
		{
			type: 'button',
			icon: 'ph:sign-out',
			label: 'Logga ut',
			onclick: onLogout
		}
	]);

	async function onLogout() {
		await logout();
		await invalidateAll();
	}

	const SCROLL_THRESHOLD = 40;

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > SCROLL_THRESHOLD;
		};

		window.addEventListener('scroll', onScroll);

		return () => {
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<nav
	class={[
		alwaysWhiteTextAtTop && !scrolled ? 'text-gray-200' : 'text-gray-800 dark:text-gray-200',
		scrolled && 'bg-gray-100/60 backdrop-blur-xs dark:bg-gray-900/60',
		'fixed z-30 h-20 w-screen bg-linear-to-t from-transparent to-transparent px-8 transition-colors duration-300 ease-out'
	]}
>
	<div class="mx-auto flex h-full max-w-4xl items-center justify-between gap-2">
		<div class="flex items-center gap-12 font-display">
			<a href="/" class="mr-8 shrink-0">
				<img src={logo} alt="Dunderligan logotyp" class="size-12" />
			</a>

			{#each links as { href, label } (href)}
				<a class="hidden font-medium hover:underline md:block" {href}>{label}</a>
			{/each}
		</div>

		<div class="flex items-center gap-4">
			<Button icon="ph:magnifying-glass" kind="tertiary" onclick={() => (searchOpen = true)} />

			<Dropdown items={preferencesDropdownItems} class="flex items-center justify-center p-3">
				<Icon icon="ph:gear" class="text-xl" />
			</Dropdown>

			{#if user}
				<Dropdown items={userDropdownItems} class="p-1.5 font-display font-medium">
					{shownName}
				</Dropdown>
			{:else}
				<Button
					href={loginHref}
					onclick={() => {
						// setting loggingIn immediately causes the button to be disabled before the navigation occurs
						setTimeout(() => (loggingIn = true));
					}}
					icon="ph:sign-in"
					kind="secondary"
					label="Logga in"
					class="hidden! md:inline-flex!"
					loading={loggingIn}
				/>
			{/if}

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="flex items-center md:hidden" aria-label="Meny">
					<Icon icon="ph:list" class="text-2xl" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					class="z-50 flex w-lvw flex-col items-stretch gap-1 bg-white py-6 shadow-lg dark:bg-gray-900"
					avoidCollisions={false}
				>
					{#each hamburgerLinks as { href, label } (href)}
						<DropdownMenu.Item>
							<a
								class="block px-8 py-2 text-xl font-semibold text-gray-800 dark:text-gray-200"
								{href}>{label}</a
							>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</nav>

<SearchDialog bind:open={searchOpen} />
