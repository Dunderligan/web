<script lang="ts">
	import { authClient } from '$lib/auth-client';

	const session = authClient.useSession();

	async function login() {
		await authClient.signIn.social({
			provider: 'discord'
		});
	}

	async function logout() {
		await authClient.signOut();
	}
</script>

<nav class="h-10 w-full p-4">
	<div class="mx-auto flex max-w-2xl items-center justify-between gap-2">
		<a href="/stallningar">Ställningar</a>

		<div>
			{#if $session.data}
				<img src={$session.data.user?.image} class="inline size-8 rounded-full" alt="" />

				<button onclick={logout}>Logga ut</button>
			{:else}
				<button onclick={login}>Logga in</button>
			{/if}
		</div>
	</div>
</nav>
