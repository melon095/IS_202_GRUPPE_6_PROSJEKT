import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Journey, JourneyState, PlacedObject, Point } from "../types";

export interface JourneyFunctions {
	startJourney: () => void;
	undoEndJourney: () => void;
	endJourney: () => void;
	updateJourneyMeta: (updates: Partial<Journey>) => void;
	startPlacingObjects: () => void;
	stopPlacingObject: (typeId?: string | undefined, customType?: string | undefined) => PlacedObject | undefined;
	addPointToCurrentObject: (point: Point) => void;
	updateObjectInCurrentJourney: (objectId: string, updates: Partial<PlacedObject>) => void;
	clearCurrentObjectPoints: () => void;
}

export interface JourneyStore extends JourneyState, JourneyFunctions {}

export const useJourneyStore = create<JourneyStore>()(
	persist(
		(set, get) => ({
			currentJourney: null,
			isPlacingObject: false,
			currentObjectPoints: [],
			journeyHistory: [],

			startJourney: () => {
				const journey: Journey = {
					id: globalThis.crypto.randomUUID(),
					startTime: Date.now(),
					objects: [],
				};

				set({ currentJourney: journey });
			},

			undoEndJourney: () => {
				const { currentJourney } = get();
				if (!currentJourney || !currentJourney.endTime) return;

				const updatedJourney: Journey = {
					...currentJourney,
					endTime: undefined,
				};

				set({ currentJourney: updatedJourney });
			},

			endJourney: () => {
				const { currentJourney } = get();
				if (!currentJourney) return;

				const completedJourney: Journey = {
					...currentJourney,
					endTime: Date.now(),
				};

				set(() => ({
					currentJourney: completedJourney,
					isPlacingObject: false,
					currentObjectPoints: [],
					// journeyHistory: [completedJourney, ...state.journeyHistory],
				}));
			},

			updateJourneyMeta: (updates) => {
				const { currentJourney } = get();
				if (!currentJourney) return;

				const updatedJourney: Journey = {
					...currentJourney,
					...updates,
				};

				set({ currentJourney: updatedJourney });
			},

			startPlacingObjects: () => {
				set({ isPlacingObject: true, currentObjectPoints: [] });
			},

			stopPlacingObject: (typeId, customType) => {
				const { currentJourney, currentObjectPoints } = get();
				if (!currentJourney || currentObjectPoints.length === 0) {
					set({ isPlacingObject: false, currentObjectPoints: [] });

					return;
				}

				const newObject: PlacedObject = {
					id: globalThis.crypto.randomUUID(),
					points: currentObjectPoints,
					typeId: typeId,
					customType: customType,
					createdAt: new Date().toISOString(),
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
				point.timestamp = new Date().toISOString();

				set((state) => ({
					currentObjectPoints: [...state.currentObjectPoints, point],
				}));
			},

			updateObjectInCurrentJourney: (objectId, updates) => {
				const { currentJourney } = get();

				if (!currentJourney) return;

				const updatedObjects = currentJourney.objects.map((obj) =>
					obj.id === objectId ? { ...obj, ...updates } : obj
				);

				set({
					currentJourney: {
						...currentJourney,
						objects: updatedObjects,
					},
				});
			},

			clearCurrentObjectPoints: () => set({ currentObjectPoints: [] }),
		}),
		{
			name: "journey-store",
			storage: createJSONStorage(() => localStorage),
		}
	)
);
