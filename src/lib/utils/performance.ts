export interface Trend {
	/** Percent change vs the previous value; null when there is nothing to compare against. */
	percent: number | null;
	direction: 'up' | 'down' | 'flat';
	/** Whether the change is good news, given which direction is better. */
	isGood: boolean;
}

export function trend(current: number, previous: number, betterWhen: 'higher' | 'lower'): Trend {
	if (current === previous) return { percent: 0, direction: 'flat', isGood: true };
	const direction = current > previous ? 'up' : 'down';
	const percent = previous === 0 ? null : Math.round((Math.abs(current - previous) / previous) * 100);
	const isGood = betterWhen === 'higher' ? direction === 'up' : direction === 'down';
	return { percent, direction, isGood };
}
