import { useContext } from "react";

import JourneyContext, { JourneyContextType } from "../contexts/JourneyContext";

export const useJourney = (): JourneyContextType => {
	const context = useContext(JourneyContext);
	if (!context) {
		throw new Error("useJourney must be used within a JourneyProvider");
	}

	return context;
};
