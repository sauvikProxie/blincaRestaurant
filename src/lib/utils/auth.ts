import type { Credentials } from '$lib/types';

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials({ email, password }: Credentials): CredentialErrors {
	const errors: CredentialErrors = {};
	const trimmed = email.trim();
	if (!trimmed) errors.email = 'Enter your email address';
	else if (!EMAIL_PATTERN.test(trimmed)) errors.email = 'Use an email address, e.g. name@restaurant.se';
	if (!password) errors.password = 'Enter your password';
	return errors;
}

/** Where to go after signing in. Only same-app paths, so a crafted link can't send people off-site. */
export function safeRedirect(target: string | null | undefined): string {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return '/';
	return target.startsWith('/login') ? '/' : target;
}
