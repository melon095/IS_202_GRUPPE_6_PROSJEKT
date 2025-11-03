import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";

import { JourneyControls } from "./components/JourneyControls";
import { JourneySummary } from "./components/JourneySummary";
import { MapComponent } from "./components/MapComponent";
import { JourneyProvider, useJourney } from "./contexts/JourneyContext";
import { ObjectTypesProvider } from "./contexts/ObjectTypesContext";
import { useFinalizeJourneyMutation } from "./hooks/useFinalizeJourneyMutation";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const AppContent = () => {
	const { finishedJourney, undoEndJourney, deleteEndJourney } = useJourney();
	const [showSummary, setShowSummary] = useState(false);
	const finalizeJourneyMutation = useFinalizeJourneyMutation();

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

	return (
		<div>
			<div>
				<MapComponent>
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
