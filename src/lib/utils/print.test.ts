import { describe, expect, it } from 'vitest';
import { canPrint, newlyAccepted } from './print';

describe('newlyAccepted', () => {
	it('prints nothing on the first load', () => {
		expect(newlyAccepted(null, [{ id: 'a', status: 'accepted' }])).toEqual([]);
	});

	it('finds orders that moved to accepted or arrived accepted', () => {
		const previous = new Map([
			['a', 'new'],
			['b', 'accepted']
		]);
		const orders = [
			{ id: 'a', status: 'accepted' },
			{ id: 'b', status: 'accepted' },
			{ id: 'c', status: 'accepted' },
			{ id: 'd', status: 'new' }
		];
		expect(newlyAccepted(previous, orders)).toEqual(['a', 'c']);
	});
});

describe('canPrint', () => {
	it('is off on phones and tablets', () => {
		expect(canPrint('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36')).toBe(false);
		expect(canPrint('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe(false);
	});
});
