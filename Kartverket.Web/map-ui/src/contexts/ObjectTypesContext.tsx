import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import { ObjectType } from "../types";

interface ObjectTypesContextType {
	objectTypes: ObjectType[];
	isLoading: boolean;
	error: Error | null;
	getObjectTypeById: (id: string) => ObjectType | undefined;
	getObjectTypeByName: (name: string) => ObjectType | undefined;
}

const ObjectTypeContext = createContext<ObjectTypesContextType | undefined>(undefined);

const fetchObjectTypes = async (): Promise<ObjectType[]> => {
	const response = await fetch("/ObjectTypes/List");
	if (!response.ok) {
		throw new Error("Failed to fetch object types");
	}
	return response.json();
};

export const ObjectTypesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const {
		data: objectTypes = [],
		isLoading,
		error,
	} = useQuery<ObjectType[]>({
		queryKey: ["objectTypes"],
		queryFn: fetchObjectTypes,
		staleTime: 1000 * 60 * 60, // 1 hour
		gcTime: 1000 * 60 * 60 * 24, // 24 hours
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const getObjectTypeById = (id: string) => {
		return objectTypes.find((type) => type.id === id);
	};

	const getObjectTypeByName = (name: string) => {
		return objectTypes.find((type) => type.name === name);
	};

	const contextValue: ObjectTypesContextType = {
		objectTypes,
		isLoading,
		error: error ? (error as Error) : null,
		getObjectTypeById,
		getObjectTypeByName,
	};

	return <ObjectTypeContext.Provider value={contextValue}>{children}</ObjectTypeContext.Provider>;
};

export const useObjectTypes = (): ObjectTypesContextType => {
	const context = useContext(ObjectTypeContext);
	if (!context) {
		throw new Error("useObjectTypes must be used within an ObjectTypesProvider");
	}
	return context;
};
