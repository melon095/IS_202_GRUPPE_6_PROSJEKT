import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import L from "leaflet";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useMap } from "react-leaflet";
import { scan } from "react-scan";
// eslint-disable-next-line import/no-unresolved
import "vite/modulepreload-polyfill";

import { MapComponent } from "./components/MapComponent";
import { ObjectDefinition } from "./components/ObjectMarkers";
import { ObjectTypesProvider } from "./contexts/ObjectTypesContext";
import { useObjectTypes } from "./hooks/useObjectTypes";
import { PlacedObject, PlaceMode, Point } from "./types";

declare global {
	export interface AppData {
		mapElementId: string;
		objectDefinitions: ObjectDefinition[];
		selectedObject?: PlacedObject & { centroidPoint: Point };
	}

	// eslint-disable-next-line no-var
	export var APP_DATA: AppData;
}

if (process.env.NODE_ENV === "development") {
	scan({
		enabled: true,
	});
}

if (window.APP_DATA === undefined) {
	throw new Error("APP_DATA is not defined");
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const container = document.getElementById(window.APP_DATA.mapElementId);
const root = createRoot(container!);

const CENTRE_OF_NORWAY = L.latLng(64.0, 11.0);

const Centroid = () => {
	const map = useMap();
	if (!map) return null;

	const selectedObject = window.APP_DATA.selectedObject;
	const objects = window.APP_DATA.objectDefinitions;

	if (selectedObject && selectedObject.centroidPoint) {
		const centroid = selectedObject.centroidPoint;
		const points = selectedObject.points;

		const bounds = L.latLngBounds(points);
		bounds.extend([centroid.lat, centroid.lng]);
		map.fitBounds(bounds, {
			padding: [50, 50],
		});
	} else if (objects.length <= 0) {
		map.setView(CENTRE_OF_NORWAY, 5);
	} else {
		const points = window.APP_DATA.objectDefinitions.flatMap((o) =>
			o.objects.flatMap((obj) => obj.points.map((p) => L.latLng(p.lat, p.lng)))
		);

		const bounds = L.latLngBounds(points);
		map.fitBounds(bounds, {
			padding: [50, 50],
		});
	}

	return null;
};

const MapWrapper = () => {
	const { isLoading } = useObjectTypes();

	if (isLoading) return null;

	return (
		<MapComponent
			objects={window.APP_DATA.objectDefinitions}
			placeMode={PlaceMode.None}
			onClick={() => {}}
			style={{ height: "100vh", width: "100%" }}
		>
			<Centroid />
		</MapComponent>
	);
};

root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ReactQueryDevtools initialIsOpen={false} />

			<ObjectTypesProvider>
				<MapWrapper />
			</ObjectTypesProvider>
		</QueryClientProvider>
	</StrictMode>
);
