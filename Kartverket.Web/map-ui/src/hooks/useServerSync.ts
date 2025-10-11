import { useMutation, useQueryClient } from "@tanstack/react-query";

import { FinalizeJourneyData, ResponseError, ServerSyncData, ServerSyncResponse } from "../types";

const extrapolateErrors = async (response: Response): Promise<ResponseError[]> => {
	const json = await response.json();

	return json.errors as ResponseError[];
};

const syncToServerEndpoint = (data: ServerSyncData): string => {
	const qp = new URLSearchParams();
	if (data.journeyId) qp.append("journeyId", data.journeyId);

	return `/Map/SyncObject?${qp.toString()}`;
};

const syncObjectsToServer = async (data: ServerSyncData): Promise<ServerSyncResponse> => {
	const endpoint = syncToServerEndpoint(data);

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data.object),
	});

	if (!response.ok) {
		throw await extrapolateErrors(response);
	}

	return response.json() as Promise<ServerSyncResponse>;
};

const finalizeJourneyEndpoint = (journeyId: string): string => `/Map/FinalizeJourney?journeyId=${journeyId}`;

const finalizeJourney = async (body: FinalizeJourneyData): Promise<void> => {
	const endpoint = finalizeJourneyEndpoint(body.journey.id);

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw await extrapolateErrors(response);
	}
};

export const useServerSync = () => {
	const queryClient = useQueryClient();

	const syncObjectMutation = useMutation({
		mutationFn: syncObjectsToServer,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["objects"] });
		},
		onError: (error) => {
			console.error("Failed to sync object to server:", error);
		},
	});

	const finalizeJourneyMutation = useMutation({
		mutationFn: finalizeJourney,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["journeys"] });
		},
	});

	return {
		syncObjectMutation: syncObjectMutation,
		finalizeJourneyMutation: finalizeJourneyMutation,
	};
};
