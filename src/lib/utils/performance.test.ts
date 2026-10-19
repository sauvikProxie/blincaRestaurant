import { describe, expect, it } from 'vitest';
import { trend } from './performance';

describe('trend', () => {
	it('treats a rise as good when higher is better', () => {
		expect(trend(120, 100, 'higher')).toEqual({ percent: 20, direction: 'up', isGood: true });
	});

	it('treats a fall as good when lower is better', () => {
		expect(trend(3, 4, 'lower')).toEqual({ percent: 25, direction: 'down', isGood: true });
		expect(trend(5, 4, 'lower').isGood).toBe(false);
	});

	it('has no percentage when the previous period was zero', () => {
		expect(trend(4, 0, 'higher').percent).toBeNull();
	});
});
