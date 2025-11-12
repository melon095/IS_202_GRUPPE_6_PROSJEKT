import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { ServerStateResponse } from "../types";
import { extrapolateErrors } from "../utils/extrapolateErrors";
import { ONE_MINUTE_MS, TWO_MINUTES_MS } from "../utils/time-constants";

export const useServerObjectsQuery = (currentReportId?: string) => {
	const queryClient = useQueryClient();
	const lastFetchTimeRef = useRef<string | null>(null);

	useEffect(() => {
		lastFetchTimeRef.current = null;
	}, [currentReportId]);

	return useQuery<ServerStateResponse>({
		// eslint-disable-next-line @tanstack/query/exhaustive-deps
		queryKey: ["serverSideObjects", currentReportId],
		queryFn: async () => {
			const qp = new URLSearchParams();

			if (lastFetchTimeRef.current) {
				qp.append("since", lastFetchTimeRef.current);
			}
			if (currentReportId) {
				qp.append("reportId", currentReportId);
			}

			try {
				const res = await fetch(`/Map/GetObjects?${qp.toString()}`, {
					method: "GET",
				});

				if (!res.ok) {
					throw new Error(
						`Feil ved henting av serverobjekter: ${res.status} ${res.statusText}. ${extrapolateErrors(res)}`
					);
				}

				const newData = (await res.json()) as ServerStateResponse;

				lastFetchTimeRef.current = new Date().toISOString();

				const oldData = queryClient.getQueryData<ServerStateResponse>(["serverSideObjects", currentReportId]);

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

				queryClient.setQueryData(["serverSideObjects", currentReportId], merged);

				return merged;
			} catch (error) {
				// Hvis noe går galt, bryr vi oss ikke om feilmeldingen, vi bare fortsetter å bruke gamle data

				const oldData = queryClient.getQueryData<ServerStateResponse>(["serverSideObjects", currentReportId]);
				if (oldData) return oldData;

				throw error;
			}
		},
		refetchInterval: ONE_MINUTE_MS,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		staleTime: TWO_MINUTES_MS,
		placeholderData: keepPreviousData,
	});
};
