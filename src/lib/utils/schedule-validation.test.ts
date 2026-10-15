import { describe, expect, it } from 'vitest';
import { WEEKDAYS, type Schedule } from '$lib/types';
import { copyDayTo, schedulesEqual, validateDay, validateSchedule } from './schedule-validation';

const base: Schedule = WEEKDAYS.map((day) => ({ day, isOpen: true, openTime: '10:00', closeTime: '22:00' }));

describe('validateDay', () => {
	it('accepts regular and overnight hours', () => {
		expect(validateDay({ day: 'monday', isOpen: true, openTime: '10:00', closeTime: '22:00' })).toEqual({});
		expect(validateDay({ day: 'friday', isOpen: true, openTime: '18:00', closeTime: '02:00' })).toEqual({});
	});

	it('requires both times when open', () => {
		const errors = validateDay({ day: 'monday', isOpen: true, openTime: '', closeTime: '' });
		expect(errors.openTime).toBeDefined();
		expect(errors.closeTime).toBeDefined();
	});

	it('rejects identical opening and closing times', () => {
		expect(validateDay({ day: 'monday', isOpen: true, openTime: '10:00', closeTime: '10:00' }).closeTime).toBe(
			'Closing time must differ from opening time'
		);
	});

	it('does not validate closed days', () => {
		expect(validateDay({ day: 'monday', isOpen: false, openTime: '', closeTime: '' })).toEqual({});
	});
});

describe('schedule helpers', () => {
	it('copies one day to others', () => {
		const edited = base.map((d) => (d.day === 'monday' ? { ...d, openTime: '07:00', closeTime: '15:00' } : d));
		const copied = copyDayTo(edited, 'monday', ['tuesday', 'wednesday', 'thursday', 'friday']);
		expect(copied.slice(0, 5).every((d) => d.openTime === '07:00' && d.closeTime === '15:00')).toBe(true);
		expect(copied[5].openTime).toBe('10:00');
	});

	it('flags invalid schedules and compares schedules', () => {
		const broken = base.map((d) => (d.day === 'sunday' ? { ...d, closeTime: '10:00' } : d));
		expect(validateSchedule(base)).toEqual({});
		expect(validateSchedule(broken).sunday?.closeTime).toBeDefined();
		expect(schedulesEqual(base, structuredClone(base))).toBe(true);
		expect(schedulesEqual(base, broken)).toBe(false);
	});
});
