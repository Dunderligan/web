<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.png';

	type Props = {
		title?: string;
		description?: string;
		ogImage?: string;
		ogImageAlt?: string;
		ogImageWidth?: number;
		ogImageHeight?: number;
	};

	let {
		title,
		description = 'Välkommen till Dunderligan, Sveriges främsta Overwatchturnerning!',
		ogImage = favicon,
		ogImageAlt,
		ogImageWidth,
		ogImageHeight
	}: Props = $props();

	const fullTitle = $derived(title ? `${title} | Dunderligan` : 'Dunderligan');
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />

	<meta property="og:title" content={title ?? 'Dunderligan'} />
	<meta property="og:description" content={description} />
	<meta property="og:image:url" content={ogImage} />
	{#if ogImageAlt}
		<meta property="og:image:alt" content={ogImageAlt} />
	{/if}
	{#if ogImageWidth}
		<meta property="og:image:width" content={ogImageWidth.toString()} />
	{/if}
	{#if ogImageHeight}
		<meta property="og:image:height" content={ogImageHeight.toString()} />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.toString()} />
	<meta property="og:domain" content={page.url.hostname} />
	<meta property="og:site_name" content="Dunderligan" />
	<meta property="og:locale" content="sv_SE" />
</svelte:head>
