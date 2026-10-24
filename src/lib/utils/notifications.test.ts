import { describe, expect, it } from 'vitest';
import type { AppNotification } from '$lib/types';
import { linkedOrderId, notificationText, ringingArrivals, unreadBadge } from './notifications';

const item = (id: string, kind: AppNotification['kind'], extra: Partial<AppNotification> = {}): AppNotification => ({
	id,
	kind,
	createdAt: 0,
	read: false,
	...extra
});

describe('ringingArrivals', () => {
	it('stays quiet on the first load', () => {
		const result = ringingArrivals(null, [item('a', 'new_order')]);
		expect(result.ring).toBe(false);
		expect([...result.seen]).toEqual(['a']);
	});

	it('rings for a new unread order alert', () => {
		expect(ringingArrivals(new Set(['a']), [item('b', 'new_order'), item('a', 'new_order')]).ring).toBe(true);
		expect(ringingArrivals(new Set(), [item('c', 'auto_accepted')]).ring).toBe(true);
	});

	it("doesn't ring for other kinds, read items or ones already seen", () => {
		expect(ringingArrivals(new Set(), [item('a', 'stock_back')]).ring).toBe(false);
		expect(ringingArrivals(new Set(), [item('a', 'new_order', { read: true })]).ring).toBe(false);
		expect(ringingArrivals(new Set(['a']), [item('a', 'new_order')]).ring).toBe(false);
	});
});

describe('notification text', () => {
	it('describes each kind', () => {
		expect(notificationText(item('a', 'new_order', { serialNo: 12, itemCount: 3 }))).toBe('New order #12 · 3 items');
		expect(notificationText(item('a', 'auto_accepted', { serialNo: 4, minutes: 25 }))).toBe(
			'Order #4 accepted automatically · 25 min'
		);
		expect(notificationText(item('a', 'order_cancelled'))).toMatch(/before it reached you/);
		expect(notificationText(item('a', 'stock_back', { itemNames: ['Fries', 'Cola'] }))).toBe(
			'Available again: Fries, Cola'
		);
	});

	it('links only orders the kitchen saw', () => {
		expect(linkedOrderId(item('a', 'new_order', { orderId: 'o1' }))).toBe('o1');
		expect(linkedOrderId(item('a', 'order_cancelled', { orderId: 'o1' }))).toBeUndefined();
	});

	it('shows the capped count as "or more"', () => {
		expect(unreadBadge(5, 99)).toBe('5');
		expect(unreadBadge(99, 99)).toBe('99+');
	});
});
