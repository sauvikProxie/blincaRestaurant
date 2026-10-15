import type { Credentials } from '$lib/types';

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

/** Drops the spaces, dashes, dots and brackets people type in phone numbers. */
export const normalizePhone = (input: string) => input.replace(/[\s\-.()]/g, '');

export function validateCredentials({ phone, password }: Credentials): CredentialErrors {
	const errors: CredentialErrors = {};
	const normalized = normalizePhone(phone);
	if (!normalized) errors.phone = 'Enter your phone number';
	else if (!/^\+?\d{6,15}$/.test(normalized)) errors.phone = 'Use digits only, e.g. 070 123 45 67';
	if (!password) errors.password = 'Enter your password';
	return errors;
}

/** Where to go after signing in. Only same-app paths, so a crafted link can't send people off-site. */
export function safeRedirect(target: string | null | undefined): string {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return '/';
	return target.startsWith('/login') ? '/' : target;
}
