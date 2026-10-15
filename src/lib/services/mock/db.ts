import type { Discount, Order, Product, Schedule, StatusOverride } from '$lib/types';
import { storage } from '../storage';
import { createRandom } from './random';
import { seedDiscounts } from './seed-discounts';
import { seedActiveOrders, seedOrderHistory } from './seed-orders';
import { seedOverrides } from './seed-overrides';
import { seedProducts } from './seed-products';
import { seedSchedule } from './seed-schedule';

/** Bump to reseed everyone's local mock data after a breaking change to the seeds. */
const SEED_VERSION = 1;

interface MockTables {
	orders: Order[];
	products: Product[];
	schedule: Schedule;
	discounts: Discount[];
	overrides: StatusOverride[];
	/** When each active order last changed status, to drive the rider simulation. */
	statusChangedAt: Record<string, string>;
}

type TableName = keyof MockTables;

const TABLES: TableName[] = ['orders', 'products', 'schedule', 'discounts', 'overrides', 'statusChangedAt'];

let tables: MockTables | null = null;

function seed(now: Date): MockTables {
	const random = createRandom(20261013);
	const schedule = seedSchedule();
	const products = seedProducts();
	const discounts = seedDiscounts(now);
	const context = { schedule, products, discounts };
	const history = seedOrderHistory(random, context, now);
	const nextSerial = (history.at(-1)?.serialNo ?? 1000) + 1;
	const active = seedActiveOrders(random, context, now, nextSerial);
	const recently = new Date(now.getTime() - 60_000).toISOString();
	return {
		orders: [...history, ...active],
		products,
		schedule,
		discounts,
		overrides: seedOverrides(schedule, now),
		statusChangedAt: Object.fromEntries(active.map((order) => [order.id, recently]))
	};
}

/** The mock database: seeded on first use, then read from and written to localStorage. */
export function db(): MockTables {
	if (tables) return tables;
	if (storage.get<number>('mock:version', 0) === SEED_VERSION) {
		const loaded = Object.fromEntries(TABLES.map((name) => [name, storage.get(name, null)]));
		if (TABLES.every((name) => loaded[name] !== null)) {
			tables = loaded as unknown as MockTables;
			return tables;
		}
	}
	tables = seed(new Date());
	for (const name of TABLES) storage.set(name, tables[name]);
	storage.set('mock:version', SEED_VERSION);
	return tables;
}

export function persist(...names: TableName[]): void {
	const current = db();
	for (const name of names) storage.set(name, current[name]);
}

export function nextSerialNo(): number {
	return db().orders.reduce((max, order) => Math.max(max, order.serialNo), 1000) + 1;
}
