import { TZDate } from '@date-fns/tz';
import { addDays, differenceInMinutes, format, isSameDay } from 'date-fns';
import { appConfig } from '$lib/config/app.config';

const { money, dateTime } = appConfig;

const moneyFormatters = new Map<number, Intl.NumberFormat>();

function moneyFormatter(fractionDigits: number): Intl.NumberFormat {
	let formatter = moneyFormatters.get(fractionDigits);
	if (!formatter) {
		formatter = new Intl.NumberFormat(money.locale, {
			style: 'currency',
			currency: money.currency,
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits
		});
		moneyFormatters.set(fractionDigits, formatter);
	}
	return formatter;
}

/**
 * Formats an amount in minor units, e.g. 14900 -> "149,00 kr".
 * `whole` drops the decimals when the amount is a whole number (menu prices).
 */
export function formatMoney(minor: number, options: { whole?: boolean } = {}): string {
	const major = minor / money.minorUnitsPerMajor;
	const digits = options.whole && Number.isInteger(major) ? 0 : 2;
	// Intl uses U+2212 for minus; the brand font only covers basic Latin, so use a hyphen.
	return moneyFormatter(digits).format(major).replace('\u2212', '-');
}

export function toMinor(major: number): number {
	return Math.round(major * money.minorUnitsPerMajor);
}

export function toMajor(minor: number): number {
	return minor / money.minorUnitsPerMajor;
}

export function formatPercentRate(rate: number): string {
	return `${Math.round(rate * 1000) / 10}%`;
}

export function formatSerial(serialNo: number): string {
	return `#${serialNo}`;
}

/** The restaurant runs on Stockholm time, whatever time zone the device is set to. */
const asDate = (value: Date | string | number) =>
	new TZDate(typeof value === 'string' ? Date.parse(value) : +value, appConfig.dateTime.timeZone);

export const formatTime = (value: Date | string | number) => format(asDate(value), dateTime.time);
export const formatDate = (value: Date | string | number) => format(asDate(value), dateTime.date);
export const formatShortDate = (value: Date | string | number) => format(asDate(value), dateTime.shortDate);
export const formatDateTime = (value: Date | string | number) => format(asDate(value), dateTime.dateTime);
export const formatWeekday = (value: Date | string | number) => format(asDate(value), dateTime.weekday);
export const formatMonth = (value: Date | string | number) => format(asDate(value), dateTime.month);

/** Formats a yyyy-MM-dd date (e.g. a business date) without shifting it across time zones. */
export function formatISODate(value: string, pattern: string = dateTime.date): string {
	const [y, m, d] = value.split('-').map(Number);
	return format(new Date(y, m - 1, d), pattern);
}

/** "today", "tomorrow" or the weekday name, relative to `now`. */
export function relativeDay(value: Date | number, nowValue: Date | number): string {
	const date = asDate(value);
	const now = asDate(nowValue);
	if (isSameDay(date, now)) return 'today';
	if (isSameDay(addDays(now, 1), date)) return 'tomorrow';
	return formatWeekday(date);
}

/** Short elapsed time in the brand voice: "Just now", "4 min ago", "1 h 12 min ago". */
export function formatTimeAgo(value: Date | string | number, now: Date): string {
	const minutes = Math.max(0, differenceInMinutes(now, asDate(value)));
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		const rest = minutes % 60;
		return rest ? `${hours} h ${rest} min ago` : `${hours} h ago`;
	}
	const days = Math.floor(hours / 24);
	return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
	return `${count} ${count === 1 ? singular : plural}`;
}
