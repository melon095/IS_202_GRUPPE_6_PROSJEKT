import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "vite/modulepreload-polyfill";

import App from "./App.js";
import "//unpkg.com/react-scan/dist/auto.global.js";

document.querySelector("header")!.style.display = "none";
document.querySelector("footer")!.style.display = "none";

const appElement = document.querySelector<HTMLDivElement>("#app");
const root = createRoot(appElement!);

root.render(
	<StrictMode>
		<App />
	</StrictMode>
);
