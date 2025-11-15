import { LeafletMouseEvent } from "leaflet";
import React, { useCallback } from "react";
import { useMapEvent } from "react-leaflet";

import { Point } from "../types";

export interface MapClickHandlerProps {
	onClick: (point: Point) => void;
}

export const MapClickHandler = React.memo(({ onClick }: MapClickHandlerProps) => {
	useMapEvent(
		"click",
		useCallback(
			(e: LeafletMouseEvent) => {
				const point: Point = { lat: e.latlng.lat, lng: e.latlng.lng };

				onClick(point);
			},
			[onClick]
		)
	);

	return null;
});
