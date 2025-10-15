import { useMutation, useQueryClient } from "@tanstack/react-query";

import { FinalizeJourneyData, ResponseError } from "../types";
import { extrapolateErrors } from "../utils/extrapolateErrors";

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

export const useFinalizeJourneyMutation = () => {
	const queryClient = useQueryClient();
	return useMutation<void, ResponseError, FinalizeJourneyData>({
		mutationFn: finalizeJourney,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["journeys"] });
		},
	});
};
