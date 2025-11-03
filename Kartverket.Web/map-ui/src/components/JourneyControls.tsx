import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DomEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useGeolocated } from "react-geolocated";
import { useMap } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { useSyncObjectMutation } from "../hooks/useSyncObjectMutation";
import { useTranslation } from "../i18n";
import { PlaceMode } from "../types";
import { ObjectTypeSelector } from "./ObjectTypeSelector";

interface JourneyControlsProps {
	children?: React.ReactNode;
}

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
		if (currentObjectPoints.length > 0) {
			setShowTypeSelector(true);
		} else {
			stopPlacingObject();
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
							<div>
								{placeMode === PlaceMode.None ? (
									<>
										<p className="control is-expanded mb-2">
											<button
												onClick={() => setPlaceMode(PlaceMode.Point)}
												className="button is-info is-fullwidth"
											>
												<span className="icon">
													<FontAwesomeIcon icon={["fas", "location-dot"]} />
												</span>
												<span>Place Point</span>
											</button>
										</p>
										<p className="control is-expanded mb-2">
											<button
												onClick={() => setPlaceMode(PlaceMode.Line)}
												className="button is-info is-fullwidth"
											>
												<span className="icon">
													<FontAwesomeIcon icon={["fas", "route"]} />
												</span>
												<span>Place Line</span>
											</button>
										</p>
										<p className="control is-expanded mb-2">
											<button
												onClick={() => setPlaceMode(PlaceMode.Area)}
												className="button is-info is-fullwidth"
											>
												<span className="icon">
													<FontAwesomeIcon icon={["fas", "draw-polygon"]} />
												</span>
												<span>Place Area</span>
											</button>
										</p>
									</>
								) : (
									<div className="buttons mb-3">
										<button onClick={handleFinishPlace} className="button is-success">
											<span className="icon">
												<FontAwesomeIcon icon={["fas", "check"]} />
											</span>
											<span>Finish</span>
										</button>
										<button onClick={handleCancelPlace} className="button is-light">
											<span className="icon">
												<FontAwesomeIcon icon={["fas", "trash-alt"]} />
											</span>
											<span>{t("controls.buttons.cancel")}</span>
										</button>
									</div>
								)}
							</div>
							<div>
								<button onClick={endJourney} className="button is-danger">
									<span className="icon">
										<FontAwesomeIcon icon={["fas", "stop-circle"]} />
									</span>
									<span>{t("controls.buttons.end")}</span>
								</button>
							</div>
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
