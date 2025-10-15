import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ResponseError, ServerSyncData, ServerSyncResponse } from "../types";
import { extrapolateErrors } from "../utils/extrapolateErrors";

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

export const useSyncObjectMutation = () => {
	const queryClient = useQueryClient();
	return useMutation<ServerSyncResponse, ResponseError, ServerSyncData>({
		mutationFn: syncObjectsToServer,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["serverSideObjects"] });
		},
		onError: (error) => {
			console.error("Failed to sync object to server:", error);
		},
	});
};
