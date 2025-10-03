import { createContext, useContext, useReducer } from "react";

type MarkerStatus = "gps" | "cursor" | "off";

const MarkerContext = createContext<
	| {
			state: MarkerStatus;
			dispatch: React.Dispatch<{ type: MarkerStatus }>;
	  }
	| undefined
>(undefined);

function reducer(
	_state: MarkerStatus,
	action: { type: MarkerStatus }
): MarkerStatus {
	return action.type;
}

export function MarkerProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: MarkerStatus;
}) {
	const [state, dispatch] = useReducer(reducer, value);

	return (
		<MarkerContext.Provider value={{ state, dispatch }}>
			{children}
		</MarkerContext.Provider>
	);
}

export function useMarkerStatus() {
	const context = useContext(MarkerContext);
	if (context === undefined) {
		throw new Error("useMarkerStatus must be used within a MarkerProvider");
	}
	return context;
}
