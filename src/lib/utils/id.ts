/** Short, collision-resistant id for client-created records. */
export const newId = (prefix: string) =>
	`${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
