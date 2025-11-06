import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import { HindranceType } from "../types";

interface HindranceTypesContextType {
	hindranceTypes: HindranceType[];
	isLoading: boolean;
	error: Error | null;
	getHindranceTypeById: (id?: string) => HindranceType | undefined;
	getHindranceTypeByName: (name: string) => HindranceType | undefined;
}

const HindranceTypeContext = createContext<HindranceTypesContextType | undefined>(undefined);

const fetchHindranceTypes = async (): Promise<HindranceType[]> => {
	const response = await fetch("/HindranceTypes/List");
	if (!response.ok) {
		throw new Error("Failed to fetch hindrance types");
	}
	return response.json();
};

export const HindranceTypesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const {
		data: hindranceTypes = [],
		isLoading,
		error,
	} = useQuery<HindranceType[]>({
		queryKey: ["hindranceTypes"],
		queryFn: fetchHindranceTypes,
		staleTime: 1000 * 60 * 60, // 1 hour
		gcTime: 1000 * 60 * 60 * 24, // 24 hours
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const getHindranceTypeById = (id?: string) => {
		if (!id) return undefined;

		return hindranceTypes.find((type) => type.id === id);
	};

	const getHindranceTypeByName = (name?: string) => {
		if (!name) return undefined;

		return hindranceTypes.find((type) => type.name === name);
	};

	const contextValue: HindranceTypesContextType = {
		hindranceTypes,
		isLoading,
		error: error ? (error as Error) : null,
		getHindranceTypeById,
		getHindranceTypeByName,
	};

	return <HindranceTypeContext.Provider value={contextValue}>{children}</HindranceTypeContext.Provider>;
};

export const useHindranceTypes = (): HindranceTypesContextType => {
	const context = useContext(HindranceTypeContext);
	if (!context) {
		throw new Error("useHindranceTypes must be used within a HindranceTypesProvider");
	}
	return context;
};
