export interface Point {
	lat: number;
	lng: number;
	// TODO: Elevation!
	elevation?: number;
	createdAt?: string;
}

export interface PlacedHindrance {
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
	hindrances: PlacedHindrance[];
}

export enum PlaceMode {
	None,
	Point,
	Line,
	Area,
}

export const PlaceModeToString = {
	// TODO: Localize
	[PlaceMode.None]: "Ingen",
	[PlaceMode.Point]: "Punkt",
	[PlaceMode.Line]: "Linje",
	[PlaceMode.Area]: "Område",
};

export interface JourneyState {
	currentJourney: Journey | null;
	finishedJourney: Journey | null;
	isPlacingHindrance: boolean;
	placeMode: PlaceMode;
	currentHindrancePoints: Point[];
}

export interface HindranceType {
	id: string;
	name: string;
	primaryImageUrl: string;
	markerImageUrl?: string;
}

export interface ServerSyncData {
	journeyId?: string;
	hindrance: PlacedHindrance;
}

export interface ServerSyncResponse {
	journeyId: string;
	hindranceId: string;
}

export interface FinalizeJourneyData {
	journey: {
		id: string;
		title?: string;
		description?: string;
	};
	hindrances: PlacedHindrance[];
}

export type ServerStateResponse = PlacedHindrance[];

export type ResponseError = Record<string, string[]>;

export type HexColour = `#${string}`;

export type Colour = HexColour | string;
