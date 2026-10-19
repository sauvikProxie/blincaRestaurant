import { describe, expect, it } from 'vitest';
import { safeRedirect, validateCredentials } from './auth';

describe('validateCredentials', () => {
	it('accepts an email address and password', () => {
		expect(validateCredentials({ email: ' owner@blinca.test ', password: 'password123' })).toEqual({});
	});

	it('requires both fields', () => {
		expect(validateCredentials({ email: '  ', password: '' })).toEqual({
			email: 'Enter your email address',
			password: 'Enter your password'
		});
	});

	it('rejects things that are not email addresses', () => {
		expect(validateCredentials({ email: '0701234567', password: 'x' }).email).toBeDefined();
		expect(validateCredentials({ email: 'owner@blinca', password: 'x' }).email).toBeDefined();
	});
});

describe('safeRedirect', () => {
	it('keeps in-app paths with their query', () => {
		expect(safeRedirect('/orders?order=abc123')).toBe('/orders?order=abc123');
	});

	it('falls back to Home for anything else', () => {
		expect(safeRedirect(null)).toBe('/');
		expect(safeRedirect('')).toBe('/');
		expect(safeRedirect('https://example.com')).toBe('/');
		expect(safeRedirect('//example.com')).toBe('/');
		expect(safeRedirect('/\\example.com')).toBe('/');
		expect(safeRedirect('/login?redirectTo=/sales')).toBe('/');
	});
});
