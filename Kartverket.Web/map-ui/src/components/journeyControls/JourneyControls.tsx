import { DomEvent } from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import { useJourney } from "../../hooks/useJourney";
import { useMapFollowing } from "../../hooks/useMapFollowing";
import { useObjectPlacement } from "../../hooks/useObjectPlacement";
import { useSyncObjectMutation } from "../../hooks/useSyncObjectMutation";
import { ObjectTypeSelector } from "./../ObjectTypeSelector";
import { JourneyActiveState } from "./JourneyActiveState";
import { JourneyIdleState } from "./JourneyIdleState";

interface JourneyControlsProps {
	children?: React.ReactNode;
}

const Box = ({ children }: { children: React.ReactNode }) => (
	<div className="box" style={{ maxHeight: "calc(100vh)", overflowY: "auto" }}>
		{children}
	</div>
);

export const JourneyControls = ({ children }: JourneyControlsProps) => {
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
		deleteStore,
	} = useJourney();
	const map = useMap();
	const syncObjectMutation = useSyncObjectMutation();
	const overlayRef = useRef<HTMLDivElement>(null);
	const { isFollowing, toggleFollowing } = useMapFollowing(map);
	const {
		showTypeSelector,
		setShowTypeSelector,
		notEnoughPointsMessage,
		handleFinishPlace,
		handleCancelPlace,
		handleCancelTypeSelect,
	} = useObjectPlacement(placeMode, currentObjectPoints, stopPlacingObject, clearCurrentObjectPoints);

	useEffect(() => {
		if (!overlayRef.current) return;

		DomEvent.disableClickPropagation(overlayRef.current);
		DomEvent.disableScrollPropagation(overlayRef.current);
	}, [overlayRef]);

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

	return (
		<div ref={overlayRef} style={{ zIndex: 1000 }}>
			<div className="journey-controls-overlay">
				<Box>
					{currentJourney === null ? (
						<JourneyIdleState onStart={startJourney}>{children}</JourneyIdleState>
					) : showTypeSelector ? (
						<ObjectTypeSelector
							onSelect={handleTypeSelect}
							onCancel={handleCancelTypeSelect}
							placeMode={placeMode}
						/>
					) : (
						<JourneyActiveState
							currentJourney={currentJourney}
							placeMode={placeMode}
							currentObjectPoints={currentObjectPoints}
							notEnoughPointsMessage={notEnoughPointsMessage}
							isFollowing={isFollowing}
							syncObjectMutation={syncObjectMutation}
							onSetPlaceMode={setPlaceMode}
							onFinishPlace={handleFinishPlace}
							onCancelPlace={handleCancelPlace}
							onEndJourney={endJourney}
							onToggleFollowing={toggleFollowing}
							onDeleteStore={deleteStore}
						>
							{children}
						</JourneyActiveState>
					)}
				</Box>
			</div>
		</div>
	);
};
