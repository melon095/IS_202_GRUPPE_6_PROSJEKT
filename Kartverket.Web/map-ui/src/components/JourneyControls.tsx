import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DomEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { useSyncObjectMutation } from "../hooks/useSyncObjectMutation";
import { useTranslation } from "../i18n";
import { ObjectTypeSelector } from "./ObjectTypeSelector";

interface JourneyControlsProps {
	children?: React.ReactNode;
}

export const JourneyControls = ({ children }: JourneyControlsProps) => {
	const { t } = useTranslation();
	const {
		currentJourney,
		isPlacingObject,
		currentObjectPoints,
		clearCurrentObjectPoints,
		endJourney,
		startJourney,
		startPlacingObjects,
		stopPlacingObject,
		updateJourneyId,
		updateObjectId,
	} = useJourney();
	const map = useMap();

	const syncObjectMutation = useSyncObjectMutation();
	const [showTypeSelector, setShowTypeSelector] = useState(false);
	const overlayRef = useRef<HTMLDivElement>(null);
	const [isFollowing, setIsFollowing] = useState(false);
	const watchIdRef = useRef<number | null>(null);
	const programmaticFlyToRef = useRef(false);

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
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (isFollowing) {
			watchIdRef.current = navigator.geolocation.watchPosition(
				(position) => {
					programmaticFlyToRef.current = true;
					const zoom = map.getZoom();
					const relZoom = zoom < 15 ? 15 : zoom;
					map.flyTo([position.coords.latitude, position.coords.longitude], relZoom, {
						animate: true,
						duration: 1.0,
					});

					setTimeout(() => {
						programmaticFlyToRef.current = false;
					}, 1000);
				},
				(error) => {
					console.error("Error getting position:", error);
				},
				{
					enableHighAccuracy: true,
					maximumAge: 0,
					timeout: 5000,
				}
			);
		} else {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
				watchIdRef.current = null;
			}
		}

		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
				watchIdRef.current = null;
			}
		};
	}, [map, isFollowing]);

	const toggleFollowing = () => {
		if (!isFollowing && !navigator.geolocation) {
			console.warn("Geolocation not supported.");
			return;
		}

		setIsFollowing((prev) => !prev);
	};

	const handleStartPlacingObject = () => {
		startPlacingObjects();
	};

	const handleStopPlacingObject = () => {
		if (currentObjectPoints.length > 0) {
			setShowTypeSelector(true);
		} else {
			stopPlacingObject();
		}
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
								<button onClick={startJourney} className="button is-success is-large">
									<span className="icon">
										<FontAwesomeIcon icon={["fas", "play"]} />
									</span>
									<span>{t("controls.buttons.start")}</span>
								</button>
							</div>
						</div>

						<div className="content">{children}</div>
					</div>
				</div>
			) : showTypeSelector ? (
				<div className="journey-controls-overlay">
					<ObjectTypeSelector onSelect={handleTypeSelect} onCancel={handleCancelTypeSelect} />
				</div>
			) : (
				<div className="journey-controls-overlay">
					<div className="box">
						<div className="content">
							<h4 className="title is-5 mb-3">
								<span className="icon-text">
									<span className="icon has-text-success">
										<FontAwesomeIcon icon={["fas", "route"]} />
									</span>
									<span>{t("controls.header")}</span>
								</span>
							</h4>

							<div className="tags has-addons mb-3">
								<span className="tag is-dark">{t("controls.objects_count")}</span>
								<span className="tag is-info">{currentJourney.objects.length}</span>
							</div>

							{currentObjectPoints.length > 0 && (
								<div className="tags has-addons mb-3">
									<span className="tag is-dark">{t("controls.point_count")}</span>
									<span className="tag is-warning">{currentObjectPoints.length}</span>
								</div>
							)}

							{syncObjectMutation.isPending && (
								<div className="notification is-info is-light is-small py-2">
									<span className="icon-text">
										<span className="icon">
											<FontAwesomeIcon icon={["fas", "sync"]} spin />
										</span>
										<span>{t("controls.syncing")}</span>
									</span>
								</div>
							)}
						</div>
						<div className="buttons">
							{!isPlacingObject ? (
								<button onClick={handleStartPlacingObject} className="button is-primary">
									<span className="icon">
										<FontAwesomeIcon icon={["fas", "map-marker-alt"]} />
									</span>
									<span>{t("controls.buttons.place")}</span>
								</button>
							) : (
								<>
									<button onClick={handleStopPlacingObject} className="button is-warning">
										<span className="icon">
											<FontAwesomeIcon icon={["fas", "stop"]} />
										</span>
										<span>{t("controls.buttons.stop", { count: currentObjectPoints.length })}</span>
									</button>

									<button onClick={clearCurrentObjectPoints} className="button is-light">
										<span className="icon">
											<FontAwesomeIcon icon={["fas", "trash-alt"]} />
										</span>
										<span>{t("controls.buttons.clear")}</span>
									</button>
								</>
							)}

							<button onClick={endJourney} className="button is-danger">
								<span className="icon">
									<FontAwesomeIcon icon={["fas", "stop-circle"]} />
								</span>
								<span>{t("controls.buttons.end")}</span>
							</button>
						</div>

						<hr className="divider my-3" />

						<div>
							<div className="content is-small">
								<button
									onClick={toggleFollowing}
									className={`button ${isFollowing ? "is-success" : "is-light"}`}
								>
									<span className="icon">
										<FontAwesomeIcon icon={["fas", "location-arrow"]} />
									</span>
									<span>{t("controls.buttons.my_location")}</span>
								</button>
							</div>
						</div>

						<div className="content">{children}</div>
					</div>
				</div>
			)}
		</div>
	);
};
