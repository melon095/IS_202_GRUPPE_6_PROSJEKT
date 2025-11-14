import { useEffect, useState } from "react";

import { Journey, PlacedObject } from "../types";
import { TWO_SECONDS_MS } from "../utils/time-constants";

export interface UseJourneySummaryReturnType {
	editingObjectId: string | null;
	setEditingObjectId: (id: string | null) => void;
	deleteConfirmId: string | null;
	journeyTitle: string;
	setJourneyTitle: (title: string) => void;
	journeyDescription: string;
	setJourneyDescription: (description: string) => void;
	handleEditObject: (objectId: string) => void;
	handleSaveObject: (objectId: string, updates: Partial<PlacedObject>) => void;
	handleDeleteClick: (objectId: string) => void;
	handleRestore: (objectId: string) => void;
}

export const useJourneySummary = (
	journey: Journey,
	updateObjectInFinishedJourney: (id: string, updates: Partial<PlacedObject>) => void,
	updateFinishedJourneyMeta: (meta: { title: string; description: string }) => void
): UseJourneySummaryReturnType => {
	const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [journeyTitle, setJourneyTitle] = useState<string>(journey.title || "");
	const [journeyDescription, setJourneyDescription] = useState<string>(journey.description || "");

	useEffect(() => {
		if (!deleteConfirmId) return;

		const timer = setTimeout(() => {
			setDeleteConfirmId(null);
		}, TWO_SECONDS_MS);

		return () => clearTimeout(timer);
	}, [deleteConfirmId]);

	useEffect(() => {
		updateFinishedJourneyMeta({ title: journeyTitle, description: journeyDescription });
	}, [journeyTitle, journeyDescription, updateFinishedJourneyMeta]);

	const handleEditObject = (objectId: string) => setEditingObjectId(objectId);

	const handleSaveObject = (objectId: string, updates: Partial<PlacedObject>) => {
		updateObjectInFinishedJourney(objectId, updates);
	};

	const handleDeleteClick = (objectId: string) => {
		if (deleteConfirmId === objectId) {
			updateObjectInFinishedJourney(objectId, { deleted: true });
			setDeleteConfirmId(null);
		} else {
			setDeleteConfirmId(objectId);
		}
	};

	const handleRestore = (objectId: string) => {
		updateObjectInFinishedJourney(objectId, { deleted: false });
	};

	return {
		editingObjectId,
		setEditingObjectId,
		deleteConfirmId,
		journeyTitle,
		setJourneyTitle,
		journeyDescription,
		setJourneyDescription,
		handleEditObject,
		handleSaveObject,
		handleDeleteClick,
		handleRestore,
	};
};
