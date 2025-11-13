import { DomEvent } from "leaflet";
import { useEffect, useRef } from "react";

import { useJourney } from "../../hooks/useJourney";
import { useJourneySummary } from "../../hooks/useJourneySummary";
import { useObjectTypes } from "../../hooks/useObjectTypes";
import { useTranslation } from "../../i18n";
import { Journey, ResponseError } from "../../types";
import { ActionButtons } from "./ActionButtons";
import { ErrorNotification } from "./ErrorNotification";
import { JourneyForm } from "./JourneyForm";
import { JourneyMetadata } from "./JourneyMetadata";
import { ObjectsTable } from "./ObjectsTable";

export interface JourneySummaryProps {
	journey: Journey;
	onClose: () => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	isError: boolean;
	errors: ResponseError | null;
}
export const JourneySummary = ({ journey, onClose, onSubmit, isSubmitting, isError, errors }: JourneySummaryProps) => {
	const { t } = useTranslation();
	const { updateObjectInFinishedJourney, updateFinishedJourneyMeta } = useJourney();
	const { getObjectTypeById } = useObjectTypes();
	const overlayRef = useRef<HTMLDivElement>(null);

	const {
		editingObjectId,
		setEditingObjectId,
		deleteConfirmId,
		journeyTitle,
		setJourneyTitle,
		journeyDescription,
		setJourneyDescription,
		handleEditObject,
		handleSaveObject,
		handleDeleteClick,
		handleRestore,
	} = useJourneySummary(journey, updateObjectInFinishedJourney, updateFinishedJourneyMeta);

	useEffect(() => {
		if (!overlayRef.current) return;
		DomEvent.disableClickPropagation(overlayRef.current);
		DomEvent.disableScrollPropagation(overlayRef.current);
	}, []);

	const handleFinalize = () => {
		if (navigator.onLine) {
			onSubmit();
		} else {
			onClose();
		}
	};

	const canSubmit = journeyTitle.trim() !== "" && (journey.objects.length === 0 || navigator.onLine);

	return (
		<div ref={overlayRef} className="modal is-active" style={{ zIndex: 1000 }}>
			<div className="modal-background" style={{ backgroundColor: "rgba(20, 20, 20, 0.75)" }} />

			<div
				className="modal-content box"
				style={{
					margin: "0",
					width: "100vw",
					height: "100vh",
					maxWidth: "100vw",
					maxHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					borderRadius: "0",
				}}
			>
				<div
					style={{
						paddingTop: "max(1rem, env(safe-area-inset-top))",
						paddingLeft: "max(1rem, env(safe-area-inset-left))",
						paddingRight: "max(1rem, env(safe-area-inset-right))",
					}}
				>
					{isError && errors && <ErrorNotification errors={errors} />}

					<JourneyMetadata
						startTime={journey.startTime}
						endTime={journey.endTime}
						objectCount={journey.objects.length}
					/>

					<JourneyForm
						title={journeyTitle}
						description={journeyDescription}
						onTitleChange={setJourneyTitle}
						onDescriptionChange={setJourneyDescription}
					/>
				</div>

				<div
					style={{
						flex: "1 1 auto",
					}}
				>
					<h3 className="subtitle is-size-5 mb-3">{t("journeySummary.objects.title")}</h3>
					<ObjectsTable
						objects={journey.objects}
						editingObjectId={editingObjectId}
						deleteConfirmId={deleteConfirmId}
						getObjectTypeById={getObjectTypeById}
						onEdit={handleEditObject}
						onSave={handleSaveObject}
						onCancelEdit={() => setEditingObjectId(null)}
						onDelete={handleDeleteClick}
						onRestore={handleRestore}
					/>
				</div>

				<div
					style={{
						flex: "0 0 auto",
						paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
						paddingLeft: "max(1rem, env(safe-area-inset-left))",
						paddingRight: "max(1rem, env(safe-area-inset-right))",
					}}
				>
					{isSubmitting && <progress className="progress is-small is-primary mb-3" max="100" />}
					<ActionButtons
						isSubmitting={isSubmitting}
						canSubmit={canSubmit}
						onSubmit={handleFinalize}
						onClose={onClose}
					/>
				</div>
			</div>

			<button className="modal-close is-large" aria-label="close" onClick={onClose} />
		</div>
	);
};
