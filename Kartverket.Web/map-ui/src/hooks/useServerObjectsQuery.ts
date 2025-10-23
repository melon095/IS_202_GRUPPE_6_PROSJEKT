import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { ServerStateResponse } from "../types";
import { extrapolateErrors } from "../utils/extrapolateErrors";

const ONE_MINUTE = 60 * 1000;
const TWO_MINUTES = 2 * ONE_MINUTE;

export const useServerObjectsQuery = (currentReportId?: string) => {
	const queryClient = useQueryClient();
	const lastFetchTimeRef = useRef<string | null>(null);

	useEffect(() => {
		lastFetchTimeRef.current = null;
	}, [currentReportId]);

	return useQuery({
		queryKey: ["serverSideObjects", currentReportId, lastFetchTimeRef],
		queryFn: async () => {
			const qp = new URLSearchParams();
			if (lastFetchTimeRef.current) {
				qp.append("since", encodeURIComponent(lastFetchTimeRef.current));
			}
			if (currentReportId) {
				qp.append("reportId", currentReportId);
			}

			const res = await fetch(`/Map/GetObjects?${qp.toString()}`, {
				method: "GET",
			});
			if (!res.ok) throw await extrapolateErrors(res);

			const data = (await res.json()) as ServerStateResponse;

			lastFetchTimeRef.current = new Date().toISOString();

			return queryClient.setQueryData<ServerStateResponse>(
				["serverSideObjects", currentReportId, lastFetchTimeRef],
				(oldData: ServerStateResponse | undefined = []) => {
					if (!oldData) return data;
					const merged = [...oldData];

					data.forEach((newObj) => {
						const index = merged.findIndex((obj) => obj.id === newObj.id);
						if (index !== -1) {
							merged[index] = newObj;
						} else {
							merged.push(newObj);
						}
					});

					return merged;
				}
			);
		},
		refetchInterval: ONE_MINUTE,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		staleTime: TWO_MINUTES,
		placeholderData: keepPreviousData,
	});
};
