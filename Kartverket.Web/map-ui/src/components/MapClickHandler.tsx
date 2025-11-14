import { LeafletMouseEvent } from "leaflet";
import React, { useCallback } from "react";
import { useMapEvent } from "react-leaflet";

import { useJourney } from "../hooks/useJourney";
import { Point } from "../types";

export const MapClickHandler = React.memo(() => {
	const { addPointToCurrentObject } = useJourney();

	useMapEvent(
		"click",
		useCallback(
			(e: LeafletMouseEvent) => {
				const point: Point = { lat: e.latlng.lat, lng: e.latlng.lng };

				addPointToCurrentObject(point);
			},
			[addPointToCurrentObject]
		)
	);

	return null;
});
