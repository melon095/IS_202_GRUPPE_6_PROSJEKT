import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DomEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";

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
	} = useJourney();

	const syncObjectMutation = useSyncObjectMutation();
	const [showTypeSelector, setShowTypeSelector] = useState(false);
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!overlayRef.current) return;

		DomEvent.disableClickPropagation(overlayRef.current);
		DomEvent.disableScrollPropagation(overlayRef.current);
	}, [overlayRef]);

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

	const handleTypeSelect = (typeId?: string, customType?: string) => {
		const lastObject = stopPlacingObject(typeId, customType);
		setShowTypeSelector(false);

		if (!currentJourney || !navigator.onLine || !lastObject) return;

		syncObjectMutation.mutate(
			{
				object: lastObject,
				journeyId: currentJourney.id,
			},
			{
				onSuccess(data) {
					currentJourney.id = data.journeyId;
					lastObject.id = data.objectId;
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

						<div className="content">{children}</div>
					</div>
				</div>
			)}
		</div>
	);
};
