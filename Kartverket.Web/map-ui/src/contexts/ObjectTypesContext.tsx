import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import { GeometryType, ObjectType, ObjectTypesListResponse } from "../types";

interface ObjectTypesContextType {
	objectTypes: ObjectType[];
	isLoading: boolean;
	error: Error | null;
	getObjectTypeById: (id?: string) => ObjectType | undefined;
	getObjectTypeByName: (name: string) => ObjectType | undefined;
	getStandardObjectType: (type: GeometryType) => ObjectType | undefined;
}

const ObjectTypeContext = createContext<ObjectTypesContextType | undefined>(undefined);

const fetchObjectTypes = async (): Promise<ObjectTypesListResponse> => {
	const response = await fetch("/ObjectTypes/List");
	if (!response.ok) {
		throw new Error("Failed to fetch object types");
	}
	return response.json();
};

export const ObjectTypesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { data, isLoading, error } = useQuery({
		queryKey: ["objectTypes"],
		queryFn: fetchObjectTypes,
		staleTime: 1000 * 60 * 60, // 1 hour
		gcTime: 1000 * 60 * 60 * 24, // 24 hours
		retry: 3,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const getObjectTypeById = (id?: string) => {
		if (!id || !data) return undefined;

		return data.objectTypes.find((type) => type.id === id);
	};

	const getObjectTypeByName = (name?: string) => {
		if (!name || !data) return undefined;

		return data.objectTypes.find((type) => type.name === name);
	};

	const getStandardObjectType = (type: GeometryType): ObjectType | undefined => {
		if (!data) return undefined;

		const id = data.standardTypeIds[type as keyof typeof data.standardTypeIds];
		const objectType = getObjectTypeById(id);

		if (!objectType) {
			return undefined;
		}

		return objectType;
	};

	const contextValue: ObjectTypesContextType = {
		objectTypes: data?.objectTypes || [],
		isLoading,
		error: error ? (error as Error) : null,
		getObjectTypeById,
		getObjectTypeByName,
		getStandardObjectType,
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
