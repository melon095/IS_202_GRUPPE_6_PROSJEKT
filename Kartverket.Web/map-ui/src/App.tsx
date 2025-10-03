import "leaflet/dist/leaflet.css";
import "./css/zoom-control.css";

import { LatLngTuple } from "leaflet";
import {
	MapContainer,
	TileLayer,
	TileLayerProps,
	GeoJSON,
	LayersControl,
	ZoomControl,
	useMap,
} from "react-leaflet";
import {
	useQuery,
	QueryClient,
	QueryClientProvider,
	useMutation,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
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
					onClick={() => {
						marker.dispatch({ type: "gps" });
					}}
				>
					Place Marker on Current Location (not implemented)
				</Button>
				<Button
					className="button is-info"
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
					disabled={marker.state !== "off"}
					className="button is-info"
				>
					Stop Placing Marker
				</Button>
				<Button
					className="button is-info"
					onClick={() => {
						map.locate({ setView: true, maxZoom: 16 });
					}}
				>
					Locate Me
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
						onClick={() => {
							journey.dispatch({ type: "inProgress" });
						}}
					>
						Start Journey
					</Button>
				)}
			</div>
		</>
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

async function uploadPoints(data: {
	id: string;
	points: { lat: number; lng: number }[];
}) {
	const res = await fetch("/Map/Upload", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Network response was not ok");
	}

	return res.json();
}

function PointSubmitter() {
	const journeyStatus = useJourneyMachine();
	const mutation = useMutation({
		mutationFn: uploadPoints,
	});

	if (journeyStatus.state.status !== "ending") return null;

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
					Feil ved innsending av punkter. Vennligst prøv igjen.
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
					}}
				>
					Avbryt
				</button>

				<button
					className="column button is-success is-outlined"
					onClick={() => {
						mutation.mutate(
							{
								id: journeyStatus.state.id,
								points: usePointStore.getState().points,
							},
							{
								onSuccess: () => {
									journeyStatus.dispatch({
										type: "finished",
									});
									usePointStore.getState().clearPoints();
								},
								onError: () => {
									alert(
										"Failed to submit points. Please try again."
									);
									journeyStatus.dispatch({
										type: "inProgress",
									});
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

interface AppProps {
	reportId: string;
}

export default function App(props: AppProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<MarkerProvider value={"off"}>
				<JourneyStatusProvider
					value={{ id: props.reportId, status: "idle" }}
				>
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
