/**
 * Service wiring. Every component imports services from here.
 * To use a real backend, replace these mock factories with API-backed
 * implementations of the same interfaces (see ./types.ts).
 */
import {
	createMockDiscountsService,
	createMockMenuService,
	createMockPerformanceService,
	createMockScheduleService,
	createMockStatusService
} from './mock/catalog';
import { createMockAuthService } from './mock/auth';
import { createMockGuidesService } from './mock/guides';
import { createMockOrdersService } from './mock/orders';
import type {
	AuthService,
	DiscountsService,
	GuidesService,
	MenuService,
	OrdersService,
	PerformanceService,
	ScheduleService,
	StatusService
} from './types';

export const authService: AuthService = createMockAuthService();
export const ordersService: OrdersService = createMockOrdersService();
export const menuService: MenuService = createMockMenuService();
export const scheduleService: ScheduleService = createMockScheduleService();
export const statusService: StatusService = createMockStatusService();
export const discountsService: DiscountsService = createMockDiscountsService();
export const performanceService: PerformanceService = createMockPerformanceService();
export const guidesService: GuidesService = createMockGuidesService();

export { InvalidCredentialsError } from './errors';
export type * from './types';
