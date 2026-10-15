export interface Credentials {
	phone: string;
	password: string;
}

/** Who is signed in on this device. Kept in localStorage until they sign out. */
export interface Session {
	phone: string;
	signedInAt: string;
}
