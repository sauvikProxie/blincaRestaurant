export interface Credentials {
	email: string;
	password: string;
}

/** Who is signed in on this device. Kept in localStorage until they sign out. */
export interface Session {
	/** Better Auth session token, sent as a bearer token. */
	token: string;
	email: string;
	name: string;
	signedInAt: string;
}

export type PartnerRole = 'employee' | 'manager' | 'owner';

/** The signed-in staff member and their restaurant. */
export interface PartnerProfile {
	name: string;
	email: string;
	role: PartnerRole;
	restaurantName: string;
}
