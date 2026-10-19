import { ConvexError } from 'convex/values';

/** Codes the backend puts on every ConvexError (convex/lib/errors.ts and lib/authz.ts). */
export type BackendErrorCode =
	| 'UNAUTHENTICATED'
	| 'FORBIDDEN'
	| 'ACCOUNT_INACTIVE'
	| 'NOT_FOUND'
	| 'VALIDATION'
	| 'INVALID_STATE'
	| 'RESTAURANT_CLOSED'
	| 'ITEM_UNAVAILABLE';

export function errorCode(error: unknown): BackendErrorCode | null {
	if (!(error instanceof ConvexError)) return null;
	const data = error.data as { code?: unknown } | undefined;
	return typeof data?.code === 'string' ? (data.code as BackendErrorCode) : null;
}

/** A message for staff, in the app's voice. */
export function errorMessage(error: unknown): string {
	switch (errorCode(error)) {
		case 'UNAUTHENTICATED':
			return 'Your session has ended. Please sign in again.';
		case 'FORBIDDEN':
			return "Your account doesn't have access to this. Ask a manager.";
		case 'ACCOUNT_INACTIVE':
			return 'This account has been switched off. Contact your manager.';
		case 'NOT_FOUND':
			return "We couldn't find that order.";
		case 'INVALID_STATE':
			return 'This order has already moved on. The list now shows its latest status.';
		case 'VALIDATION': {
			const data = (error as ConvexError<{ message?: string }>).data;
			return data?.message ?? 'Please check your input and try again.';
		}
		default:
			return "Sorry, that didn't go through. Please try again.";
	}
}

export const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));
