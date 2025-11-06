import { LeafletMouseEvent } from "leaflet";
import React, { useCallback } from "react";
import { useMapEvent } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { Point } from "../types";

export const MapClickHandler = React.memo(() => {
	const { addPointToCurrentHindrance } = useJourney();

	useMapEvent(
		"click",
		useCallback(
			(e: LeafletMouseEvent) => {
				const point: Point = { lat: e.latlng.lat, lng: e.latlng.lng };

				addPointToCurrentHindrance(point);
			},
			[addPointToCurrentHindrance]
		)
	);

	return null;
});
