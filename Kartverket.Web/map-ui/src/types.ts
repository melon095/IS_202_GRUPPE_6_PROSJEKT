export interface Point {
	lat: number;
	lng: number;
	// TODO: Elevation!
	elevation?: number;
	createdAt?: string;
}

export interface PlacedObject {
	id?: string;
	points: Point[];
	typeId?: string;
	customType?: string;
	title?: string;
	description?: string;
	deleted: boolean;
	createdAt: string;
}

export interface Journey {
	id?: string;
	title?: string;
	description?: string;
	startTime: number;
	endTime?: number;
	objects: PlacedObject[];
}

export interface JourneyState {
	currentJourney: Journey | null;
	finishedJourney: Journey | null;
	isPlacingObject: boolean;
	currentObjectPoints: Point[];
}

export interface ObjectType {
	id: string;
	name: string;
	primaryImageUrl: string;
	markerImageUrl?: string;
}

export interface ServerSyncData {
	object: PlacedObject;
	journeyId?: string;
}

export interface ServerSyncResponse {
	journeyId: string;
	objectId: string;
}

export interface FinalizeJourneyObject {
	id: string;
	title?: string;
	description?: string;
	points: Point[];
	typeId?: string;
	customType?: string;
}

export interface FinalizeJourneyData {
	journey: {
		id: string;
		title?: string;
		description?: string;
	};
	objects: FinalizeJourneyObject[];
}

export interface ServerStateObjects {
	id: string;
	title: string | null;
	points: Point[];
	typeId?: string;
}

export type ServerStateResponse = ServerStateObjects[];

export type ResponseError = Record<string, string[]>;
