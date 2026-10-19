/** The email and password don't match an account. Any other error means the request itself failed. */
export class InvalidCredentialsError extends Error {
	constructor() {
		super('Invalid email or password');
		this.name = 'InvalidCredentialsError';
	}
}

/** Signed in fine, but the account isn't an active restaurant account (e.g. a customer login). */
export class NoRestaurantAccessError extends Error {
	constructor(message = 'This account has no access to a restaurant') {
		super(message);
		this.name = 'NoRestaurantAccessError';
	}
}

/** The backend rate-limits sign-in attempts per device. */
export class TooManyAttemptsError extends Error {
	constructor() {
		super('Too many sign-in attempts');
		this.name = 'TooManyAttemptsError';
	}
}
