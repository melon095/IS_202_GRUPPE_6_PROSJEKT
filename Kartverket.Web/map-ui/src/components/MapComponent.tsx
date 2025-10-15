import { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import React from "react";
import { MapContainer, TileLayer, TileLayerProps } from "react-leaflet";

import "../css/MapComponent.css";
import "../css/zoom-control.css";
import { MapClickHandler } from "./MapClickHandler";
import { ObjectMarkers } from "./ObjectMarkers";
import { ServerMarkers } from "./ServerMarkers";

const mapCenter = [58.1465456, 7.9911451] satisfies LatLngTuple;

const tileProps = {
	attribution: `&copy; <a href="http://www.kartverket.no/">Kartverket</a>`,
	url: `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png`,
} satisfies TileLayerProps;

interface MapComponentProps {
	children?: React.ReactNode;
}

export const MapComponent = ({ children }: MapComponentProps) => {
	return (
		<MapContainer center={mapCenter} zoom={13} style={{ height: "100vh", width: "100vw" }} zoomControl={false}>
			<TileLayer {...tileProps} />
			<MapClickHandler />
			<ObjectMarkers />
			<ServerMarkers />

			{children}
		</MapContainer>
	);
};
