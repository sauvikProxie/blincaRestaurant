/** The phone number and password don't match an account. Any other error means the request itself failed. */
export class InvalidCredentialsError extends Error {
	constructor() {
		super('Invalid phone number or password');
		this.name = 'InvalidCredentialsError';
	}
}
