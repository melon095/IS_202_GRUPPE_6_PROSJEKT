import "leaflet/dist/leaflet.css";
import "../css/zoom-control.css";
import "../css/MapCOmponent.css";

import { DomEvent, LatLngTuple, LeafletMouseEvent } from "leaflet";
import React, { useCallback, useEffect, useRef } from "react";
import {
	MapContainer,
	Marker,
	Polyline,
	TileLayer,
	TileLayerProps,
	useMapEvent,
} from "react-leaflet";
import { useJourney } from "../contextx/journeyContext";
import { useServerSync } from "../hooks/useServerSync";
import { Point } from "../types";

const mapCenter = [58.1465456, 7.9911451] satisfies LatLngTuple;

const tileProps = {
	attribution: `&copy; <a href="http://www.kartverket.no/">Kartverket</a>`,
	url: `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png`,
} satisfies TileLayerProps;

const MapClickHandler = React.memo(() => {
	const { isPlacingObject, addPointToCurrentObject, currentJourney } =
		useJourney();
	const { syncObject } = useServerSync();

	useMapEvent(
		"click",
		useCallback(
			(e: LeafletMouseEvent) => {
				if (!isPlacingObject || !currentJourney) return;
				// TODO
				e.originalEvent.preventDefault();
				e.originalEvent.view.L.DomEvent.stopPropagation(e);

				const point: Point = { lat: e.latlng.lat, lng: e.latlng.lng };

				addPointToCurrentObject(point);
			},
			[
				isPlacingObject,
				addPointToCurrentObject,
				currentJourney,
				syncObject,
			]
		)
	);

	return null;
});

const ObjectMarkers = React.memo(() => {
	const { currentJourney, currentObjectPoints } = useJourney();

	return (
		<React.Fragment>
			{currentJourney?.objects.map((obj) => (
				<React.Fragment key={obj.id}>
					{obj?.points.map((point, index) => (
						<Marker
							key={`${obj.id}-point-${index}`}
							position={[point.lat, point.lng]}
						/>
					))}

					{obj.points.length > 1 && (
						<Polyline
							positions={obj.points.map((point) => [
								point.lat,
								point.lng,
							])}
							color="blue"
						/>
					)}
				</React.Fragment>
			))}

			{currentObjectPoints.map((point, idx) => (
				<Marker
					key={`current-point-${idx}`}
					position={[point.lat, point.lng]}
				/>
			))}

			{currentObjectPoints.length > 1 && (
				<Polyline
					positions={currentObjectPoints.map((point) => [
						point.lat,
						point.lng,
					])}
					color="red"
				/>
			)}
		</React.Fragment>
	);
});

interface MapComponentProps {
	children?: React.ReactNode;
}

export const MapComponent = ({ children }: MapComponentProps) => {
	return (
		<MapContainer
			center={mapCenter}
			zoom={13}
			style={{ height: "100vh", width: "100vw" }}
			zoomControl={false}
		>
			<TileLayer {...tileProps} />
			<MapClickHandler />
			<ObjectMarkers />

			{children}
		</MapContainer>
	);
};
