import { TFunction } from "i18next";
import { DomEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useGeolocated } from "react-geolocated";
import { useMap } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { useSyncObjectMutation } from "../hooks/useSyncObjectMutation";
import { useTranslation } from "../i18n";
import { PlaceMode } from "../types";
import { IconFlex } from "./IconFlex";
import { ObjectTypeSelector } from "./ObjectTypeSelector";

interface JourneyControlsProps {
	children?: React.ReactNode;
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

export const JourneyControls = ({ children }: JourneyControlsProps) => {
	const { t } = useTranslation();
	const {
		currentJourney,
		placeMode,
		currentObjectPoints,
		clearCurrentObjectPoints,
		endJourney,
		startJourney,
		stopPlacingObject,
		updateJourneyId,
		updateObjectId,
		setPlaceMode,
	} = useJourney();
	const map = useMap();
	const syncObjectMutation = useSyncObjectMutation();
	const [showTypeSelector, setShowTypeSelector] = useState(false);
	const overlayRef = useRef<HTMLDivElement>(null);
	const [isFollowing, setIsFollowing] = useState(false);
	const { coords } = useGeolocated({
		positionOptions: {
			enableHighAccuracy: true,
		},
	});
	const watchIdRef = useRef<number | null>(null);
	const programmaticFlyToRef = useRef(false);
	const [notEnoughPointsMessage, setNotEnoughPointsMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!overlayRef.current) return;

		DomEvent.disableClickPropagation(overlayRef.current);
		DomEvent.disableScrollPropagation(overlayRef.current);
	}, [overlayRef]);

	useEffect(() => {
		const handleMoveStart = () => {
			if (isFollowing && !programmaticFlyToRef.current) {
				setIsFollowing(false);
			}
		};

		map.on("movestart", handleMoveStart);

		return () => {
			map.off("movestart", handleMoveStart);
		};
	}, [map, isFollowing]);

	useEffect(() => {
		const ref = watchIdRef;

		return () => {
			if (ref.current !== null) {
				navigator.geolocation.clearWatch(ref.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!isFollowing || !coords) return;

		programmaticFlyToRef.current = true;
		const zoom = map.getZoom();
		const relZoom = zoom < 15 ? 15 : zoom;
		map.flyTo([coords.latitude, coords.longitude], relZoom, {
			animate: true,
			duration: 1.0,
		});

		setTimeout(() => {
			programmaticFlyToRef.current = false;
		}, 1000);
	}, [map, coords, isFollowing]);

	const toggleFollowing = () => {
		if (!isFollowing && !navigator.geolocation) {
			return;
		}

		setIsFollowing((prev) => !prev);
	};

	const handleFinishPlace = () => {
		if (currentObjectPoints.length <= 0) {
			stopPlacingObject();
		} else if (hasNotEnoughPointsForPlaceMode(placeMode, currentObjectPoints.length)) {
			const message = getNotEnoughPointsMessage(t, placeMode);
			setNotEnoughPointsMessage(message);

			setTimeout(() => {
				setNotEnoughPointsMessage(null);
			}, 5000);
		} else {
			setShowTypeSelector(true);
		}
	};

	const handleCancelPlace = () => {
		clearCurrentObjectPoints();
		stopPlacingObject();
	};

	const handleTypeSelect = (typeId?: string) => {
		const lastObject = stopPlacingObject(typeId);
		setShowTypeSelector(false);

		if (!currentJourney || !navigator.onLine || !lastObject) return;

		syncObjectMutation.mutate(
			{
				object: lastObject,
				journeyId: currentJourney.id,
			},
			{
				onSuccess(data) {
					updateJourneyId(data.journeyId);
					updateObjectId(lastObject, data.objectId);
				},
			}
		);
	};

	const handleCancelTypeSelect = () => {
		setShowTypeSelector(false);
		clearCurrentObjectPoints();
	};

	return (
		<div ref={overlayRef} style={{ zIndex: 1000 }}>
			{currentJourney === null ? (
				<div className="journey-controls-overlay">
					<div className="box">
						<div className="field">
							<div className="control">
								<IconFlex
									as="button"
									onClick={startJourney}
									icon={["fas", "play"]}
									className="is-success is-large"
									fullWidth
								>
									{t("controls.buttons.start")}
								</IconFlex>
							</div>
						</div>

						<div className="content">{children}</div>
					</div>
				</div>
			) : showTypeSelector ? (
				<div className="journey-controls-overlay">
					<ObjectTypeSelector
						onSelect={handleTypeSelect}
						onCancel={handleCancelTypeSelect}
						placeMode={placeMode}
					/>
				</div>
			) : (
				<div className="journey-controls-overlay">
					<div className="box">
						<div className="content">
							<IconFlex as="h4" icon={["fas", "route"]} className="title is-5 mb-3">
								{t("controls.header")}
							</IconFlex>

							<div className="tags has-addons mb-3">
								<span className="tag is-dark">{t("controls.objects_count")}</span>
								<span className="tag is-info">{currentJourney.objects.length}</span>
							</div>

							{placeMode !== PlaceMode.None && (
								<div className="tags has-addons mb-3">
									<span className="tag is-dark">{t("controls.point_count")}</span>
									<span className="tag is-warning">{currentObjectPoints.length}</span>
								</div>
							)}

							{syncObjectMutation.isPending && (
								<IconFlex as="div" icon={["fas", "sync"]} className="mb-3" fullWidth>
									{t("controls.syncing")}
								</IconFlex>
							)}
						</div>

						<hr className="divider my-3" />

						<div className="content mb-3">
							{notEnoughPointsMessage && (
								<div className="notification is-warning is-light">{notEnoughPointsMessage}</div>
							)}
						</div>

						<div className="content mb-3">
							{placeMode === PlaceMode.Point && (
								<IconFlex as="div" icon={["fas", "crosshairs"]} className="message is-info" fullWidth>
									{t("controls.placing_point")}
								</IconFlex>
							)}
							{placeMode === PlaceMode.Line && (
								<IconFlex as="div" icon={["fas", "route"]} className="is-info" fullWidth>
									{t("controls.placing_line")}
								</IconFlex>
							)}
							{placeMode === PlaceMode.Area && (
								<IconFlex as="div" icon={["fas", "draw-polygon"]} className="is-info" fullWidth>
									{t("controls.placing_area")}
								</IconFlex>
							)}
						</div>

						<div className="buttons">
							<div>
								{placeMode === PlaceMode.None ? (
									<>
										<p className="control is-expanded mb-2">
											<IconFlex
												as="button"
												onClick={() => setPlaceMode(PlaceMode.Point)}
												icon={["fas", "crosshairs"]}
												fullWidth
												style={{ justifyContent: "space-between" }}
												className="is-info"
											>
												{t("controls.buttons.place_point")}
											</IconFlex>
										</p>
										<p className="control is-expanded mb-2">
											<IconFlex
												as="button"
												onClick={() => setPlaceMode(PlaceMode.Line)}
												icon={["fas", "route"]}
												fullWidth
												style={{ justifyContent: "space-between" }}
												className="is-info"
											>
												{t("controls.buttons.place_line")}
											</IconFlex>
										</p>
										<p className="control is-expanded mb-2">
											<IconFlex
												as="button"
												onClick={() => setPlaceMode(PlaceMode.Area)}
												icon={["fas", "draw-polygon"]}
												fullWidth
												style={{ justifyContent: "space-between" }}
												className="is-info"
											>
												{t("controls.buttons.place_area")}
											</IconFlex>
										</p>
									</>
								) : (
									<div className="buttons mb-3">
										<IconFlex
											as="button"
											onClick={handleFinishPlace}
											icon={["fas", "check"]}
											className="is-success"
											fullWidth
										>
											{t("controls.buttons.stop", { count: currentObjectPoints.length })}
										</IconFlex>

										<IconFlex
											as="button"
											onClick={handleCancelPlace}
											icon={["fas", "trash-alt"]}
											className="is-light"
											fullWidth
										>
											{t("controls.buttons.cancel")}
										</IconFlex>
									</div>
								)}
							</div>
						</div>
						<hr className="divider my-3" />
						<div className="buttons">
							<IconFlex
								as="button"
								onClick={endJourney}
								icon={["fas", "stop-circle"]}
								className="is-danger"
								fullWidth
							>
								{t("controls.buttons.end")}
							</IconFlex>
						</div>
						<hr className="divider my-3" />
						<div>
							<div className="content is-small">
								<IconFlex
									as="button"
									onClick={toggleFollowing}
									icon={["fas", "location-arrow"]}
									className={isFollowing ? "is-success" : "is-light"}
									fullWidth
								>
									{t("controls.buttons.my_location")}
								</IconFlex>
							</div>
						</div>
						<div className="content">{children}</div>
					</div>
				</div>
			)}
		</div>
	);
};
