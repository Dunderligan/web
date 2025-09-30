<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { DropdownMenu } from 'bits-ui';
	import Icon from './Icon.svelte';

	type Props = {
		dark?: boolean;
	};

	let { dark }: Props = $props();

	const session = authClient.useSession();

	async function login() {
		await authClient.signIn.social({
			provider: 'battlenet',
			scopes: ['openid']
		});
	}

	async function logout() {
		await authClient.signOut();
	}

	const links = [
		{
			href: '/sasong/test',
			label: 'Ställningar'
		},
		{
			href: '/',
			label: 'Arkiv'
		},
		{
			href: '/om',
			label: 'Om oss'
		}
	];
</script>

<nav
	class={[
		dark ? 'text-gray-200' : 'to-gray-300/80 text-gray-800',
		'fixed z-40 h-18 w-screen bg-gradient-to-t px-8 pt-4 backdrop-blur-[2px]'
	]}
>
	<div class="mx-auto flex h-full max-w-3xl items-center justify-between gap-2">
		<div class="flex items-center gap-8">
			<a href="/">
				<img src="/logo.png" alt="Dunderligan" class="size-10" />
			</a>

			{#each links as { href, label } (href)}
				<a class="hidden text-lg font-semibold sm:block" {href}>{label}</a>
			{/each}
		</div>

		<div class="flex items-center gap-6 text-2xl">
			<button>
				<Icon icon="mdi:white-balance-sunny" />
			</button>

			<button onclick={login}>
				<Icon icon="mdi:account-circle" />
			</button>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="sm:hidden">
					<Icon icon="mdi:menu" class="text-2xl" />
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
