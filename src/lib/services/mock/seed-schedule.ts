import type { Schedule } from '$lib/types';

/** Closed on Mondays, open late on Friday and Saturday nights. */
export function seedSchedule(): Schedule {
	return [
		{ day: 'monday', isOpen: false, openTime: '11:00', closeTime: '22:00' },
		{ day: 'tuesday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
		{ day: 'wednesday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
		{ day: 'thursday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
		{ day: 'friday', isOpen: true, openTime: '11:00', closeTime: '01:00' },
		{ day: 'saturday', isOpen: true, openTime: '12:00', closeTime: '01:00' },
		{ day: 'sunday', isOpen: true, openTime: '12:00', closeTime: '21:00' }
	];
}
