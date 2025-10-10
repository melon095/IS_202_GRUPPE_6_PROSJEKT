// import "leaflet/dist/leaflet.css";
// import "./css/zoom-control.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JourneyProvider, useJourney } from "./contextx/journeyContext";
import { useEffect, useState } from "react";
import { Journey } from "./types";
import { MapComponent } from "./components/MapComponent";
import { JourneyControls } from "./components/JourneyControls";

// import { LatLngTuple } from "leaflet";
// import {
// 	MapContainer,
// 	TileLayer,
// 	TileLayerProps,
// 	GeoJSON,
// 	ZoomControl,
// 	useMap,
// 	Marker,
// 	Popup,
// } from "react-leaflet";
// import {
// 	useQuery,
// 	QueryClient,
// 	QueryClientProvider,
// 	useMutation,
// } from "@tanstack/react-query";
// import { useEffect, useMemo, useState } from "react";
// import { GeoJsonObject } from "geojson";
// import { usePointStore } from "./store/useLocalPointsStore.js";
// import PointsLayer from "./components/PointsLayer.js";
// import {
// 	JourneyStatusProvider,
// 	useJourneyMachine,
// } from "./state/journeyStatusState.js";
// import { MarkerProvider, useMarkerStatus } from "./state/markerStatus.js";
// import { Point } from "./types.js";

// const queryClient = new QueryClient();

// const mapCenter = [58.14654566028351, 7.991145057860376] satisfies LatLngTuple;

// const tileProps = {
// 	attribution: `&copy; <a href="http://www.kartverket.no/">Kartverket</a>`,
// 	url: `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png`,
// } satisfies TileLayerProps;

// function RemoteLayer() {
// 	const { isPending, error, data } = useQuery({
// 		queryKey: ["map"],
// 		queryFn: fetchGeoJson,
// 		refetchInterval: 10000,
// 	});

// 	const geoJsonLayer = useMemo(() => {
// 		if (!data) return null;

// 		return <GeoJSON key={Date.now()} data={data} />;
// 	}, [data]);

// 	if (isPending) return null;
// 	if (error) return null;

// 	return geoJsonLayer;
// }

// function MagnificationControl() {
// 	return <ZoomControl position="bottomleft"></ZoomControl>;
// }

// function InputControl() {
// 	const map = useMap();
// 	const journey = useJourneyMachine();
// 	const marker = useMarkerStatus();

// 	const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
// 		<button
// 			style={{
// 				fontSize: "1.5rem",
// 				padding: "15px 20px",
// 				// borderRadius: "8px",
// 				// border: "none",
// 				cursor: "pointer",
// 				width: "100%",
// 			}}
// 			className="is-responsive"
// 			{...props}
// 		></button>
// 	);

// 	return (
// 		<>
// 			<div
// 				style={{
// 					position: "absolute",
// 					top: "10px",
// 					right: "10px",
// 					display: "flex",
// 					flexDirection: "column",
// 					gap: "15px",
// 					zIndex: 1000,
// 					// backgroundColor: "white",
// 					padding: "10px",
// 					// borderRadius: "8px",
// 					// boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
// 				}}
// 				className="leaflet-bar leaflet-control leaflet-control-custom"
// 			>
// 				<Button
// 					className="button is-info"
// 					onClick={() => {
// 						if (!document.fullscreenElement) {
// 							document.documentElement.requestFullscreen();
// 						} else {
// 							if (document.exitFullscreen) {
// 								document.exitFullscreen();
// 							}
// 						}
// 					}}
// 				>
// 					Toggle Fullscreen
// 				</Button>
// 				<Button
// 					className="button is-info"
// 					disabled={marker.state === "gps"}
// 					onClick={() => {
// 						marker.dispatch({ type: "gps" });
// 					}}
// 				>
// 					Place Marker on Current Location (not implemented)
// 				</Button>
// 				<Button
// 					className="button is-info"
// 					disabled={marker.state === "cursor"}
// 					onClick={() => {
// 						marker.dispatch({ type: "cursor" });
// 					}}
// 				>
// 					Place Custom Marker(s)
// 				</Button>
// 				<Button
// 					onClick={() => {
// 						marker.dispatch({ type: "off" });
// 					}}
// 					disabled={marker.state === "off"}
// 					className="button is-info"
// 				>
// 					Stop Placing Marker
// 				</Button>
// 				<Button
// 					className="button is-info"
// 					disabled={marker.state === "locating"}
// 					onClick={() => {
// 						marker.dispatch({ type: "locating" });
// 						map.locate({ setView: true, maxZoom: 16 });
// 						map.once("locationfound", () => {
// 							marker.dispatch({ type: "off" });
// 						});
// 						map.once("locationerror", () => {
// 							marker.dispatch({ type: "off" });
// 						});

// 						setTimeout(() => {
// 							map.stopLocate();
// 							marker.dispatch({ type: "off" });
// 						}, 5000);
// 					}}
// 				>
// 					{marker.state === "locating" ? "Locating" : "Locate Me"}
// 				</Button>
// 			</div>
// 			<div
// 				style={{
// 					position: "absolute",
// 					top: "10px",
// 					left: "10px",
// 					display: "flex",
// 					flexDirection: "column",
// 					gap: "15px",
// 					zIndex: 1000,
// 					// backgroundColor: "white",
// 					padding: "10px",
// 					// borderRadius: "8px",
// 					// boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
// 				}}
// 				className="leaflet-bar leaflet-control leaflet-control-custom"
// 			>
// 				{journey.state.status === "ending" ? (
// 					<Button disabled className="button is-warning">
// 						Journey Ending...
// 					</Button>
// 				) : journey.state.status === "finished" ? (
// 					<Button disabled className="button is-danger">
// 						Journey Finished
// 					</Button>
// 				) : journey.state.status === "inProgress" ? (
// 					<Button
// 						className="button is-danger"
// 						onClick={() => {
// 							journey.dispatch({ type: "ending" });
// 						}}
// 					>
// 						End Journey
// 					</Button>
// 				) : (
// 					<Button
// 						className="button is-success"
// 						onClick={journey.startJourney}
// 					>
// 						Start Journey
// 					</Button>
// 				)}
// 			</div>
// 		</>
// 	);
// }

// function UserPositionMarker() {
// 	const map = useMap();
// 	const [position, setPosition] = useState<[number, number] | null>(null);

// 	useEffect(() => {
// 		const onLocationFound = (e: any) => {
// 			setPosition([e.latitude, e.longitude]);
// 		};

// 		map.on("locationfound", onLocationFound);
// 		return () => {
// 			map.off("locationfound", onLocationFound);
// 		};
// 	}, [map]);

// 	if (!position) return null;

// 	return (
// 		<Marker position={position}>
// 			<Popup>You are here</Popup>
// 			<circle
// 				center={position}
// 				radius={50}
// 				pathOptions={{
// 					color: "blue",
// 					fillColor: "blue",
// 					fillOpacity: 0.2,
// 				}}
// 			/>
// 		</Marker>
// 	);
// }

// function CursorMarkerHandler() {
// 	const map = useMap();
// 	const marker = useMarkerStatus();
// 	const addPoint = usePointStore((state) => state.addPoint);

// 	useEffect(() => {
// 		if (marker.state !== "cursor") return;

// 		const onClick = (e: any) => {
// 			const { lat, lng } = e.latlng;
// 			addPoint({ lat, lng });
// 		};

// 		map.on("click", onClick);

// 		return () => {
// 			map.off("click", onClick);
// 		};
// 	}, [map, marker.state, addPoint]);

// 	return null;
// }

// function Map() {
// 	return (
// 		<MapContainer
// 			center={mapCenter}
// 			zoom={13}
// 			style={{ height: "100vh", width: "100vw" }}
// 			zoomControl={false}
// 		>
// 			<TileLayer {...tileProps} />
// 			<RemoteLayer />
// 			<PointsLayer />
// 			<MagnificationControl />
// 			<InputControl />
// 			<UserPositionMarker />
// 			<CursorMarkerHandler />
// 		</MapContainer>
// 	);
// }

// async function fetchGeoJson(): Promise<GeoJsonObject> {
// 	const res = await fetch("/Map/GetPoints");
// 	if (!res.ok) {
// 		throw new Error("Network response was not ok");
// 	}

// 	return res.json();
// }

// interface UploadPointResponse {
// 	errors: { key: string; errors: string[] }[] | undefined;
// }

// interface UploadPointRequest {
// 	id: string;
// 	points: Point[];
// 	reportTitle: string;
// 	reportDescription: string;
// }

// interface UploadPointError {
// 	errors: { key: string; errors: string[] }[] | undefined;
// }

// async function uploadPoints(
// 	data: UploadPointRequest
// ): Promise<UploadPointResponse> {
// 	const res = await fetch("/Map/Upload", {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 		},
// 		body: JSON.stringify(data),
// 	});

// 	if (!res.ok) {
// 		throw await res.json();
// 	}

// 	return res.json();
// }

// // Should start to open when the journey status is "ending", but afterwards to close the user to click close manually
// function PointSubmitter() {
// 	const journeyStatus = useJourneyMachine();
// 	const mutation = useMutation<
// 		UploadPointResponse,
// 		UploadPointError,
// 		UploadPointRequest
// 	>({
// 		mutationFn: uploadPoints,
// 	});

// 	const [isOpen, setIsOpen] = useState(false);
// 	const [reportTitle, setReportTitle] = useState(
// 		`Midlertidlig rapport tittel - ${new Date().toLocaleString()}`
// 	);
// 	const [reportDescription, setReportDescription] = useState(
// 		"Midlertidlig rapport beskrivelse"
// 	);

// 	useEffect(() => {
// 		if (journeyStatus.state.status === "ending") {
// 			setIsOpen(true);
// 		}
// 	}, [journeyStatus.state.status]);

// 	if (!isOpen) return null;
// 	if (journeyStatus.state.id === null) return null;

// 	return (
// 		<div
// 			style={{
// 				position: "absolute",
// 				bottom: "10px",
// 				left: "50%",
// 				transform: "translateX(-50%)",
// 				backgroundColor: "rgba(255, 255, 255, 0.9)",
// 				padding: "10px 20px",
// 				borderRadius: "8px",
// 				boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
// 				height: "auto",
// 				zIndex: 1000,
// 			}}
// 		>
// 			Er du sikker på at du vil avslutte reisen? Ingen flere punkter kan
// 			legges til etter at reisen er avsluttet.
// 			<br />
// 			<div>
// 				<div>
// 					<label
// 						htmlFor="reportTitle"
// 						style={{ fontSize: "0.8rem", color: "gray" }}
// 					>
// 						Rapport Tittel:
// 					</label>
// 					<input
// 						id="reportTitle"
// 						type="text"
// 						value={reportTitle}
// 						onChange={(e) => setReportTitle(e.target.value)}
// 						style={{
// 							fontSize: "0.8rem",
// 							width: "100%",
// 							backgroundColor: "rgba(255, 255, 255, 0.9)",
// 							border: "1px solid lightgray",
// 							borderRadius: "4px",
// 						}}
// 					/>
// 				</div>
// 				<div>
// 					<label
// 						htmlFor="reportDescription"
// 						style={{ fontSize: "0.8rem", color: "gray" }}
// 					>
// 						Rapport Beskrivelse:
// 					</label>
// 					<textarea
// 						id="reportDescription"
// 						value={reportDescription}
// 						onChange={(e) => setReportDescription(e.target.value)}
// 						style={{
// 							fontSize: "0.8rem",
// 							width: "100%",
// 							backgroundColor: "rgba(255, 255, 255, 0.9)",
// 							border: "1px solid lightgray",
// 							borderRadius: "4px",
// 						}}
// 					/>
// 				</div>
// 			</div>
// 			<br />
// 			<em>
// 				Du har totalt {usePointStore.getState().points.length} punkter.
// 			</em>
// 			<br />
// 			<div>
// 				{/* TODO: Endre på data her hvis nødvendig! */}
// 				<div style={{ fontSize: "0.8rem", color: "gray" }}>
// 					Punkter:
// 				</div>
// 				<ul style={{ maxHeight: "100px", overflowY: "auto" }}>
// 					{usePointStore.getState().points.map((point, idx) => (
// 						<li key={idx} style={{ fontSize: "0.9rem" }}>
// 							{idx + 1}: ({point.lat.toFixed(5)},{" "}
// 							{point.lng.toFixed(5)})
// 						</li>
// 					))}
// 				</ul>
// 			</div>
// 			{mutation.isError && (
// 				<ul style={{ color: "red" }}>
// 					{mutation.error.errors !== undefined ? (
// 						mutation.error.errors.map((error) => (
// 							<li key={error.key}>{error.errors.join(", ")}</li>
// 						))
// 					) : (
// 						<li>Uventet Feil!</li>
// 					)}
// 				</ul>
// 			)}
// 			{mutation.isPending && <p>Sender inn punkter...</p>}
// 			{mutation.isSuccess && <p>Punkter sendt inn!</p>}
// 			<br />
// 			<div className="columns is-gapless">
// 				<button
// 					className="column button is-danger is-outlined"
// 					onClick={() => {
// 						mutation.reset();
// 						journeyStatus.dispatch({ type: "inProgress" });
// 						setIsOpen(false); // Allow manual closing
// 					}}
// 				>
// 					Avbryt
// 				</button>

// 				<button
// 					className="column button is-success is-outlined"
// 					onClick={() => {
// 						mutation.mutate(
// 							{
// 								id: journeyStatus.state.id!,
// 								points: usePointStore.getState().points,
// 								reportTitle,
// 								reportDescription,
// 							},
// 							{
// 								onSuccess: (data) => {
// 									if (
// 										!data.errors ||
// 										data.errors.length === 0
// 									) {
// 										journeyStatus.dispatch({
// 											type: "finished",
// 										});
// 										usePointStore.getState().clearPoints();
// 										setIsOpen(false);
// 									}
// 								},
// 							}
// 						);
// 					}}
// 				>
// 					Send inn punkter
// 				</button>
// 			</div>
// 		</div>
// 	);
// }

// function AppContext() {
// 	return (
// 		<>
// 			<Map />
// 			<PointSubmitter />
// 		</>
// 	);
// }

// export default function App() {
// 	return (
// 		<QueryClientProvider client={queryClient}>
// 			<MarkerProvider value={"off"}>
// 				<JourneyStatusProvider>
// 					<AppContext />
// 				</JourneyStatusProvider>
// 			</MarkerProvider>
// 		</QueryClientProvider>
// 	);
// }

// /// Better journey.
// /// When the user opens the map, all that is done there from start to end will be recoreded as one single report.
// /// When the user clicks on the start journey button, all the necessary buttons for placing markers, ending the journey etc will appear.
// /// There will become a new button for placing "objects" which are multiple points in a sequence.
// /// The button for placing a object will allow placing N amount of points, until the stop placing button is placed. upong which they are saved in local storage
// /// as one single object. They will also be given a menu to set the type of object, this is not necessary, as we cannot force the user to set it,
// /// but it is necessary as we cannot force them to remember it one hour later.
// /// Once the user is finished with the journey, and clicks on the end journey button,
// /// a summary of all the objects placed will appear, with the ability to add a title and description to each object.
// /// While the journey is going on, when a object is placed, it will be sent to the server as a temporary object,
// /// Just to ensure no data loss, it will also be saved locally, to make it work offline.

const queryClient = new QueryClient();

const AppContent = () => {
	const { currentJourney, journeyHistory } = useJourney();
	const [showSummary, setShowSummary] = useState(false);
	const [summaryJourney, setSummaryJourney] = useState<Journey | null>(null);

	useEffect(() => {
		if (!currentJourney && journeyHistory.length > 0) {
			const lastJourney = journeyHistory[journeyHistory.length - 1];

			// endTime means completed
			if (lastJourney.endTime) {
				setSummaryJourney(lastJourney);
				setShowSummary(true);
			}
		}
	}, [currentJourney, journeyHistory]);

	const handleCloseSummary = () => {
		setShowSummary(false);
		setSummaryJourney(null);
	};

	return (
		<div>
			<div>
				<MapComponent>
					<JourneyControls />
				</MapComponent>
			</div>

			{/* {showSummary && summaryJourney && (
                <div>
                    <JourneySummary journey={summaryJourney} onClose={handleCloseSummary} />
                </div>
            )} */}

			<div>{navigator.onLine ? "🟢 Online" : "🔴 Offline"}</div>
		</div>
	);
};

const App = () => {
	return (
		<>
			<QueryClientProvider client={queryClient}>
				<JourneyProvider>
					<AppContent />
				</JourneyProvider>
			</QueryClientProvider>
		</>
	);
};

export default App;
