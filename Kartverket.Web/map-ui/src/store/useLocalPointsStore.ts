import { create } from "zustand";
import { Point } from "../types";

interface PointState {
	points: Point[];

	addPoint: (point: Point) => void;

	clearPoints: () => void;
}

export const STORAGE_KEY = "localPoints";

export const usePointStore = create<PointState>((set) => ({
	points: JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),

	addPoint: (point) =>
		set((state) => {
			const updated = [...state.points, point];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			return { points: updated };
		}),

	clearPoints: () =>
		set(() => {
			localStorage.removeItem(STORAGE_KEY);
			return { points: [] };
		}),
}));
