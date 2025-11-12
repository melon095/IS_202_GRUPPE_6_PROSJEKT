import { TFunction } from "i18next";
import { useState } from "react";

import { useTranslation } from "../i18n";
import { PlaceMode, Point } from "../types";
import { FIVE_SECONDS_MS } from "../utils/time-constants";

export interface UseObjectPlacementReturnType {
	showTypeSelector: boolean;
	setShowTypeSelector: (show: boolean) => void;
	notEnoughPointsMessage: string | null;
	handleFinishPlace: () => void;
	handleCancelPlace: () => void;
	handleCancelTypeSelect: () => void;
}

const hasNotEnoughPointsForPlaceMode = (placeMode: PlaceMode, pointCount: number) => {
	switch (placeMode) {
		case PlaceMode.Point:
			return pointCount < 1;
		case PlaceMode.Line:
			return pointCount < 2;
		case PlaceMode.Area:
			return pointCount < 3;
		default:
			return true;
	}
};

const getNotEnoughPointsMessage = (t: TFunction, placeMode: PlaceMode) => {
	switch (placeMode) {
		case PlaceMode.Point:
			return t("controls.errors.not_enough_points.point");
		case PlaceMode.Line:
			return t("controls.errors.not_enough_points.line");
		case PlaceMode.Area:
			return t("controls.errors.not_enough_points.area");
		default:
			return null;
	}
};

export const useObjectPlacement = (
	placeMode: PlaceMode,
	currentObjectPoints: Point[],
	stopPlacingObject: (typeId?: string) => void,
	clearCurrentObjectPoints: () => void
): UseObjectPlacementReturnType => {
	const { t } = useTranslation();
	const [showTypeSelector, setShowTypeSelector] = useState(false);
	const [notEnoughPointsMessage, setNotEnoughPointsMessage] = useState<string | null>(null);

	const handleFinishPlace = () => {
		if (currentObjectPoints.length <= 0) {
			stopPlacingObject();
		} else if (hasNotEnoughPointsForPlaceMode(placeMode, currentObjectPoints.length)) {
			const message = getNotEnoughPointsMessage(t, placeMode);
			setNotEnoughPointsMessage(message);

			setTimeout(() => {
				setNotEnoughPointsMessage(null);
			}, FIVE_SECONDS_MS);
		} else {
			setShowTypeSelector(true);
		}
	};

	const handleCancelPlace = () => {
		clearCurrentObjectPoints();
		stopPlacingObject();
	};

	const handleCancelTypeSelect = () => {
		setShowTypeSelector(false);
		clearCurrentObjectPoints();
	};

	return {
		showTypeSelector,
		setShowTypeSelector,
		notEnoughPointsMessage,
		handleFinishPlace,
		handleCancelPlace,
		handleCancelTypeSelect,
	};
};
