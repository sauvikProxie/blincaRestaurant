<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import lockup from '$brand/01-Logo/SVG/blinca-lockup-cranberry.svg';
	import Button from '$lib/components/ui/Button.svelte';
	import SpeedLines from '$lib/components/ui/SpeedLines.svelte';
	import { InvalidCredentialsError, NoRestaurantAccessError, TooManyAttemptsError } from '$lib/services';
	import { auth } from '$lib/stores/auth.svelte';
	import { safeRedirect, validateCredentials } from '$lib/utils/auth';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitted = $state(false);
	let busy = $state(false);
	/** Set when the sign-in request itself fails, as opposed to a field being empty. */
	let failure = $state('');

	let emailInput = $state<HTMLInputElement>();
	let passwordInput = $state<HTMLInputElement>();

	const errors = $derived(submitted ? validateCredentials({ email, password }) : {});

	function failureMessage(error: unknown): string {
		if (error instanceof InvalidCredentialsError) return "That email and password don't match. Please try again.";
		if (error instanceof NoRestaurantAccessError) return `${error.message}. Use the login your restaurant was given for Blinca.`;
		if (error instanceof TooManyAttemptsError) return 'Too many attempts. Wait a few seconds, then try again.';
		return "Sorry, we couldn't sign you in just now. Check your connection and try again.";
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		failure = '';
		const found = validateCredentials({ email, password });
		if (found.email) return emailInput?.focus();
		if (found.password) return passwordInput?.focus();

		busy = true;
		try {
			await auth.signIn({ email, password });
		} catch (error) {
			busy = false;
			failure = failureMessage(error);
			// Clear the password for a fresh try without flagging it as missing.
			password = '';
			submitted = false;
			await tick();
			return passwordInput?.focus();
		}
		// Stays busy while the app opens, so the button can't be pressed twice.
		await goto(safeRedirect(page.url.searchParams.get('redirectTo')), { replaceState: true });
	}
</script>

<svelte:head>
	<title>Sign in - Blinca for restaurants</title>
</svelte:head>

<main class="page">
	<div class="card">
		<span class="speed"><SpeedLines size="lg" moving={busy} /></span>

		<!-- Master artwork only: never redrawn or recoloured (01 Logo) -->
		<img class="logo" src={lockup} alt="Blinca" width="132" height="41" />

		<div class="intro">
			<h1 class="text-h2">Welcome back</h1>
			<p class="muted">Sign in to run your restaurant.</p>
			{#if auth.expired}
				<p class="notice" role="status">Your session ended, so we signed you out. Please sign in again.</p>
			{/if}
		</div>

		<form class="form" novalidate onsubmit={submit}>
			<div class="field">
				<label class="field-label" for="login-email">Email</label>
				<input
					bind:this={emailInput}
					id="login-email"
					class="input"
					type="email"
					inputmode="email"
					autocomplete="username"
					autocapitalize="none"
					spellcheck="false"
					bind:value={email}
					disabled={busy}
					aria-invalid={!!errors.email}
					aria-describedby={errors.email ? 'login-email-error' : undefined}
				/>
				{#if errors.email}<p id="login-email-error" class="field-error">{errors.email}</p>{/if}
			</div>

			<div class="field">
				<label class="field-label" for="login-password">Password</label>
				<div class="password">
					<input
						bind:this={passwordInput}
						id="login-password"
						class="input"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						bind:value={password}
						disabled={busy}
						aria-invalid={!!errors.password || !!failure}
						aria-describedby={errors.password ? 'login-password-error' : failure ? 'login-failure' : undefined}
					/>
					<button
						type="button"
						class="reveal"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						title={showPassword ? 'Hide password' : 'Show password'}
						aria-pressed={showPassword}
						disabled={busy}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<EyeOff size={20} strokeWidth={2} aria-hidden="true" />
						{:else}
							<Eye size={20} strokeWidth={2} aria-hidden="true" />
						{/if}
					</button>
				</div>
				{#if errors.password}<p id="login-password-error" class="field-error">{errors.password}</p>{/if}
			</div>

			{#if failure}
				<p id="login-failure" class="failure" role="alert">
					<CircleAlert size={20} strokeWidth={2} aria-hidden="true" />
					<span>{failure}</span>
				</p>
			{/if}

			<Button type="submit" fullWidth loading={busy}>Sign in</Button>
		</form>
	</div>
</main>

<style>
	.page {
		display: grid;
		place-items: center;
		min-height: 100dvh;
		padding: calc(var(--space-4) + var(--safe-top)) calc(var(--page-gutter) + var(--safe-right))
			calc(var(--space-4) + var(--safe-bottom)) calc(var(--page-gutter) + var(--safe-left));
	}

	.card {
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		max-width: 440px;
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sheet);
		background: var(--color-surface);
	}

	.speed {
		position: absolute;
		top: var(--space-4);
		right: calc(var(--space-2) * -1);
		color: var(--color-tint);
		pointer-events: none;
	}

	.logo {
		position: relative;
		width: 132px;
		height: auto;
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.password {
		position: relative;
	}

	.password .input {
		padding-right: calc(var(--space-2) + 44px);
	}

	.reveal {
		position: absolute;
		top: 50%;
		right: var(--space-half);
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--color-text-muted);
		transform: translateY(-50%);
		transition: background-color var(--duration) var(--ease);
	}

	.reveal:hover:not(:disabled) {
		background: var(--color-tint);
		color: var(--color-text);
	}

	.reveal:disabled {
		cursor: not-allowed;
	}

	.notice {
		margin-top: var(--space-1);
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	/* Blush panel with Cranberry Deep text, like other error messages */
	.failure {
		display: flex;
		align-items: flex-start;
		gap: var(--space-1);
		padding: var(--space-2);
		border-radius: var(--radius-card);
		background: var(--color-tint);
		color: var(--color-negative);
	}

	.failure :global(svg) {
		flex: none;
		margin-top: 3px;
	}

	@media (max-width: 479px) {
		.card {
			padding: var(--space-4) var(--space-3);
		}
	}
</style>
