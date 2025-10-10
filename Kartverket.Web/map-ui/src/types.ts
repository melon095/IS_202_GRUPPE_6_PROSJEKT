export interface Point {
	lat: number;
	lng: number;
	timestamp?: number;
}

export interface PlacedObject {
	id: string;
	points: Point[];
	type?: string;
	title?: string;
	description?: string;
	createdAt?: string;
}

export interface Journey {
	id: string;
	startTime: number;
	endTime?: number;
	objects: PlacedObject[];
}

export interface JourneyState {
	currentJourney: Journey | null;
	isPlacingObject: boolean;
	currentObjectPoints: Point[];
	journeyHistory: Journey[];
}
