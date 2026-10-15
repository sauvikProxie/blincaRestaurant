import type { Guide } from '$lib/types';
import type { GuidesService } from '../types';
import { mockRequest } from './latency';

const GUIDES: Guide[] = [
	{
		id: 'open-closed',
		title: 'Open or close your restaurant',
		description: 'Your status follows your hours on its own. Here is how to step in when you need to.',
		isNew: true,
		publishedOn: '2026-10-08',
		steps: [
			{
				text: 'Go to Home. The big card at the top shows whether you are open or closed right now, and when that changes next.',
				link: { href: '/', label: 'Go to Home' }
			},
			{
				text: 'Flip the switch to close or open straight away. If you still have active orders, we will check with you before closing.'
			},
			{
				text: 'A manual change lasts until your next scheduled opening or closing time. Then we hand you back to your schedule automatically.'
			},
			{
				text: 'Changed your mind? Tap "Return to schedule" on the card to go back to your hours right away.'
			},
			{
				text: 'Your Open or Closed badge sits in the header on every page, so you always know where you stand.'
			}
		]
	},
	{
		id: 'scheduled-hours',
		title: 'Set your opening hours',
		description: 'Tell us when you are open each day, late nights included.',
		isNew: true,
		publishedOn: '2026-10-08',
		steps: [
			{ text: 'Open Scheduled Hours from the sidebar.', link: { href: '/schedule', label: 'Go to Scheduled Hours' } },
			{ text: 'Switch each day open or closed. Closed days stay closed all day.' },
			{
				text: 'Pick an opening and closing time for each open day. Open late? Set a closing time earlier than the opening time, like 18:00 to 02:00, and we will mark it "next day".'
			},
			{ text: 'Use "Copy to" on any day to give other days the same hours in one go.' },
			{ text: 'Tap Save. Your Open or Closed status follows the new hours straight away.' }
		]
	},
	{
		id: 'discounts',
		title: 'Create and manage a discount',
		description: 'Bring in more orders with percentage, fixed, bank, free delivery or buy 1 get 1 offers.',
		isNew: false,
		publishedOn: '2026-09-22',
		steps: [
			{ text: 'Open Discounts from the sidebar.', link: { href: '/discounts', label: 'Go to Discounts' } },
			{ text: 'Tap "Create discount" and choose the type of offer.' },
			{
				text: 'Fill in the value, minimum order, any cap and the dates it runs. Bank offers also need the bank name.'
			},
			{ text: 'Use the switch on any offer to pause or restart it. Expired offers are greyed out.' },
			{ text: 'Use Edit or Delete on a card to change or remove it. We always ask before deleting.' }
		]
	},
	{
		id: 'menu-availability',
		title: 'Mark a dish as unavailable',
		description: 'Run out of something? Hide it in seconds and bring it back just as fast.',
		isNew: false,
		publishedOn: '2026-09-15',
		steps: [
			{ text: 'Open Menu from the sidebar.', link: { href: '/menu', label: 'Go to Menu' } },
			{ text: 'Find the dish by scrolling its category or using search.' },
			{
				text: 'Switch it off. It moves to Unavailable Products and customers stop seeing it. Tap Undo on the message if that was a slip.'
			},
			{ text: 'When it is back, switch it on again from either tab.' }
		]
	},
	{
		id: 'team-performance',
		title: 'Read your team performance',
		description: 'See how your month is going and what changed since last month.',
		isNew: false,
		publishedOn: '2026-09-01',
		steps: [
			{
				text: 'Open Team Performance from the sidebar. It starts on the current month.',
				link: { href: '/performance', label: 'Go to Team Performance' }
			},
			{ text: 'Use the arrows next to the month to look back at earlier months.' },
			{
				text: 'Each card compares with the month before. For delivered orders and ratings, up is good. For cancelled, delayed and hours missed, down is good.'
			},
			{
				text: 'Hours missed counts scheduled open hours when you had closed manually. Fewer missed hours means more chances to take orders.'
			}
		]
	},
	{
		id: 'order-details',
		title: 'Check an order and its amounts',
		description: 'Everything about an order in one place: items, notes and the full price breakdown.',
		isNew: false,
		publishedOn: '2026-08-20',
		steps: [
			{
				text: 'Tap any order in Active Orders on Home, or in Previous Orders.',
				link: { href: '/orders', label: 'Go to Previous Orders' }
			},
			{ text: 'The order opens on the side with its status, time placed and customer details.' },
			{ text: 'Check the items, quantities and any notes from the customer before you start cooking.' },
			{
				text: 'The amount breakdown shows the subtotal, any discount, VAT, the delivery fee and the total. It always adds up.'
			},
			{ text: 'For active orders, use the buttons at the bottom to accept, reject or move the order along.' }
		]
	}
];

export function createMockGuidesService(): GuidesService {
	return { list: () => mockRequest(() => GUIDES) };
}
