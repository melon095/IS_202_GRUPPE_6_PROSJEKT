import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Journey, JourneyState, PlacedObject, Point } from "../types";

export interface JourneyFunctions {
	startJourney: () => void;
	undoEndJourney: () => void;
	endJourney: () => void;
	deleteEndJourney: () => void;
	updateFinishedJourneyMeta: (updates: Partial<Journey>) => void;
	startPlacingObjects: () => void;
	stopPlacingObject: (typeId?: string | undefined) => PlacedObject | undefined;
	addPointToCurrentObject: (point: Point) => void;
	updateObjectinFinishedJourney: (objectId: string, updates: Partial<PlacedObject>) => void;
	clearCurrentObjectPoints: () => void;
	updateJourneyId: (newId: string) => void;
	updateObjectId: (obj: PlacedObject, newId: string) => void;
}

export interface JourneyStore extends JourneyState, JourneyFunctions {}

export const useJourneyStore = create<JourneyStore>()(
	persist(
		(set, get) => ({
			currentJourney: null,
			finishedJourney: null,
			isPlacingObject: false,
			currentObjectPoints: [],

			startJourney: () => {
				const journey: Journey = {
					startTime: Date.now(),
					objects: [],
				};

				set({ currentJourney: journey });
			},

			undoEndJourney: () => {
				const { finishedJourney } = get();
				if (!finishedJourney) return;

				set({
					currentJourney: finishedJourney,
					finishedJourney: null,
				});
			},

			endJourney: () => {
				const { currentJourney } = get();
				if (!currentJourney) return;

				const completedJourney: Journey = {
					...currentJourney,
					endTime: Date.now(),
				};

				set(() => ({
					currentJourney: null,
					finishedJourney: completedJourney,
					isPlacingObject: false,
					currentObjectPoints: [],
				}));
			},

			deleteEndJourney: () => {
				set({ finishedJourney: null });
			},

			updateFinishedJourneyMeta: (updates) => {
				const { finishedJourney } = get();

				if (!finishedJourney) return;

				const updatedJourney = {
					...finishedJourney,
					...updates,
				};

				set({ finishedJourney: updatedJourney });
			},

			startPlacingObjects: () => {
				set({ isPlacingObject: true, currentObjectPoints: [] });
			},

			stopPlacingObject: (typeId) => {
				const { currentJourney, currentObjectPoints } = get();
				if (!currentJourney || currentObjectPoints.length === 0) {
					set({ isPlacingObject: false, currentObjectPoints: [] });

					return;
				}

				const newObject: PlacedObject = {
					id: globalThis.crypto.randomUUID(),
					points: currentObjectPoints,
					typeId: typeId,
					createdAt: new Date().toISOString(),
					deleted: false,
				};

				const updatedJourney: Journey = {
					...currentJourney,
					objects: [...currentJourney.objects, newObject],
				};

				set({
					currentJourney: updatedJourney,
					isPlacingObject: false,
					currentObjectPoints: [],
				});

				return newObject;
			},

			addPointToCurrentObject: (point) => {
				point.createdAt = new Date().toISOString();

				set((state) => ({
					currentObjectPoints: [...state.currentObjectPoints, point],
				}));
			},

			updateObjectinFinishedJourney: (objectId, updates) => {
				const { finishedJourney } = get();

				if (!finishedJourney) return;

				const updatedObjects = finishedJourney.objects.map((obj) =>
					obj.id === objectId ? { ...obj, ...updates } : obj
				);

				const updatedJourney = {
					...finishedJourney,
					objects: updatedObjects,
				};

				set({ finishedJourney: updatedJourney });
			},

			clearCurrentObjectPoints: () => set({ currentObjectPoints: [] }),

			updateJourneyId: (newId) => {
				const { currentJourney } = get();
				if (!currentJourney) return;

				set({
					currentJourney: {
						...currentJourney,
						id: newId,
					},
				});
			},

			updateObjectId: (obj, newId) => {
				const { currentJourney } = get();
				if (!currentJourney) return;

				const objectInStore = currentJourney.objects.find((o) => o === obj);
				if (!objectInStore) return;

				const updatedObjects = currentJourney.objects.map((o) =>
					o === objectInStore ? { ...o, id: newId } : o
				);

				set({
					currentJourney: {
						...currentJourney,
						objects: updatedObjects,
					},
				});
			},
		}),
		{
			name: "journey-store",
			storage: createJSONStorage(() => localStorage),
		}
	)
);
