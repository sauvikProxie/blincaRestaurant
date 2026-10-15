export interface GuideStep {
	text: string;
	/** In-app route the step refers to. */
	link?: { href: string; label: string };
}

export interface Guide {
	id: string;
	title: string;
	description: string;
	isNew: boolean;
	/** yyyy-MM-dd */
	publishedOn: string;
	steps: GuideStep[];
}
