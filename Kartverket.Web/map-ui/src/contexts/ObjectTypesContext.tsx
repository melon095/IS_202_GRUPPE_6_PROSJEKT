import { useQuery } from "@tanstack/react-query";
import { createContext } from "react";

import { GeometryType, ObjectType, ObjectTypesListResponse } from "../types";
import { ONE_DAY_MS, ONE_HOUR_MS } from "../utils/time-constants";

export interface ObjectTypesContextType {
	objectTypes: ObjectType[];
	isLoading: boolean;
	error: Error | null;
	getObjectTypeById: (id?: string) => ObjectType | undefined;
	getObjectTypeByName: (name: string) => ObjectType | undefined;
	getStandardObjectType: (type: GeometryType) => ObjectType | undefined;
	isObjectTypeStandard: (id: string) => boolean;
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
		staleTime: ONE_HOUR_MS,
		gcTime: ONE_DAY_MS,
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

	const isObjectTypeStandard = (id: string): boolean => {
		if (!data) return false;

		return Object.values(data.standardTypeIds).includes(id);
	};

	const contextValue: ObjectTypesContextType = {
		objectTypes: data?.objectTypes || [],
		isLoading,
		error: error ? (error as Error) : null,
		getObjectTypeById,
		getObjectTypeByName,
		getStandardObjectType,
		isObjectTypeStandard,
	};

	return <ObjectTypeContext.Provider value={contextValue}>{children}</ObjectTypeContext.Provider>;
};

export default ObjectTypeContext;
