import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { scan } from "react-scan";
// eslint-disable-next-line import/no-unresolved
import "vite/modulepreload-polyfill";

import App from "./App";

if (process.env.NODE_ENV === "development") {
	scan({
		enabled: true,
	});
}

document.querySelector("header")!.style.display = "none";
document.querySelector("footer")!.style.display = "none";

const appElement = document.querySelector<HTMLDivElement>("#app");
const root = createRoot(appElement!);

root.render(
	<StrictMode>
		<App />
	</StrictMode>
);
