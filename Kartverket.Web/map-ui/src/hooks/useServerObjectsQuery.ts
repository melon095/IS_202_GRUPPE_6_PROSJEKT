import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { ServerStateResponse } from "../types";
import { extrapolateErrors } from "../utils/extrapolateErrors";

const ONE_MINUTE = 60 * 1000;
const TWO_MINUTES = 2 * ONE_MINUTE;

export const useServerObjectsQuery = () => {
	const queryClient = useQueryClient();
	const lastFetchTimeRef = useRef<string | null>(null);

	return useQuery({
		// eslint-disable-next-line @tanstack/query/exhaustive-deps
		queryKey: ["serverSideObjects"],
		queryFn: async () => {
			const since = lastFetchTimeRef.current ? `?since=${encodeURIComponent(lastFetchTimeRef.current)}` : "";

			const res = await fetch(`/Map/GetObjects${since}`, {
				method: "GET",
			});
			if (!res.ok) throw await extrapolateErrors(res);

			const data = (await res.json()) as ServerStateResponse;

			lastFetchTimeRef.current = new Date().toISOString();

			return queryClient.setQueryData<ServerStateResponse>(
				["serverSideObjects"],
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
