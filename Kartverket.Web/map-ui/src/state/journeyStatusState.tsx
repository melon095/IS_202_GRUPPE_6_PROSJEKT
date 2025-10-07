import { useMutation } from "@tanstack/react-query";
import { createContext, useContext, useReducer } from "react";

type JourneyStatus = "idle" | "inProgress" | "ending" | "finished";

type JourneyStatusState = {
	id: string | null;
	status: JourneyStatus;
	isLoading: boolean;
	error: string | null;
};

type JourneyStatusContext = {
	state: JourneyStatusState;
	dispatch: React.Dispatch<{ type: JourneyStatus }>;
	startJourney: () => void;
};

const JourneyStatusStateContext = createContext<
	JourneyStatusContext | undefined
>(undefined);

function reducer(
	state: JourneyStatusState,
	action: { type: JourneyStatus }
): JourneyStatusState {
	return { ...state, status: action.type };
}

export function JourneyStatusProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const value = {
		id: null,
		status: "idle",
		isLoading: false,
		error: null,
	} satisfies JourneyStatusState;
	const [state, dispatch] = useReducer(reducer, value);

	const queryMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/Report/PilotCreate", { method: "POST" });
			if (!res.ok) {
				throw new Error("Network response was not ok");
			}
			const data = await res.json();
			return data.id as string;
		},
		onMutate: () => {
			dispatch({ type: "inProgress" });
		},
		onSuccess: (id) => {
			dispatch({ type: "inProgress" });
			state.id = id;
		},
		onError: () => {
			dispatch({ type: "idle" });
		},
	});

	const startJourney = () => {
		queryMutation.mutate();
	};

	const contextValue: JourneyStatusContext = {
		state: {
			...state,
			isLoading: queryMutation.isPending,
			error: queryMutation.error ? queryMutation.error.message : null,
		},
		dispatch,
		startJourney,
	};

	return (
		<JourneyStatusStateContext.Provider value={contextValue}>
			{children}
		</JourneyStatusStateContext.Provider>
	);
}

export function useJourneyMachine() {
	const context = useContext(JourneyStatusStateContext);
	if (context === undefined) {
		throw new Error(
			"useJourneyMachine must be used within a JourneyStatusProvider"
		);
	}
	return context;
}
