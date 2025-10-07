import "//unpkg.com/react-scan/dist/auto.global.js";

import "vite/modulepreload-polyfill";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import { StrictMode } from "react";

document.querySelector("header")!.style.display = "none";
document.querySelector("footer")!.style.display = "none";

const appElement = document.querySelector<HTMLDivElement>("#app");
const root = createRoot(appElement!);

root.render(
	<StrictMode>
		<App />
	</StrictMode>
);
