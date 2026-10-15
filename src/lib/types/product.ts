export interface Product {
	id: string;
	name: string;
	category: string;
	/** Minor units (ore). */
	price: number;
	/** Image URL. Empty until real photos exist - the UI shows a placeholder. */
	image: string;
	description: string;
	isAvailable: boolean;
}
