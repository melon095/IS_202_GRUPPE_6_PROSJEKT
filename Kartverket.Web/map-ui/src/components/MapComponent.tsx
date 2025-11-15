import { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import React from "react";
import { FeatureGroup, LayersControl, MapContainer, TileLayer, TileLayerProps, ZoomControl } from "react-leaflet";

import "../css/MapComponent.css";
import "../css/zoom-control.css";
import { PlaceMode, Point } from "../types";
import { GPSMarker } from "./GPSMarker";
import { MapClickHandler } from "./MapClickHandler";
import { ObjectDefinition, ObjectMarkers } from "./ObjectMarkers";

const mapCenter = [58.1465456, 7.9911451] satisfies LatLngTuple;

const SHARED_TILE_PROPS: Partial<TileLayerProps> = {
	attribution: `&copy; <a href="https://www.kartverket.no/">Kartverket</a>`,
};

export interface MapComponentProps {
	children?: React.ReactNode;
	objects: ObjectDefinition[];
	placeMode: PlaceMode;
	onClick: (point: Point) => void;
	style?: React.CSSProperties;
}

export const MapComponent = ({ children, objects, placeMode, onClick, style }: MapComponentProps) => {
	return (
		<MapContainer center={mapCenter} zoom={13} style={style} zoomControl={false}>
			<ZoomControl position="bottomleft" />
			<MapClickHandler onClick={onClick} />
			{children}

			<LayersControl>
				<LayersControl.BaseLayer checked name="Topografisk">
					<TileLayer
						{...SHARED_TILE_PROPS}
						url="https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png"
					/>
				</LayersControl.BaseLayer>

				<LayersControl.BaseLayer name="Topografisk Gråtone">
					<TileLayer
						{...SHARED_TILE_PROPS}
						url="https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png"
					/>
				</LayersControl.BaseLayer>

				<LayersControl.BaseLayer name="Satellitt">
					<TileLayer {...SHARED_TILE_PROPS} url="/Map/SatelliteTiles/{z}/{x}/{y}.jpg" />
				</LayersControl.BaseLayer>

				<LayersControl.Overlay name="Objekter" checked>
					<FeatureGroup>
						<ObjectMarkers objects={objects} placeMode={placeMode} />
					</FeatureGroup>
				</LayersControl.Overlay>
				<LayersControl.Overlay name="GPS Markør" checked>
					<GPSMarker />
				</LayersControl.Overlay>
			</LayersControl>
		</MapContainer>
	);
};
