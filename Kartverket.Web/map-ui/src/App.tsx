import "leaflet/dist/leaflet.css";
import "./css/zoom-control.css";

import { LatLngTuple } from "leaflet";
import {
	MapContainer,
	TileLayer,
	TileLayerProps,
	GeoJSON,
	ZoomControl,
	useMap,
	Marker,
	Popup,
} from "react-leaflet";
import {
	useQuery,
	QueryClient,
	QueryClientProvider,
	useMutation,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { GeoJsonObject } from "geojson";
import { usePointStore } from "./store/useLocalPointsStore.js";
import PointsLayer from "./components/PointsLayer.js";
import {
	JourneyStatusProvider,
	useJourneyMachine,
} from "./state/journeyStatusState.js";
import { MarkerProvider, useMarkerStatus } from "./state/markerStatus.js";

const queryClient = new QueryClient();

const mapCenter = [58.14654566028351, 7.991145057860376] satisfies LatLngTuple;

const tileProps = {
	attribution: `&copy; <a href="http://www.kartverket.no/">Kartverket</a>`,
	url: `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png`,
} satisfies TileLayerProps;

function RemoteLayer() {
	const { isPending, error, data } = useQuery({
		queryKey: ["map"],
		queryFn: fetchGeoJson,
		refetchInterval: 10000,
	});

	const geoJsonLayer = useMemo(() => {
		if (!data) return null;

		return <GeoJSON key={Date.now()} data={data} />;
	}, [data]);

	if (isPending) return null;
	if (error) return null;

	return geoJsonLayer;
}

function MagnificationControl() {
	return <ZoomControl position="bottomleft"></ZoomControl>;
}

function InputControl() {
	const map = useMap();
	const journey = useJourneyMachine();
	const marker = useMarkerStatus();

	const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button
			style={{
				fontSize: "1.5rem",
				padding: "15px 20px",
				// borderRadius: "8px",
				// border: "none",
				cursor: "pointer",
				width: "100%",
			}}
			className="is-responsive"
			{...props}
		></button>
	);

	return (
		<>
			<div
				style={{
					position: "absolute",
					top: "10px",
					right: "10px",
					display: "flex",
					flexDirection: "column",
					gap: "15px",
					zIndex: 1000,
					// backgroundColor: "white",
					padding: "10px",
					// borderRadius: "8px",
					// boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
				}}
				className="leaflet-bar leaflet-control leaflet-control-custom"
			>
				<Button
					className="button is-info"
					onClick={() => {
						if (!document.fullscreenElement) {
							document.documentElement.requestFullscreen();
						} else {
							if (document.exitFullscreen) {
								document.exitFullscreen();
							}
						}
					}}
				>
					Toggle Fullscreen
				</Button>
				<Button
					className="button is-info"
					disabled={marker.state === "gps"}
					onClick={() => {
						marker.dispatch({ type: "gps" });
					}}
				>
					Place Marker on Current Location (not implemented)
				</Button>
				<Button
					className="button is-info"
					disabled={marker.state === "cursor"}
					onClick={() => {
						marker.dispatch({ type: "cursor" });
					}}
				>
					Place Custom Marker(s)
				</Button>
				<Button
					onClick={() => {
						marker.dispatch({ type: "off" });
					}}
					disabled={marker.state === "off"}
					className="button is-info"
				>
					Stop Placing Marker
				</Button>
				<Button
					className="button is-info"
					disabled={marker.state === "locating"}
					onClick={() => {
						marker.dispatch({ type: "locating" });
						map.locate({ setView: true, maxZoom: 16 });
						map.once("locationfound", () => {
							marker.dispatch({ type: "off" });
						});
						map.once("locationerror", () => {
							marker.dispatch({ type: "off" });
						});

						setTimeout(() => {
							map.stopLocate();
							marker.dispatch({ type: "off" });
						}, 5000);
					}}
				>
					{marker.state === "locating" ? "Locating" : "Locate Me"}
				</Button>
			</div>
			<div
				style={{
					position: "absolute",
					top: "10px",
					left: "10px",
					display: "flex",
					flexDirection: "column",
					gap: "15px",
					zIndex: 1000,
					// backgroundColor: "white",
					padding: "10px",
					// borderRadius: "8px",
					// boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
				}}
				className="leaflet-bar leaflet-control leaflet-control-custom"
			>
				{journey.state.status === "ending" ? (
					<Button disabled className="button is-warning">
						Journey Ending...
					</Button>
				) : journey.state.status === "finished" ? (
					<Button disabled className="button is-danger">
						Journey Finished
					</Button>
				) : journey.state.status === "inProgress" ? (
					<Button
						className="button is-danger"
						onClick={() => {
							journey.dispatch({ type: "ending" });
						}}
					>
						End Journey
					</Button>
				) : (
					<Button
						className="button is-success"
						onClick={journey.startJourney}
					>
						Start Journey
					</Button>
				)}
			</div>
		</>
	);
}

function UserPositionMarker() {
	const map = useMap();
	const [position, setPosition] = useState<[number, number] | null>(null);

	useEffect(() => {
		const onLocationFound = (e: any) => {
			setPosition([e.latitude, e.longitude]);
		};

		map.on("locationfound", onLocationFound);
		return () => {
			map.off("locationfound", onLocationFound);
		};
	}, [map]);

	if (!position) return null;

	return (
		<Marker position={position}>
			<Popup>You are here</Popup>
			<circle
				center={position}
				radius={50}
				pathOptions={{
					color: "blue",
					fillColor: "blue",
					fillOpacity: 0.2,
				}}
			/>
		</Marker>
	);
}

function Map() {
	const localPoints = usePointStore((state) => state.points);

	return (
		<MapContainer
			center={mapCenter}
			zoom={13}
			style={{ height: "100vh", width: "100vw" }}
			zoomControl={false}
		>
			<TileLayer {...tileProps} />
			<RemoteLayer />
			<PointsLayer points={localPoints} />
			<MagnificationControl />
			<InputControl />
			<UserPositionMarker />
		</MapContainer>
	);
}

async function fetchGeoJson(): Promise<GeoJsonObject> {
	const res = await fetch("/Map/GetPoints");
	if (!res.ok) {
		throw new Error("Network response was not ok");
	}

	return res.json();
}

interface UploadPointResponse {
	errors: { key: string; errors: string[] }[] | undefined;
}

async function uploadPoints(data: {
	id: string;
	points: { lat: number; lng: number }[];
}): Promise<UploadPointResponse> {
	const res = await fetch("/Map/Upload", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	return res.json();
}

// Should start to open when the journey status is "ending", but afterwards to close the user to click close manually
function PointSubmitter() {
	const journeyStatus = useJourneyMachine();
	const mutation = useMutation({
		mutationFn: uploadPoints,
	});

	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (journeyStatus.state.status === "ending") {
			setIsOpen(true);
		}
	}, [journeyStatus.state.status]);

	if (!isOpen) return null;
	if (journeyStatus.state.id === null) return null;

	return (
		<div
			style={{
				position: "absolute",
				bottom: "10px",
				left: "50%",
				transform: "translateX(-50%)",
				backgroundColor: "rgba(255, 255, 255, 0.9)",
				padding: "10px 20px",
				borderRadius: "8px",
				boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
				zIndex: 1000,
			}}
		>
			Er du sikker på at du vil avslutte reisen? Ingen flere punkter kan
			legges til etter at reisen er avsluttet.
			<br />
			<pre>
				{JSON.stringify(usePointStore.getState().points, null, 2)}
			</pre>
			{mutation.isError && (
				<p style={{ color: "red" }}>
					{(
						mutation.data as unknown as UploadPointResponse
					).errors!.map((error) => error.errors.join(", "))}
				</p>
			)}
			{mutation.isPending && <p>Sender inn punkter...</p>}
			{mutation.isSuccess && <p>Punkter sendt inn!</p>}
			<br />
			<div className="columns is-gapless">
				<button
					className="column button is-danger is-outlined"
					onClick={() => {
						mutation.reset();
						journeyStatus.dispatch({ type: "inProgress" });
						setIsOpen(false); // Allow manual closing
					}}
				>
					Avbryt
				</button>

				<button
					className="column button is-success is-outlined"
					onClick={() => {
						mutation.mutate(
							{
								id: journeyStatus.state.id!,
								points: usePointStore.getState().points,
							},
							{
								onSuccess: (data) => {
									if (
										!data.errors ||
										data.errors.length === 0
									) {
										journeyStatus.dispatch({
											type: "finished",
										});
										usePointStore.getState().clearPoints();
										setIsOpen(false);
									}
								},
							}
						);
					}}
				>
					Send inn punkter
				</button>
			</div>
		</div>
	);
}

function Root() {
	return (
		<>
			<Map />
			<PointSubmitter />
		</>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MarkerProvider value={"off"}>
				<JourneyStatusProvider>
					<Root />
				</JourneyStatusProvider>
			</MarkerProvider>
		</QueryClientProvider>
	);
}

// Journey:
// 1. User opens map, can view it and has a button to start a journey.
// 2. New buttons come up, one to end the journey, one to add a point.
// 3. As the journey goes on and points are added, the map updates in real-time to show the new points and are saved locally in localStorage.
// 4. Once the journey is ended, the points are sent to the server and saved in a database.

// Potentially other pilots can view temporary journeys in real-time as they are being created.
