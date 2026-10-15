/**
 * App-wide settings. Currency, VAT and date/time formatting live here so they
 * can be changed in one place.
 */
export const appConfig = {
	restaurant: {
		name: 'Ember & Oak Kitchen'
	},
	money: {
		currency: 'SEK',
		/** Locale used for amounts, e.g. "1 249,00 kr". */
		locale: 'sv-SE',
		/** Amounts are stored as integers in the minor unit (ore). */
		minorUnitsPerMajor: 100
	},
	/** Swedish VAT on restaurant and catering services. Charged on the food subtotal after discounts. */
	vatRate: 0.12,
	dateTime: {
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
		pageSize: 10,
		/** An order counts as delayed when it is delivered later than this after it was placed. */
		delayedAfterMinutes: 45
	},
	/** Settings for the mock data layer only. */
	mock: {
		latencyMs: { min: 250, max: 650 },
		/** Probability (0-1) that a mock request fails, to exercise error states. */
		failureRate: 0,
		simulateIncomingOrders: true,
		newOrderEverySeconds: { min: 60, max: 90 },
		/** The one account the mock sign-in accepts, until a real auth API exists. */
		credentials: { phone: '0987654321', password: 'admin*123' }
	}
};
