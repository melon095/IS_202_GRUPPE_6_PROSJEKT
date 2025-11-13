import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Journey, JourneyState, PlacedObject, PlaceMode, Point } from "../types";

export interface JourneyFunctions {
	startJourney: () => void;
	undoEndJourney: () => void;
	endJourney: () => void;
	deleteEndJourney: () => void;
	deleteStore: () => void;
	updateFinishedJourneyMeta: (updates: Partial<Journey>) => void;
	setPlaceMode: (mode: PlaceMode) => void;
	stopPlacingObject: (typeId?: string | undefined) => PlacedObject | undefined;
	addPointToCurrentObject: (point: Point) => void;
	updateObjectInFinishedJourney: (objectId: string, updates: Partial<PlacedObject>) => void;
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
			placeMode: PlaceMode.None,
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

			deleteStore: () => {
				set({
					currentJourney: null,
					finishedJourney: null,
					placeMode: PlaceMode.None,
					currentObjectPoints: [],
				});
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

			setPlaceMode: (mode) => {
				set({ placeMode: mode });
			},

			stopPlacingObject: (typeId) => {
				const { currentJourney, currentObjectPoints, placeMode } = get();
				if (!currentJourney || currentObjectPoints.length === 0) {
					set({ placeMode: PlaceMode.None, currentObjectPoints: [] });

					return;
				}

				const newObject: PlacedObject = {
					id: globalThis.crypto.randomUUID(),
					points: currentObjectPoints,
					typeId: typeId,
					geometryType: placeMode,
					createdAt: new Date().toISOString(),
					deleted: false,
				};

				const updatedJourney: Journey = {
					...currentJourney,
					objects: [...currentJourney.objects, newObject],
				};

				set({
					currentJourney: updatedJourney,
					placeMode: PlaceMode.None,
					currentObjectPoints: [],
				});

				return newObject;
			},

			addPointToCurrentObject: (point) => {
				const { placeMode, currentJourney } = get();
				if (placeMode === PlaceMode.None || !currentJourney) return;

				point.createdAt = new Date().toISOString();

				if (placeMode == PlaceMode.Point) {
					return set(() => ({
						currentObjectPoints: [point],
					}));
				}

				set((state) => ({
					currentObjectPoints: [...state.currentObjectPoints, point],
				}));
			},

			updateObjectInFinishedJourney: (objectId, updates) => {
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
