import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import no from "./locales/no.json";

i18n.use(initReactI18next).init({
	resources: {
		no: {
			translation: no,
		},
	},
	lng: "no",
	fallbackLng: "no",
	interpolation: {
		escapeValue: false,
	},
});

const useTranslation = () => {
	const t = (key: string, options?: Record<string, unknown>) => {
		return i18n.t(key, options);
	};
	return { t };
};

export default i18n;
export { useTranslation };
