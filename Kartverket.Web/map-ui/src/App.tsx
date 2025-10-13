import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { JourneyControls } from "./components/JourneyControls";
import { JourneySummary } from "./components/JourneySummary";
import { MapComponent } from "./components/MapComponent";
import { JourneyProvider, useJourney } from "./contexts/JourneyContext";
import { ObjectTypesProvider } from "./contexts/ObjectTypesContext";
import { useServerSync } from "./hooks/useServerSync";
import { useTranslation } from "./i18n";

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

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const AppContent = () => {
	const { t } = useTranslation();
	const { currentJourney, undoEndJourney } = useJourney();
	const [showSummary, setShowSummary] = useState(false);
	const { finalizeJourneyMutation } = useServerSync();

	const completedJourney = useMemo(() => {
		if (currentJourney?.endTime) {
			return currentJourney;
		}

		return null;
	}, [currentJourney]);

	useEffect(() => {
		setShowSummary(completedJourney !== null);
	}, [completedJourney]);

	const handleCloseSummary = () => {
		setShowSummary(false);
		if (currentJourney) undoEndJourney();
	};

	const handleSubmitSummary = () => {
		if (!completedJourney) return;
		const objs = completedJourney.objects
			.filter((obj) => obj.deleted === false)
			.map((obj) => ({
				id: obj.id!,
				title: obj.title,
				description: obj.description,
				points: obj.points,
				typeId: obj.typeId,
				customType: obj.customType,
			}));

		finalizeJourneyMutation.mutate(
			{
				journey: {
					id: completedJourney.id,
					title: completedJourney.title,
					description: completedJourney.description,
				},
				objects: objs,
			},
			{
				onSuccess: () => {
					handleCloseSummary();
				},
			}
		);
	};

	return (
		<div>
			<div>
				<MapComponent>
					<JourneyControls>
						{t("test")}
						<div>{navigator.onLine ? "🟢 Kobla til internett" : "🔴 Mangler internett"}</div>
					</JourneyControls>

					{showSummary && completedJourney && (
						<JourneySummary
							journey={completedJourney}
							onClose={handleCloseSummary}
							onSubmit={handleSubmitSummary}
							isSubmitting={finalizeJourneyMutation.isPending}
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
