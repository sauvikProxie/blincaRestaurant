import { api, type BoardCard, type HistoryRow, type OrderGetResult } from '$lib/convex/api';
import { convex } from '$lib/convex/client';
import { errorCode } from '$lib/convex/errors';
import type { OrderDetail, OrderStatus, OrderSummary } from '$lib/types';
import type { OrdersService } from '../types';

function toSummary(card: BoardCard): OrderSummary {
	return {
		id: card._id,
		serialNo: card.dailyNumber,
		status: card.status,
		fulfillment: card.fulfillment,
		customerName: card.customerFirstName,
		itemCount: card.itemCount,
		total: card.totalCents,
		placedAt: card.paidAt,
		acceptDeadline: card.acceptDeadline,
		estimatedReadyAt: card.estimatedReadyAt,
		readyAt: card.readyAt,
		scheduledFor: card.scheduledFor
	};
}

function historyToSummary(row: HistoryRow): OrderSummary {
	return {
		id: row._id,
		serialNo: row.dailyNumber,
		// History only ever holds finished orders.
		status: row.status as OrderStatus,
		fulfillment: row.fulfillment,
		customerName: row.customerName,
		total: row.totalCents,
		placedAt: row.placedAt,
		refundStatus: row.refundStatus
	};
}

/** Null for unpaid orders: they never reach the kitchen. */
function toDetail({ order, items, refund }: OrderGetResult): OrderDetail | null {
	if (order.status === 'awaiting_payment') return null;
	const address = order.deliveryAddress;
	const addressNote = address
		? [address.doorCode && `Door code ${address.doorCode}`, address.floor && `Floor ${address.floor}`]
				.filter(Boolean)
				.join(' · ')
		: '';
	return {
		id: order._id,
		serialNo: order.dailyNumber ?? 0,
		status: order.status,
		fulfillment: order.fulfillment,
		customerName: order.customerName,
		itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
		total: order.totalCents,
		placedAt: order.paidAt ?? order.placedAt,
		acceptDeadline: order.acceptDeadline,
		estimatedReadyAt: order.estimatedReadyAt,
		readyAt: order.readyAt,
		scheduledFor: order.scheduledFor,
		refundStatus: refund?.status ?? null,
		customer: {
			name: order.customerName,
			phone: order.customerPhone,
			address: address ? `${address.street}, ${address.postalCode} ${address.city}` : undefined,
			addressNote: addressNote || undefined
		},
		note: order.customerNote,
		lines: items.map((item) => ({
			id: item._id,
			name: item.name,
			variantName: item.variantName,
			quantity: item.quantity,
			unitPrice: item.unitPriceCents,
			total: item.lineTotalCents,
			note: item.note,
			menuItemId: item.menuItemId,
			variantId: item.variantId,
			options: item.options.map((option) => ({
				group: option.groupName,
				name: option.optionName,
				quantity: option.quantity,
				price: option.priceCents,
				optionId: option.optionId
			}))
		})),
		subtotal: order.subtotalCents,
		discount: order.discountCents,
		deliveryFee: order.deliveryFeeCents,
		vat: order.vatBreakdown.map((row) => ({ rate: row.basisPoints / 10_000, amount: row.vatCents })),
		prepMinutes: order.prepMinutes,
		acceptedAt: order.acceptedAt,
		pickedUpAt: order.pickedUpAt,
		rejectedAt: order.rejectedAt,
		rejectReason: order.rejectReason,
		rejectNote: order.rejectNote,
		cancelledAt: order.cancelledAt,
		cancelReason: order.cancelReason
	};
}

export function createConvexOrdersService(): OrdersService {
	return {
		watchBoard(onChange, onError) {
			return convex().onUpdate(api.orders.board, {}, (cards) => onChange(cards.map(toSummary)), onError);
		},

		watchOrder(id, onChange, onError) {
			return convex().onUpdate(
				api.orders.get,
				{ orderId: id },
				(result) => onChange(toDetail(result)),
				// A bad or foreign id in the URL reads as "not found", not as a failure.
				(error) => (errorCode(error) === 'NOT_FOUND' ? onChange(null) : onError(error))
			);
		},

		async accept(id, prepMinutes) {
			await convex().mutation(api.orders.accept, prepMinutes === undefined ? { orderId: id } : { orderId: id, prepMinutes });
		},

		async reject(id, { reason, note, unavailable }) {
			await convex().mutation(api.orders.reject, {
				orderId: id,
				reason,
				...(note?.trim() ? { note: note.trim() } : {}),
				...(reason === 'item_unavailable' ? { unavailable } : {})
			});
		},

		async delay(id, minutes) {
			await convex().mutation(api.orders.delay, { orderId: id, minutes });
		},

		async markReady(id) {
			await convex().mutation(api.orders.markReady, { orderId: id });
		},

		async handOver(id) {
			await convex().mutation(api.orders.handOver, { orderId: id });
		},

		async history(query, cursor, pageSize) {
			const result = await convex().query(api.orderReports.history, {
				fromDate: query.from,
				toDate: query.to,
				...(query.status ? { status: query.status } : {}),
				...(query.search?.trim() ? { search: query.search.trim() } : {}),
				paginationOpts: { numItems: pageSize, cursor }
			});
			return { orders: result.page.map(historyToSummary), cursor: result.continueCursor, isDone: result.isDone };
		},

		async simulate() {
			await convex().mutation(api.devOrders.simulateForMe, {});
		}
	};
}
