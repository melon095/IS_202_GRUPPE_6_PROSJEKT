import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { JourneyControls } from "./components/JourneyControls";
import { JourneySummary } from "./components/JourneySummary";
import { MapComponent } from "./components/MapComponent";
import { JourneyProvider, useJourney } from "./contexts/JourneyContext";
import { ObjectTypesProvider } from "./contexts/ObjectTypesContext";
import { useFinalizeJourneyMutation } from "./hooks/useFinalizeJourneyMutation";
import { useTranslation } from "./i18n";

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

		const objs = finishedJourney.objects
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
					id,
					title,
					description,
				},
				objects: objs,
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
						{t("test")}
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
