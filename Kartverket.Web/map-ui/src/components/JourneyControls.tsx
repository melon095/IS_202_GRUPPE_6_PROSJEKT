import { useEffect, useRef, useState } from "react";
import { useJourney } from "../contextx/JourneyContext";
import { useServerSync } from "../hooks/useServerSync";
import { DomEvent } from "leaflet";
import { ObjectTypeSelector } from "./ObjectTypeSelector";

interface JourneyControlsProps {
	children?: React.ReactNode;
}

export const JourneyControls = ({ children }: JourneyControlsProps) => {
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

	const { syncObject, isSyncing } = useServerSync();
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
		stopPlacingObject(typeId, customType);
		setShowTypeSelector(false);

		if (!currentJourney || navigator.onLine) return;

		const lastObject = currentJourney?.objects.slice(-1)[0];
		if (!lastObject) return;

		syncObject({
			object: lastObject,
			journeyId: currentJourney.id,
		});
	};

	const handleCancelTypeSelect = () => {
		setShowTypeSelector(false);
		clearCurrentObjectPoints();
	};

	if (!currentJourney) {
		return (
			<div className="journey-controls-overlay">
				<div className="box">
					<div className="field">
						<div className="control">
							<button
								onClick={startJourney}
								className="button is-success is-large"
							>
								<span className="icon">
									<i className="fas fa-play"></i>
								</span>
								<span>Start Journey</span>
							</button>
						</div>
					</div>

					<div className="content">{children}</div>
				</div>
			</div>
		);
	}

	if (showTypeSelector) {
		return (
			<div className="journey-controls-overlay">
				<ObjectTypeSelector
					onSelect={handleTypeSelect}
					onCancel={handleCancelTypeSelect}
				/>
			</div>
		);
	}

	return (
		<div ref={overlayRef} className="journey-controls-overlay">
			<div className="box">
				<div className="content">
					<h4 className="title is-5 mb-3">
						<span className="icon-text">
							<span className="icon has-text-success">
								<i className="fas fa-route"></i>
							</span>
							<span>Journey Active!</span>
						</span>
					</h4>

					<div className="tags has-addons mb-3">
						<span className="tag is-dark">Objects Placed</span>
						<span className="tag is-info">
							{currentJourney.objects.length}
						</span>
					</div>

					{currentObjectPoints.length > 0 && (
						<div className="tags has-addons mb-3">
							<span className="tag is-dark">
								Current object points
							</span>
							<span className="tag is-warning">
								{currentObjectPoints.length}
							</span>
						</div>
					)}

					{isSyncing && (
						<div className="notification is-info is-light is-small py-2">
							<span className="icon-text">
								<span className="icon">
									<i className="fas fa-sync fa-spin"></i>
								</span>
								<span>Syncing to server...</span>
							</span>
						</div>
					)}
				</div>
				<div className="buttons">
					{!isPlacingObject ? (
						<button
							onClick={handleStartPlacingObject}
							className="button is-primary"
						>
							<span className="icon">
								<i className="fas fa-map-marker-alt"></i>
							</span>
							<span>Place Object</span>
						</button>
					) : (
						<button
							onClick={handleStopPlacingObject}
							className="button is-warning"
						>
							<span className="icon">
								<i className="fas fa-stop"></i>
							</span>
							<span>
								Stop Placing ({currentObjectPoints.length})
							</span>
						</button>
					)}

					<button onClick={endJourney} className="button is-danger">
						<span className="icon">
							<i className="fas fa-stop-circle"></i>
						</span>
						<span>End Journey</span>
					</button>
				</div>

				<div className="content">{children}</div>
			</div>
		</div>
	);
};
