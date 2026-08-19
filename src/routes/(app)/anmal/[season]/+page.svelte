<script lang="ts">
	import { page } from '$app/state';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Rulebook from '$lib/components/form/Rulebook.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import EditableMembersTable from '$lib/components/table/EditableMembersTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import DiscordLink from '$lib/components/ui/DiscordLink.svelte';
	import ImageUpload from '$lib/components/ui/ImageUpload.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import { submitTeam } from '$lib/remote/registration.remote.js';
	import { SaveContext } from '$lib/state/save.svelte.js';
	import { Role, type ButtonKind, type TeamSubmissionData } from '$lib/types.js';
	import { formatDate } from '$lib/util';
	import { onMount } from 'svelte';
	import { get, set } from 'idb-keyval';
	import Link from '$lib/components/ui/Link.svelte';

	let { data } = $props();

	SaveContext.set(new SaveContext({ save, discard: load, autoSave: true }));

	const saveCtx = SaveContext.get();

	const season = $derived(data.registration.season);
	const closed = $derived(Date.now() >= data.registration.closeDate.getTime());

	const loggedIn = $derived(page.data.user !== null);

	let invalidMembers = $state(false);
	let acceptedRules = $state(false);

	let submitting = $state(false);
	let createdDialogOpen = $state(false);
	let createdId: string | null = $state(null);

	let logo: File | undefined = $state();
	let submission: TeamSubmissionData | 'loading' = $state('loading');

	onMount(load);

	const storageKey = $derived(`teamSubmission_${season.slug}`);
	const logoStorageKey = $derived(`${storageKey}_logo`);

	async function load() {
		submission = await get<TeamSubmissionData>(storageKey).then(
			(data) => data ?? { name: '', members: [] }
		);
		logo = await get(logoStorageKey);
	}

	async function save() {
		if (submission === 'loading') return;
		await set(storageKey, $state.snapshot(submission));
		await set(logoStorageKey, logo);
	}

	async function clear() {
		await set(storageKey, null);
		await set(logoStorageKey, null);
		submission = {
			name: '',
			members: []
		};
	}

	async function submit() {
		if (submission === 'loading') return;

		try {
			submitting = true;
			if (!logo) return;

			const logoBuffer = await logo.arrayBuffer();

			submission.name = submission.name.trim();

			const { submission: created } = await submitTeam({
				registrationId: data.registration.id,
				data: submission,
				logo: logoBuffer
			});

			createdId = created.id;
			createdDialogOpen = true;
		} finally {
			submitting = false;
		}

		await clear();
	}
</script>

<Meta title="Anmälan" description="Anmäl ditt lag till {season.name} av Dunderligan" />

<PageHeader title="Anmälan" subtitle={season.name} />

<PageSection class="space-y-8">
	{#if data.userSubmissions.length > 0}
		<Notice kind="warn">
			<p>
				Det ser ut som att du redan har skickat in en anmälan för denna säsong. För att redigera din
				anmälan, gå till <Link href="/jag/anmalningar">Mina anmälningar</Link>, eller fortsätt här
				för att anmäla ett nytt lag.
			</p>
		</Notice>
	{/if}

	{#if closed}
		<Notice kind="warn">Anmälan för denna säsong är stängd.</Notice>
	{:else}
		<AdminCard>
			<div class="space-y-4 text-lg font-medium">
				<p>
					Välkommen till anmälningsformuläret till Sveriges största återkommande Overwatchliga -
					<b>Dunderligan!</b>
				</p>

				<p>
					<b>Anmälningsperioden</b> för {season.name} är {formatDate(data.registration.openDate)} till
					{formatDate(data.registration.closeDate)}.
				</p>

				<!-- <p>
					Ligastart 7/3
					<br />
					Grundserien avslutas 5/4
					<br />
					Varje lag förväntas däremellan spela fyra matcher för att placera sig inför slutspelet.
				</p>

				<p>Slutspelet börjar 7/4, finalerna spelas och <b>ligan avslutas senast 26/4</b></p> -->

				<Notice kind="discord">
					<p>
						Mer information hittar du i Dunderligans <DiscordLink>Discordserver</DiscordLink>, som
						dessutom är obligatorisk att gå med i för alla ligans deltagare.
					</p>
				</Notice>
			</div>
		</AdminCard>

		<AdminCard title="Laginformation">
			{#if submission !== 'loading'}
				<Label label="Lagnamn">
					<InputField
						type="text"
						placeholder="Ett fräsigt lagnamn..."
						bind:value={submission.name}
						onchange={saveCtx.setDirty}
					/>
				</Label>

				<Label label="Logotyp">
					<ImageUpload bind:file={logo} onFileChanged={saveCtx.setDirty} />
				</Label>
			{/if}
		</AdminCard>

		<AdminCard title="Spelartrupp">
			<div class="mb-6 space-y-4 text-lg font-medium">
				<p>
					Du anmäler inte ditt lag till en specifik division, alla kan spela med alla och lagen
					kommer delas in i divisioner efter anmälan baserat på de fem högst rankade spelarna.
				</p>

				<p>
					Ett lag i Dunderligan måste bestå av <b>åtminstone sex spelare och som mest nio</b>.
					Samtliga spelare måste vara från Sverige (undantag Åland).
					<br />
					Ditt lag måste ha <b>minst en lagkapten</b>. Lagkaptener är era främsta kontaktpersoner
					och ansvarar för att boka era matcher.
					<br />
					Laget kan även ha upp till 2 coaches och 1 manager.
				</p>

				<p>
					Den SR som anmäls ska vara din <b
						>högsta peaknotering oavsett roll och konto i dina tre senaste placerade säsonger i
						competitive role queue</b
					>. Säsong 20, 19 och 18 gäller primärt. Om du inte fått en rank på någon roll under någon
					av dessa säsonger så tittar vi på de tre senaste säsongerna du hade en rank i.
				</p>

				<div>
					<b>Exempelvis:</b>

					<ul class="list-inside list-disc">
						<li>
							En spelare var peak rankad Master 1 på DPS säsong 20 och peak rankad Grandmaster 4 på
							Tank säsong 19. Den SR som ska anmälas är Grandmaster 4.
						</li>
						<li>
							En spelare hade ingen rank på någon roll säsong 20, 19 eller 18. Spelarens senaste
							peak rank var Diamond 2 på DPS säsong 17, före dess hade spelaren senast en rank
							säsongerna 10 och 11 då denne peakade rank Grandmaster 1 på alla roller. Den SR som
							ska anmälas är Grandmaster 1.
						</li>
					</ul>
				</div>

				<ul class="list-inside list-disc italic">
					<li>
						Battletagen du anmäler förväntas vara det konto spelaren använder på genom hela
						turneringen. Ligaledningen förbehåller sig rätten att stänga av spelare som misstänks
						vara oärliga med sin SR genom att anmäla ett lägre rankat konto.
					</li>

					<li>
						Notera att rollen som anmäls endast är kosmetisk. Alla anmälda får spela alla roller.
						Det finns alltså ingen fördel i att välja Flex istället för Tank, DPS eller Support.
					</li>
				</ul>
			</div>

			{#if submission !== 'loading'}
				<EditableMembersTable
					bind:members={submission.members}
					bind:invalid={invalidMembers}
					legacyRanks={season.legacyRanks}
					forceFullBattletag
					forceRanks
					minPlayers={data.registration.minPlayers}
					maxPlayers={data.registration.maxPlayers}
					minTeamCaptains={1}
					maxPlayersByRole={{ [Role.MANAGER]: 1, [Role.COACH]: 2 }}
				/>
			{/if}
		</AdminCard>

		<AdminCard title="Regelboken">
			<div class="mb-6 space-y-4 text-lg font-medium">
				<p>
					Det sista du behöver göra är att, å ditt lags vägnar, acceptera reglerna.<br />
					Arrangörerna av Dunderligan reserverar sig för eventuella regeländringar.<br />
					Reglerna finns även i Dunderligans discordserver i kanalen #regelboken och kortfattat i kanalen
					#regler.
				</p>
			</div>

			<Rulebook />

			<Label
				class="mt-6"
				label="Jag godkänner reglerna och accepterar villkoren för mitt lags deltagande i Dunderligan."
				fullWidth
				flipped
			>
				<Checkbox bind:checked={acceptedRules} />
			</Label>
		</AdminCard>

		<AdminCard title="Slutför">
			{#if page.data.user}
				<Notice kind="info">
					Du kommer att kunna redigera din anmälan fram tills den stänger på {formatDate(
						data.registration.closeDate
					)}. Detta gör du genom att klicka på ditt användarnamn uppe i högra hörnet och sedan på
					"Mina anmälningar".
				</Notice>
			{:else}
				<Notice kind="warn">
					<p>
						Du är inte inloggad och kommer därför inte kunna redigera din anmälan senare.<br />Vi
						rekommenderar att du loggar in med ditt Battle.net-konto innan du skickar in din
						anmälan.
					</p>

					<Button
						label="Logga in"
						href="/api/login/battlenet?next={page.url.pathname}"
						kind="transparent"
						icon="ph:sign-in"
						class="ml-auto shrink-0"
					/>
				</Notice>
			{/if}

			{#if !acceptedRules}
				<Notice kind="error">Du måste godkänna reglerna innan du kan skicka in din anmälan.</Notice>
			{/if}

			{#if submission !== 'loading'}
				<Button
					label="Skicka in anmälan"
					kind="primary"
					icon="ph:paper-plane-tilt"
					disabled={!acceptedRules || invalidMembers || submission.name.trim().length === 0}
					loading={submitting}
					onclick={submit}
				/>
			{/if}
		</AdminCard>
	{/if}
</PageSection>

<Dialog
	title="Laganmälan skickad!"
	bind:open={createdDialogOpen}
	buttons={[
		{
			label: 'Till startsidan',
			href: '/',
			kind: 'secondary',
			icon: 'ph:arrow-left'
		},
		...(loggedIn
			? [
					{
						label: 'Till anmälan',
						href: `/admin/laganmalan/${createdId}`,
						kind: 'primary' as ButtonKind,
						icon: 'ph:arrow-right'
					}
				]
			: [])
	]}
>
	{#snippet description()}
		<p>Din anmälan har skickats in och väntar nu på att bli godkänd av ligaledningen.</p>

		{#if loggedIn}
			<p>
				Du hittar din anmälan under "Mina anmälningar", som du når genom att klicka på ditt
				användarnamn uppe i högra hörnet.
			</p>
		{/if}

		<p>
			Tänk på att samtliga medlemmar måste vara anslutna i <br />
			<DiscordLink>Discordservern</DiscordLink> innan säsongen drar igång. Därför är det nu ett bra tillfälle
			att gå med själv samt sprida ordet till dina lagkamrater.
		</p>
	{/snippet}
</Dialog>

<SaveToast />
