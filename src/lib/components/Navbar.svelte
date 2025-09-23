<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import Icon from './Icon.svelte';

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

<nav class="h-18 w-full bg-gradient-to-t to-gray-200/80 px-2 pt-3 pb-1 backdrop-blur-xs">
	<div class="mx-auto flex h-full max-w-3xl items-center justify-between gap-2">
		<div class="flex items-center gap-8">
			<a href="/">
				<img src="/logo.png" alt="Dunderligan" class="size-8" />
			</a>

			{#each links as { href, label } (href)}
				<a class="text-lg font-semibold text-gray-800" {href}>{label}</a>
			{/each}
		</div>

		<div class="flex items-center gap-6 text-xl text-gray-800">
			<button>
				<Icon icon="mdi:white-balance-sunny" />
			</button>

			<button>
				<Icon icon="mdi:account-circle" />
			</button>

			<!-- 
			<div>
				{#if $session.data?.user}
					<button onclick={logout}>{$session.data?.user.name}</button>
				{:else}
					<button onclick={login}>Logga in</button>
				{/if}
			</div>
			 -->
		</div>
	</div>
</nav>
