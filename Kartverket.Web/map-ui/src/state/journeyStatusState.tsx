import { createContext, useContext, useReducer } from "react";

type JourneyStatusState = {
	id: string;
	status: "idle" | "inProgress" | "ending" | "finished";
};

const JourneyStatusStateContext = createContext<
	| {
			state: JourneyStatusState;
			dispatch: React.Dispatch<{ type: JourneyStatusState["status"] }>;
	  }
	| undefined
>(undefined);

function reducer(
	state: JourneyStatusState,
	action: { type: JourneyStatusState["status"] }
): JourneyStatusState {
	return { ...state, status: action.type };
}

export function JourneyStatusProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: JourneyStatusState;
}) {
	const [state, dispatch] = useReducer(reducer, value);

	return (
		<JourneyStatusStateContext.Provider value={{ state, dispatch }}>
			{children}
		</JourneyStatusStateContext.Provider>
	);
}

export function useJourneyMachine() {
	const context = useContext(JourneyStatusStateContext);
	if (context === undefined) {
		throw new Error(
			"useJourneyStatus must be used within a JourneyStatusProvider"
		);
	}
	return context;
}
