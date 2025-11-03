import { LeafletMouseEvent } from "leaflet";
import React, { useCallback } from "react";
import { useMapEvent } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { PlaceMode, Point } from "../types";

export const MapClickHandler = React.memo(() => {
	const { addPointToCurrentObject, currentJourney, placeMode } = useJourney();

	useMapEvent(
		"click",
		useCallback(
			(e: LeafletMouseEvent) => {
				if (placeMode == PlaceMode.None || !currentJourney) return;

				const point: Point = { lat: e.latlng.lat, lng: e.latlng.lng };

				addPointToCurrentObject(point);
			},
			[addPointToCurrentObject, currentJourney, placeMode]
		)
	);

	return null;
});
