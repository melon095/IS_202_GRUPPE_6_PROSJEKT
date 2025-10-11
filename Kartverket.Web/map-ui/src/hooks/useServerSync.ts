import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PlacedObject } from "../types";

interface ServerSyncData {
	object: PlacedObject;
	journeyId: string;
}

type ResponseError = Record<string, string[]>;

const extrapolateErrors = async (
	response: Response
): Promise<ResponseError[]> => {
	const json = await response.json();

	return json.errors as ResponseError[];
};

const syncToServerEndpoint = (data: ServerSyncData): string =>
	`/Report/SyncObject?journeyId=${data.journeyId}&objectId=${data.object.id}`;

const syncObjectsToServer = async (body: ServerSyncData): Promise<void> => {
	const endpoint = syncToServerEndpoint(body);

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body.object),
	});

	if (!response.ok) {
		throw await extrapolateErrors(response);
	}
};

const finalizeJourneyEndpoint = (journeyId: string): string =>
	`/Report/FinalizeJourney?journeyId=${journeyId}`;

const finalizeJourney = async (journeyId: string): Promise<void> => {
	const endpoint = finalizeJourneyEndpoint(journeyId);

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
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
		syncObject: syncObjectMutation.mutate,
		finalizeJourney: finalizeJourneyMutation.mutate,
		isSyncing: syncObjectMutation.isPending,
		isFinalizing: finalizeJourneyMutation.isPending,
	};
};
