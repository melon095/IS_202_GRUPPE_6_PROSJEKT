import { useContext } from "react";

import ObjectTypeContext, { ObjectTypesContextType } from "../contexts/ObjectTypesContext";

export const useObjectTypes = (): ObjectTypesContextType => {
	const context = useContext(ObjectTypeContext);
	if (!context) {
		throw new Error("useObjectTypes must be used within an ObjectTypesProvider");
	}

	return context;
};
