import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ResponseError, ServerSyncData, ServerSyncResponse } from "../types";
import { extrapolateErrors } from "../utils/extrapolateErrors";

const syncToServerEndpoint = (data: ServerSyncData): string => {
	const qp = new URLSearchParams();
	if (data.journeyId) qp.append("journeyId", data.journeyId);

	return `/Map/SyncHindrance?${qp.toString()}`;
};

const syncHindrancesToServer = async (data: ServerSyncData): Promise<ServerSyncResponse> => {
	const endpoint = syncToServerEndpoint(data);

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data.hindrance),
	});

	if (!response.ok) {
		throw await extrapolateErrors(response);
	}

	return response.json() as Promise<ServerSyncResponse>;
};

export const useSyncHindrancesMutation = () => {
	const queryClient = useQueryClient();
	return useMutation<ServerSyncResponse, ResponseError, ServerSyncData>({
		mutationFn: syncHindrancesToServer,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["serverSideHindrances"] });
		},
		onError: (error) => {
			console.error("Error syncing hindrance to server:", error);
		},
	});
};
