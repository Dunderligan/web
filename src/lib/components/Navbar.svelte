<script lang="ts">
	import { authClient } from '$lib/auth-client';

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
</script>

<nav class="h-10 w-full p-4">
	<div class="mx-auto flex max-w-2xl items-center justify-between gap-2">
		<a href="/">Dunderligan</a>
		<a href="/sasong/test">Ställningar</a>
		<a href="/admin">Admin</a>

		<div>
			{#if $session.data?.user}
				<button onclick={logout}>{$session.data?.user.name}</button>
			{:else}
				<button onclick={login}>Logga in</button>
			{/if}
		</div>
	</div>
</nav>
