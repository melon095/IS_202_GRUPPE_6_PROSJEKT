import { LatLngLiteral } from "leaflet";

export interface Point extends LatLngLiteral {
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

export const PlaceModeToString = {
	[PlaceMode.None]: "Ingen",
	[PlaceMode.Point]: "Punkt",
	[PlaceMode.Line]: "Linje",
	[PlaceMode.Area]: "Område",
};

export type GeometryType = Omit<PlaceMode, PlaceMode.None>;

export interface JourneyState {
	currentJourney: Journey | null;
	finishedJourney: Journey | null;
	placeMode: PlaceMode;
	currentObjectPoints: Point[];
}

export interface ObjectTypesListResponse {
	objectTypes: ObjectType[];

	// key = GeometryType, value = ObjectType.id
	standardTypeIds: Record<number, string>;
}

export interface ObjectType {
	id: string;
	name: string;
	imageUrl?: string;
	colour?: Colour;
	geometryType: GeometryType;
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

export type HexColour = `#${string}`;

export type Colour = HexColour | string;
