import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { ServerStateResponse } from "../types";
import { extrapolateErrors } from "../utils/extrapolateErrors";

const ONE_MINUTE = 60 * 1000;
const TWO_MINUTES = 2 * ONE_MINUTE;

export const useServerHindranceQuery = (currentReportId?: string) => {
	const queryClient = useQueryClient();
	const lastFetchTimeRef = useRef<string | null>(null);

	useEffect(() => {
		lastFetchTimeRef.current = null;
	}, [currentReportId]);

	return useQuery<ServerStateResponse>({
		// eslint-disable-next-line @tanstack/query/exhaustive-deps
		queryKey: ["serverSideHindrances", currentReportId],
		queryFn: async () => {
			const qp = new URLSearchParams();

			if (lastFetchTimeRef.current) {
				qp.append("since", lastFetchTimeRef.current);
			}
			if (currentReportId) {
				qp.append("reportId", currentReportId);
			}

			const res = await fetch(`/Map/GetHindrances?${qp.toString()}`, {
				method: "GET",
			});

			if (!res.ok) throw await extrapolateErrors(res);

			const newData = (await res.json()) as ServerStateResponse;

			lastFetchTimeRef.current = new Date().toISOString();

			const oldData = queryClient.getQueryData<ServerStateResponse>(["serverSideHindrances", currentReportId]);

			if (!oldData) return newData;

			const merged = [...oldData];

			newData.forEach((newObj) => {
				const index = merged.findIndex((obj) => obj.id === newObj.id);
				if (index !== -1) {
					merged[index] = newObj;
				} else {
					merged.push(newObj);
				}
			});

			queryClient.setQueryData(["serverSideHindrances", currentReportId], merged);

			return merged;
		},
		refetchInterval: ONE_MINUTE,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		staleTime: TWO_MINUTES,
		placeholderData: keepPreviousData,
	});
};
