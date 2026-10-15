import { appConfig } from '$lib/config/app.config';
import { normalizePhone } from '$lib/utils/auth';
import { InvalidCredentialsError } from '../errors';
import type { AuthService } from '../types';
import { mockRequest } from './latency';

/** Accepts the single static account from the config. */
export function createMockAuthService(): AuthService {
	const account = appConfig.mock.credentials;
	return {
		signIn: (credentials) =>
			mockRequest(() => {
				const phone = normalizePhone(credentials.phone);
				if (phone !== account.phone || credentials.password !== account.password) {
					throw new InvalidCredentialsError();
				}
				return { phone, signedInAt: new Date().toISOString() };
			}),
		signOut: () => mockRequest(() => undefined)
	};
}
