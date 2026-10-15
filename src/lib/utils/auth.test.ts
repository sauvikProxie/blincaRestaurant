import { describe, expect, it } from 'vitest';
import { normalizePhone, safeRedirect, validateCredentials } from './auth';

describe('normalizePhone', () => {
	it('strips spaces, dashes, dots and brackets', () => {
		expect(normalizePhone(' 098-765 43.21 ')).toBe('0987654321');
		expect(normalizePhone('(098) 765 4321')).toBe('0987654321');
		expect(normalizePhone('+46 70 123 45 67')).toBe('+46701234567');
	});
});

describe('validateCredentials', () => {
	it('accepts a phone number and password', () => {
		expect(validateCredentials({ phone: '098 765 43 21', password: 'admin*123' })).toEqual({});
	});

	it('requires both fields', () => {
		expect(validateCredentials({ phone: '  ', password: '' })).toEqual({
			phone: 'Enter your phone number',
			password: 'Enter your password'
		});
	});

	it('rejects letters and numbers that are too short', () => {
		expect(validateCredentials({ phone: '0987abc', password: 'x' }).phone).toBeDefined();
		expect(validateCredentials({ phone: '12345', password: 'x' }).phone).toBeDefined();
	});
});

describe('safeRedirect', () => {
	it('keeps in-app paths with their query', () => {
		expect(safeRedirect('/orders?order=ord_1')).toBe('/orders?order=ord_1');
	});

	it('falls back to Home for anything else', () => {
		expect(safeRedirect(null)).toBe('/');
		expect(safeRedirect('')).toBe('/');
		expect(safeRedirect('https://example.com')).toBe('/');
		expect(safeRedirect('//example.com')).toBe('/');
		expect(safeRedirect('/\\example.com')).toBe('/');
		expect(safeRedirect('/login?redirectTo=/menu')).toBe('/');
	});
});
