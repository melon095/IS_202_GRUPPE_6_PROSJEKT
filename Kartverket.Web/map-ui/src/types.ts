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
	geometryType: Omit<PlaceMode, PlaceMode.None>;
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

export enum PlaceMode {
	None,
	Point,
	Line,
	Area,
}

export interface JourneyState {
	currentJourney: Journey | null;
	finishedJourney: Journey | null;
	placeMode: PlaceMode;
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

export interface FinalizeJourneyData {
	journey: {
		id: string;
		title?: string;
		description?: string;
	};
	objects: PlacedObject[];
}

export type ServerStateResponse = PlacedObject[];

export type ResponseError = Record<string, string[]>;
