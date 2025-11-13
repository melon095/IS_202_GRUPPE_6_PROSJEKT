import { createContext } from "react";

import { JourneyFunctions, useJourneyStore } from "../store/useJourneyStore";
import { JourneyState } from "../types";

export interface JourneyContextType extends JourneyFunctions, JourneyState {}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const store = useJourneyStore();

	return <JourneyContext.Provider value={store}>{children}</JourneyContext.Provider>;
};

export default JourneyContext;
