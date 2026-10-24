<script lang="ts">
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { errorMessage } from '$lib/convex/errors';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { printer } from '$lib/stores/printer.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import { NOTIFICATION_KINDS, REQUIRED_KINDS, TONES, type NotificationKind, type Tone } from '$lib/types';
	import { KIND_LABELS } from '$lib/utils/notifications';

	const TONE_LABELS: Record<Tone, string> = { chime: 'Chime', bell: 'Bell', beep: 'Beep' };

	let enabled = $state(true);
	let tone = $state<Tone>('chime');
	let volume = $state(80);
	let repeat = $state(true);
	let muted = $state<NotificationKind[]>([]);
	let saving = $state(false);
	/** Load the saved settings once per opening, so live feed updates don't wipe edits in progress. */
	let loaded = false;

	const settings = $derived(notifications.feed?.settings);

	$effect(() => {
		if (!notifications.settingsOpen) {
			loaded = false;
			return;
		}
		if (!settings || loaded) return;
		loaded = true;
		enabled = settings.sound.enabled;
		tone = settings.sound.tone;
		volume = settings.sound.volume;
		repeat = settings.sound.repeatUntilAccepted;
		muted = [...settings.mutedKinds];
	});

	const close = () => (notifications.settingsOpen = false);

	function toggleKind(kind: NotificationKind, shown: boolean) {
		muted = shown ? muted.filter((k) => k !== kind) : [...muted, kind];
	}

	async function save() {
		saving = true;
		try {
			await notifications.saveSettings({
				sound: { enabled, tone, volume, repeatUntilAccepted: repeat },
				mutedKinds: muted
			});
			toasts.success('Alert settings saved.');
			close();
		} catch (error) {
			toasts.error(errorMessage(error));
		} finally {
			saving = false;
		}
	}
</script>

<Modal open={notifications.settingsOpen} title="Alerts and printing" size="sm" onclose={close}>
	<div class="sections">
		<section aria-labelledby="sound-heading">
			<h3 id="sound-heading" class="section-title">Sound for your login</h3>
			<div class="row">
				<Toggle checked={enabled} label="Play a sound for new orders" onchange={(on) => (enabled = on)} />
			</div>
			<div class="row">
				<div class="choices" role="group" aria-label="Sound">
					{#each TONES as option (option)}
						<Chip selected={tone === option} onclick={() => (tone = option)}>{TONE_LABELS[option]}</Chip>
					{/each}
				</div>
				<Button variant="secondary" size="sm" icon={Volume2} onclick={() => notifications.test(tone, volume)}>Test</Button>
			</div>
			<div class="field">
				<label class="field-label" for="alert-volume">Volume · {volume}</label>
				<input id="alert-volume" class="range" type="range" min="0" max="100" step="5" bind:value={volume} />
			</div>
			<div class="row">
				<Toggle
					checked={repeat}
					label="Repeat every 10 seconds until the order is accepted"
					onchange={(on) => (repeat = on)}
				/>
			</div>
		</section>

		<section aria-labelledby="kinds-heading">
			<h3 id="kinds-heading" class="section-title">Show these notifications</h3>
			<ul class="kinds">
				{#each NOTIFICATION_KINDS as kind (kind)}
					{@const required = REQUIRED_KINDS.includes(kind)}
					<li>
						<Toggle
							checked={required || !muted.includes(kind)}
							disabled={required}
							label={required ? `${KIND_LABELS[kind]} (always on)` : KIND_LABELS[kind]}
							onchange={(shown) => toggleKind(kind, shown)}
						/>
					</li>
				{/each}
			</ul>
		</section>

		{#if printer.supported}
			<section aria-labelledby="print-heading">
				<h3 id="print-heading" class="section-title">This device</h3>
				<Toggle
					checked={printer.autoPrint}
					label="Print a kitchen ticket when an order is accepted"
					onchange={(on) => printer.setAutoPrint(on)}
				/>
				<p class="hint">Saved on this device straight away. Uses the system print dialog with your default printer.</p>
			</section>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={close} disabled={saving}>Cancel</Button>
		<Button onclick={save} loading={saving} disabled={!settings}>Save</Button>
	{/snippet}
</Modal>

<style>
	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.section-title {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.range {
		width: 100%;
		accent-color: var(--color-action);
	}

	.kinds {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.hint {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}
</style>
