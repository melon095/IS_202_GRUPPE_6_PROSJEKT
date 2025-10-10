import { createContext, useContext } from "react";
import { JourneyFunctions, useJourneyStore } from "../store/useJourneyStore";
import { JourneyState } from "../types";

interface JourneyContextType extends JourneyFunctions, JourneyState {}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const store = useJourneyStore();

	const contextValue: JourneyContextType = {
		...store,
		addPointToCurrentObject: (point) => {
			store.addPointToCurrentObject({
				...point,
				timestamp: Date.now(),
			});
		},
	};

	return (
		<JourneyContext.Provider value={contextValue}>
			{children}
		</JourneyContext.Provider>
	);
};

export const useJourney = (): JourneyContextType => {
	const context = useContext(JourneyContext);
	if (!context) {
		throw new Error("useJourney must be used within a JourneyProvider");
	}
	return context;
};
