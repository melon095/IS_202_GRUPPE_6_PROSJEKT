import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JourneyProvider, useJourney } from "./contextx/JourneyContext";
import { useEffect, useState } from "react";
import { Journey } from "./types";
import { MapComponent } from "./components/MapComponent";
import { JourneyControls } from "./components/JourneyControls";
import { JourneySummary } from "./components/JourneySummary";
import { ObjectTypesProvider } from "./contextx/ObjectTypesContext";

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
					<JourneyControls>
						<div>
							{navigator.onLine
								? "🟢 Kobla til internett"
								: "🔴 Mangler internett"}
						</div>
					</JourneyControls>
				</MapComponent>
			</div>

			{showSummary && summaryJourney && (
				<div className="modal is-active">
					<div
						className="modal-background"
						onClick={handleCloseSummary}
					></div>
					<div className="modal-content">
						<JourneySummary
							journey={summaryJourney}
							onClose={handleCloseSummary}
						/>
					</div>
					<div>
						<button
							className="modal-close is-large"
							aria-label="close"
							onClick={handleCloseSummary}
						></button>
					</div>
				</div>
			)}
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
