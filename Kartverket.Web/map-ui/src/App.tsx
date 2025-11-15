import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";

import { MapComponent } from "./components/MapComponent";
import { ObjectDefinition } from "./components/ObjectMarkers";
import { JourneyControls } from "./components/journeyControls/JourneyControls";
import { JourneySummary } from "./components/journeySummary/JourneySummary";
import { JourneyProvider } from "./contexts/JourneyContext";
import { ObjectTypesProvider } from "./contexts/ObjectTypesContext";
import { useFinalizeJourneyMutation } from "./hooks/useFinalizeJourneyMutation";
import { useJourney } from "./hooks/useJourney";
import { useServerObjectsQuery } from "./hooks/useServerObjectsQuery";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const CURRENT_JOURNEY_COLOUR = "blue";
const CURRENT_OBJECT_COLOUR = "red";
const SERVER_OBJECTS_COLOUR = "green";

const AppContent = () => {
	const {
		currentJourney,
		currentObjectPoints,
		placeMode,
		finishedJourney,
		undoEndJourney,
		deleteEndJourney,
		addPointToCurrentObject,
	} = useJourney();
	const [showSummary, setShowSummary] = useState(false);
	const finalizeJourneyMutation = useFinalizeJourneyMutation();
	const { data: serverObjects } = useServerObjectsQuery(currentJourney?.id);

	useEffect(() => {
		setShowSummary(finishedJourney !== null);
	}, [finishedJourney]);

	const handleCloseSummary = () => {
		setShowSummary(false);
		if (finishedJourney) undoEndJourney();
	};

	const handleSubmitSummary = () => {
		if (!finishedJourney) return;
		const { id, title, description } = finishedJourney;
		if (!id) return;

		finalizeJourneyMutation.mutate(
			{
				journey: {
					id,
					title,
					description,
				},
				objects: finishedJourney.objects,
			},
			{
				onSuccess: () => {
					deleteEndJourney();
					setShowSummary(false);
				},
			}
		);
	};

	const objectsForMap: ObjectDefinition[] = [];

	if (currentJourney && currentJourney?.objects?.length > 0) {
		objectsForMap.push({
			colour: CURRENT_JOURNEY_COLOUR,
			objects: currentJourney.objects,
		});
	}

	if (currentObjectPoints && currentObjectPoints?.length > 0) {
		objectsForMap.push({
			colour: CURRENT_OBJECT_COLOUR,
			objects: [
				{
					id: "current-object",
					points: currentObjectPoints,
					geometryType: placeMode,
					deleted: false,
					createdAt: new Date().toISOString(),
				},
			],
		});
	}

	if (serverObjects && serverObjects?.length > 0) {
		objectsForMap.push({
			colour: SERVER_OBJECTS_COLOUR,
			objects: serverObjects,
		});
	}

	return (
		<div>
			<div>
				<MapComponent
					objects={objectsForMap}
					placeMode={placeMode}
					onClick={addPointToCurrentObject}
					style={{ height: "100vh", width: "100vw" }}
				>
					<JourneyControls>
						<div>{navigator.onLine ? "🟢 Kobla til internett" : "🔴 Mangler internett"}</div>
					</JourneyControls>

					{showSummary && finishedJourney && (
						<JourneySummary
							journey={finishedJourney}
							onClose={handleCloseSummary}
							onSubmit={handleSubmitSummary}
							isSubmitting={finalizeJourneyMutation.isPending}
							isError={finalizeJourneyMutation.isError}
							errors={finalizeJourneyMutation.error}
						/>
					)}
				</MapComponent>
			</div>
		</div>
	);
};

const App = () => {
	return (
		<>
			<QueryClientProvider client={queryClient}>
				<ReactQueryDevtools initialIsOpen={false} />

				<ObjectTypesProvider>
					<JourneyProvider>
						<AppContent />
					</JourneyProvider>
				</ObjectTypesProvider>
			</QueryClientProvider>
		</>
	);
};

export default App;
