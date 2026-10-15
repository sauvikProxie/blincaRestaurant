import type { Product } from '$lib/types';

type SeedProduct = Omit<Product, 'id' | 'image' | 'isAvailable'> & { isAvailable?: boolean };

const products: SeedProduct[] = [
	{
		category: 'Starters',
		name: 'Toast Skagen',
		price: 14500,
		description: 'Hand-peeled shrimp, dill mayo and bleak roe on butter-fried brioche.'
	},
	{
		category: 'Starters',
		name: 'Burrata and charred tomatoes',
		price: 14900,
		description: 'Creamy burrata, blistered cherry tomatoes, basil oil and sourdough.'
	},
	{
		category: 'Starters',
		name: 'Crispy chicken wings',
		price: 12500,
		description: 'Six wings with smoked chilli glaze and a blue cheese dip.'
	},
	{
		category: 'Starters',
		name: 'Garlic flatbread',
		price: 6900,
		description: 'Straight from the oven with garlic butter and sea salt.'
	},
	{
		category: 'Wood-fired pizza',
		name: 'Margherita',
		price: 14900,
		description: 'San Marzano tomato, fior di latte and fresh basil.'
	},
	{
		category: 'Wood-fired pizza',
		name: 'Funghi and truffle',
		price: 17900,
		description: 'Mixed mushrooms, truffle cream, mozzarella and thyme.'
	},
	{
		category: 'Wood-fired pizza',
		name: 'Nduja and hot honey',
		price: 17500,
		description: 'Spicy nduja, mozzarella, red onion and chilli honey.',
		isAvailable: false
	},
	{
		category: 'Wood-fired pizza',
		name: 'Prosciutto and rocket',
		price: 18500,
		description: 'Parma ham, rocket, parmesan and a drizzle of olive oil.'
	},
	{
		category: 'Mains',
		name: 'Swedish meatballs',
		price: 19500,
		description: 'Cream gravy, mashed potatoes, lingonberries and pickled cucumber.'
	},
	{
		category: 'Mains',
		name: 'Grilled salmon',
		price: 22900,
		description: 'Dill potatoes, brown butter and horseradish cream.'
	},
	{
		category: 'Mains',
		name: 'Smash burger and fries',
		price: 17900,
		description: 'Double patty, cheddar, pickles, house sauce and rosemary fries.'
	},
	{
		category: 'Mains',
		name: 'Halloumi burger',
		price: 16900,
		description: 'Grilled halloumi, harissa mayo, slaw and fries.'
	},
	{
		category: 'Mains',
		name: 'Chicken shawarma bowl',
		price: 16500,
		description: 'Spiced chicken, herbed rice, pickled red onion and garlic yoghurt.'
	},
	{
		category: 'Sides',
		name: 'Rosemary fries',
		price: 5500,
		description: 'Crispy fries tossed in rosemary salt.'
	},
	{
		category: 'Sides',
		name: 'Caesar side salad',
		price: 6500,
		description: 'Little gem, parmesan, croutons and anchovy dressing.'
	},
	{
		category: 'Sides',
		name: 'Pickled cucumber salad',
		price: 4500,
		description: 'Quick-pickled cucumber with dill and white pepper.'
	},
	{
		category: 'Desserts',
		name: 'Kladdkaka',
		price: 7900,
		description: 'Gooey chocolate cake with whipped cream and berries.'
	},
	{
		category: 'Desserts',
		name: 'Cardamom bun',
		price: 4500,
		description: 'Baked this morning, pearl sugar on top.',
		isAvailable: false
	},
	{
		category: 'Desserts',
		name: 'Vanilla panna cotta',
		price: 7500,
		description: 'Set vanilla cream with sea buckthorn coulis.'
	},
	{
		category: 'Drinks',
		name: 'Elderflower lemonade',
		price: 4500,
		description: 'House-made and lightly sparkling.'
	},
	{
		category: 'Drinks',
		name: 'Lingonberry soda',
		price: 3900,
		description: 'Tart, fizzy and very Swedish.'
	},
	{
		category: 'Drinks',
		name: 'Cold brew coffee',
		price: 4900,
		description: 'Steeped for 18 hours, served over ice.'
	},
	{ category: 'Drinks', name: 'Sparkling water', price: 2900, description: '33 cl bottle.' }
];

export function seedProducts(): Product[] {
	return products.map((product, index) => ({
		...product,
		id: `prd_${String(index + 1).padStart(2, '0')}`,
		image: '',
		isAvailable: product.isAvailable ?? true
	}));
}
