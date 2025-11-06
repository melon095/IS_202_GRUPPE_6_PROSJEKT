import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Journey, JourneyState, PlacedHindrance, PlaceMode, Point } from "../types";

export interface JourneyFunctions {
	startJourney: () => void;
	undoEndJourney: () => void;
	endJourney: () => void;
	deleteEndJourney: () => void;
	updateFinishedJourneyMeta: (updates: Partial<Journey>) => void;
	setPlaceMode: (mode: PlaceMode) => void;
	stopPlacingHindrance: (typeId?: string | undefined) => PlacedHindrance | undefined;
	addPointToCurrentHindrance: (point: Point) => void;
	updateHindranceinFinishedJourney: (hindranceId: string, updates: Partial<PlacedHindrance>) => void;
	clearCurrentHindrancePoints: () => void;
	updateJourneyId: (newId: string) => void;
	updateHindranceId: (hindrance: PlacedHindrance, newId: string) => void;
}

export interface JourneyStore extends JourneyState, JourneyFunctions {}

export const useJourneyStore = create<JourneyStore>()(
	persist(
		(set, get) => ({
			currentJourney: null,
			finishedJourney: null,
			isPlacingHindrance: false,
			placeMode: PlaceMode.None,
			currentHindrancePoints: [],

			startJourney: () => {
				const journey: Journey = {
					startTime: Date.now(),
					hindrances: [],
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
					isPlacingHindrance: false,
					currentHindrancePoints: [],
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

			setPlaceMode: (mode) => {
				set({ placeMode: mode });
			},

			stopPlacingHindrance: (typeId) => {
				const { currentJourney, currentHindrancePoints: currentHindrancePoints, placeMode } = get();
				if (!currentJourney || currentHindrancePoints.length === 0) {
					set({ placeMode: PlaceMode.None, currentHindrancePoints: [] });

					return;
				}

				const newHindrance: PlacedHindrance = {
					id: globalThis.crypto.randomUUID(),
					points: currentHindrancePoints,
					typeId: typeId,
					geometryType: placeMode,
					createdAt: new Date().toISOString(),
					deleted: false,
				};

				const updatedJourney: Journey = {
					...currentJourney,
					hindrances: [...currentJourney.hindrances, newHindrance],
				};

				set({
					currentJourney: updatedJourney,
					placeMode: PlaceMode.None,
					currentHindrancePoints: [],
				});

				return newHindrance;
			},

			addPointToCurrentHindrance: (point) => {
				const { placeMode, currentJourney } = get();
				if (placeMode === PlaceMode.None || !currentJourney) return;

				point.createdAt = new Date().toISOString();

				if (placeMode == PlaceMode.Point) {
					return set(() => ({
						currentHindrancePoints: [point],
					}));
				}

				set((state) => ({
					currentHindrancePoints: [...state.currentHindrancePoints, point],
				}));
			},

			updateHindranceinFinishedJourney: (hindranceId, updates) => {
				const { finishedJourney } = get();

				if (!finishedJourney) return;

				const updatedHindrances = finishedJourney.hindrances.map((h) =>
					h.id === hindranceId ? { ...h, ...updates } : h
				);

				const updatedJourney: Journey = {
					...finishedJourney,
					hindrances: updatedHindrances,
				};

				set({ finishedJourney: updatedJourney });
			},

			clearCurrentHindrancePoints: () => set({ currentHindrancePoints: [] }),

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

			updateHindranceId: (hindrance, newId) => {
				const { currentJourney } = get();
				if (!currentJourney) return;

				const hindrancesInStore = currentJourney.hindrances.find((h) => h === hindrance);
				if (!hindrancesInStore) return;

				const updateHindrances = currentJourney.hindrances.map((h) =>
					h === hindrancesInStore ? { ...h, id: newId } : h
				);

				set({
					currentJourney: {
						...currentJourney,
						hindrances: updateHindrances,
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
