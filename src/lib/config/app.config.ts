/**
 * App-wide settings. Currency and date/time formatting live here so they
 * can be changed in one place. Backend URLs come from .env (see .env.example).
 */
export const appConfig = {
	money: {
		currency: 'SEK',
		/** Locale used for amounts, e.g. "1 249,00 kr". */
		locale: 'sv-SE',
		/** Amounts are stored as integers in the minor unit (ore). */
		minorUnitsPerMajor: 100
	},
	dateTime: {
		/** Every time is shown on the restaurant's clock, whatever the device is set to. */
		timeZone: 'Europe/Stockholm',
		/** date-fns format patterns. Sweden uses the 24-hour clock. */
		time: 'HH:mm',
		date: 'd MMM yyyy',
		dateTime: 'd MMM yyyy, HH:mm',
		shortDate: 'd MMM',
		weekday: 'EEEE',
		month: 'MMMM yyyy',
		/** Monday */
		weekStartsOn: 1 as const
	},
	orders: {
		/** Rows per page on Previous Orders. */
		pageSize: 20,
		/** Default range for Previous Orders, in days including today. The backend allows up to 92. */
		historyDays: 30
	}
};
