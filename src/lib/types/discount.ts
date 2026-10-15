export const DISCOUNT_TYPES = ['percentage', 'flat', 'bank_offer', 'free_delivery', 'bogo'] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export interface Discount {
	id: string;
	type: DiscountType;
	title: string;
	/** Percent (1-100) for percentage and bank offers, minor units for flat, 0 otherwise. */
	value: number;
	/** Minor units. 0 means no minimum. */
	minOrder: number;
	/** Minor units. Cap for percentage-based offers; 0 means no cap. */
	maxDiscount: number;
	bankName?: string;
	/** yyyy-MM-dd, inclusive. */
	validFrom: string;
	/** yyyy-MM-dd, inclusive. */
	validTo: string;
	isActive: boolean;
}

export type DiscountInput = Omit<Discount, 'id'>;

/** Where the offer sits in time, independent of its on/off toggle. */
export type DiscountPhase = 'scheduled' | 'live' | 'expired';
