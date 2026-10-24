import { describe, expect, it } from 'vitest';
import { activeBusyMinutes, defaultPrepMinutes, nearestPrepChoice, prepChoices } from './order-rules';

const NOW = 1_800_000_000_000;

describe('activeBusyMinutes', () => {
	it('is 0 when busy mode is off', () => {
		expect(activeBusyMinutes({}, NOW)).toBe(0);
	});

	it('lasts until busyUntil, or until turned off', () => {
		expect(activeBusyMinutes({ busyExtraMinutes: 20, busyUntil: NOW + 1 }, NOW)).toBe(20);
		expect(activeBusyMinutes({ busyExtraMinutes: 20, busyUntil: NOW }, NOW)).toBe(0);
		expect(activeBusyMinutes({ busyExtraMinutes: 10 }, NOW)).toBe(10);
	});
});

describe('defaultPrepMinutes', () => {
	it('adds busy minutes, capped at 60', () => {
		expect(defaultPrepMinutes({ prepTimeMinutes: 20, busyExtraMinutes: 20 }, NOW)).toBe(40);
		expect(defaultPrepMinutes({ prepTimeMinutes: 45, busyExtraMinutes: 30 }, NOW)).toBe(60);
	});

	it('never shortens a slow kitchen', () => {
		expect(defaultPrepMinutes({ prepTimeMinutes: 75, busyExtraMinutes: 10 }, NOW)).toBe(75);
	});
});

describe('prep choices', () => {
	it("offers a slow kitchen's usual time on top of the standard list", () => {
		expect(prepChoices(20)).toEqual([10, 15, 20, 30, 45, 60]);
		expect(prepChoices(75)).toEqual([10, 15, 20, 30, 45, 60, 75]);
	});

	it('rounds up to the next choice', () => {
		expect(nearestPrepChoice(25)).toBe(30);
		expect(nearestPrepChoice(20)).toBe(20);
		expect(nearestPrepChoice(90)).toBe(60);
		expect(nearestPrepChoice(75, prepChoices(75))).toBe(75);
	});
});
