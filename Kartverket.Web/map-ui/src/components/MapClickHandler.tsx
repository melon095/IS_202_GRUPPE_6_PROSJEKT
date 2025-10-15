import { LeafletMouseEvent } from "leaflet";
import React, { useCallback } from "react";
import { useMapEvent } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { Point } from "../types";

export const MapClickHandler = React.memo(() => {
	const { isPlacingObject, addPointToCurrentObject, currentJourney } = useJourney();

	useMapEvent(
		"click",
		useCallback(
			(e: LeafletMouseEvent) => {
				if (!isPlacingObject || !currentJourney) return;

				const point: Point = { lat: e.latlng.lat, lng: e.latlng.lng };

				addPointToCurrentObject(point);
			},
			[isPlacingObject, addPointToCurrentObject, currentJourney]
		)
	);

	return null;
});
