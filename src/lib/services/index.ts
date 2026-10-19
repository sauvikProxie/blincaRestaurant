/**
 * Service wiring. Every component and store imports services from here,
 * never from ./convex directly, so the backend can change behind these interfaces.
 */
import { createConvexAuthService } from './convex/auth';
import { createConvexOrdersService } from './convex/orders';
import { createConvexRestaurantService } from './convex/restaurant';
import { createConvexStatsService } from './convex/stats';
import type { AuthService, OrdersService, RestaurantService, StatsService } from './types';

export const authService: AuthService = createConvexAuthService();
export const ordersService: OrdersService = createConvexOrdersService();
export const restaurantService: RestaurantService = createConvexRestaurantService();
export const statsService: StatsService = createConvexStatsService();

export { InvalidCredentialsError, NoRestaurantAccessError, TooManyAttemptsError } from './errors';
export type * from './types';
