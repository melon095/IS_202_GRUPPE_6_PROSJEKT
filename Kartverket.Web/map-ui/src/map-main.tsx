import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { scan } from "react-scan";
// eslint-disable-next-line import/no-unresolved
import "vite/modulepreload-polyfill";

import { MapComponent } from "./components/MapComponent";
import { ObjectTypesProvider } from "./contexts/ObjectTypesContext";

declare global {
	export interface AppData {
		mapElementId: string
	}

	// eslint-disable-next-line no-var
	export var APP_DATA: AppData;
}

if (process.env.NODE_ENV === "development") {
	scan({
		enabled: true,
	});
}

if (window.APP_DATA === undefined) {
	throw new Error("APP_DATA is not defined");
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const container = document.getElementById(window.APP_DATA.mapElementId);
const root = createRoot(container!);

root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ReactQueryDevtools initialIsOpen={false} />

			<ObjectTypesProvider>
				<MapComponent objects={[]} />
			</ObjectTypesProvider>
		</QueryClientProvider>
	</StrictMode>
);
