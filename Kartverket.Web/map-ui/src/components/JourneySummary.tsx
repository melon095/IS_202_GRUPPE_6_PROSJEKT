import { DomEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";

import "../css/JourneySummary.css";
import { useJourney } from "../hooks/useJourney.ts";
import { useObjectTypes } from "../hooks/useObjectTypes.ts";
import { useTranslation } from "../i18n";
import { Journey, PlacedObject, ResponseError } from "../types";
import { Icon } from "./Icon";
import { IconFlex } from "./IconFlex";
import { ObjectEditForm } from "./ObjectEditForm";

const DELETE_TIMEOUT = 2000;

interface JourneySummaryProps {
	journey: Journey;
	onClose: () => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	isError: boolean;
	errors: ResponseError | null;
}

export const JourneySummary = ({ journey, onClose, onSubmit, isSubmitting, isError, errors }: JourneySummaryProps) => {
	const { t } = useTranslation();
	const { updateObjectinFinishedJourney, updateFinishedJourneyMeta } = useJourney();
	const { getObjectTypeById } = useObjectTypes();
	const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [journeyTitle, setJourneyTitle] = useState(journey.title || "");
	const [journeyDescription, setJourneyDescription] = useState(journey.description || "");

	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!overlayRef.current) return;
		DomEvent.disableClickPropagation(overlayRef.current);
		DomEvent.disableScrollPropagation(overlayRef.current);
	}, []);

	useEffect(() => {
		if (deleteConfirmId) {
			const timer = setTimeout(() => {
				setDeleteConfirmId(null);
			}, DELETE_TIMEOUT);
			return () => clearTimeout(timer);
		}
	}, [deleteConfirmId]);

	useEffect(() => {
		updateFinishedJourneyMeta({ title: journeyTitle, description: journeyDescription });
	}, [journeyTitle, journeyDescription, updateFinishedJourneyMeta]);

	const handleEditObject = (objectId: string) => {
		setEditingObjectId(objectId);
	};

	const handleSaveObject = (objectId: string, updates: Partial<PlacedObject>) => {
		updateObjectinFinishedJourney(objectId, updates);
	};

	const handleFinalize = () => {
		if (navigator.onLine) {
			onSubmit();
		} else {
			onClose();
		}
	};

	const formatTime = (date: string | number | undefined) => {
		if (!date) return "-";

		if (typeof date === "number") {
			date = new Date(date).toISOString();
		}

		const d = new Date(date);
		return d.toLocaleString([], {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div ref={overlayRef} className="modal is-active" style={{ zIndex: 1000 }}>
			<div
				className="modal-background"
				style={{
					backgroundColor: "rgba(20, 20, 20, 0.75)",
				}}
			></div>
			<div
				className="modal-content box"
				style={{
					height: "100vh",
					width: "100vw",
					maxHeight: "100vh",
					maxWidth: "100vw",
					overflowY: "auto",
					marginTop: "env(safe-area-inset-top)",
					display: "flex",
					flexDirection: "column",
					padding: "1.5rem",
				}}
			>
				<div style={{ flexShrink: 0, marginBottom: "1rem" }}>
					{isError && errors && (
						<div className="notification is-danger">
							<h4 className="title is-size-5">{t("journeySummary.errors.title")}</h4>
							<ul>
								{Object.entries(errors).map(([key, value]) => (
									<li key={key}>
										{/* //TODO i18n and make it user friendly! */}
										<strong>{key}:</strong> {value}
									</li>
								))}
							</ul>
						</div>
					)}
					<div>
						<h2 className="title is-size-4-tablet">{t("journeySummary.title")}</h2>
						<p className="is-size-6-tablet">
							{t("journeySummary.meta.started", { time: formatTime(journey.startTime) })}
						</p>
						{journey.endTime && (
							<p className="is-size-6-tablet">
								{t("journeySummary.meta.ended", { time: formatTime(journey.endTime) })}
							</p>
						)}
						<p className="is-size-6-tablet">
							{t("journeySummary.meta.objectsPlaced", { count: journey.objects.length })}
						</p>
					</div>

					<div className="columns is-tablet mb-4">
						<div className="column is-half">
							<div className="field">
								<label className="label is-size-6-tablet">
									{t("journeySummary.form.journeyTitle.label")}
								</label>
								<div className="control">
									<input
										className="input is-medium"
										type="text"
										placeholder={t("journeySummary.form.journeyTitle.placeholder")}
										value={journeyTitle}
										onChange={(e) => setJourneyTitle(e.target.value)}
										autoComplete="off"
									/>
								</div>
							</div>
						</div>
						<div className="column is-half">
							<div className="field">
								<label className="label is-size-6-tablet">
									{t("journeySummary.form.journeyDescription.label")}
								</label>
								<div className="control">
									<textarea
										className="textarea is-medium"
										placeholder={t("journeySummary.form.journeyDescription.placeholder")}
										value={journeyDescription}
										onChange={(e) => setJourneyDescription(e.target.value)}
										autoComplete="off"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
					<h3 className="subtitle is-size-5-tablet">{t("journeySummary.objects.title")}</h3>
					{journey.objects.length === 0 ? (
						<p>{t("journeySummary.objects.emptyState")}</p>
					) : (
						<div className="table-container">
							<table className="table is-fullwidth is-striped is-hoverable is-narrow">
								<thead>
									<tr>
										<th className="is-size-6-tablet">
											{t("journeySummary.objects.table.headers.type")}
										</th>
										<th className="is-size-6-tablet">
											{t("journeySummary.objects.table.headers.title")}
										</th>
										<th className="is-size-6-tablet">
											{t("journeySummary.objects.table.headers.description")}
										</th>
										<th className="is-size-6-tablet">
											{t("journeySummary.objects.table.headers.points")}
										</th>
										<th className="is-size-6-tablet">
											{t("journeySummary.objects.table.headers.created")}
										</th>
										<th className="is-size-6-tablet">
											{t("journeySummary.objects.table.headers.deleted")}
										</th>
										<th className="is-size-6-tablet"></th>
									</tr>
								</thead>
								<tbody>
									{journey.objects.map((obj) => {
										const objectType = obj.typeId ? getObjectTypeById(obj.typeId) : null;
										const isEditing = editingObjectId === obj.id;

										if (isEditing) {
											return (
												<tr key={obj.id}>
													<td colSpan={7}>
														<ObjectEditForm
															key={obj.id}
															object={obj}
															onSave={(updates) => handleSaveObject(obj.id!, updates)}
															onCancel={() => setEditingObjectId(null)}
														/>
													</td>
												</tr>
											);
										}

										return (
											<tr key={obj.id}>
												<td>
													{objectType ? (
														<div className="is-flex is-align-items-center">
															<Icon
																src={objectType.imageUrl || ""}
																alt={objectType.name}
															/>
															<span className="is-size-6-tablet">{objectType.name}</span>
														</div>
													) : (
														<span className="is-size-6-tablet">{obj.typeId || "-"}</span>
													)}
												</td>
												<td className="is-size-6-tablet">
													<span>
														{obj.title || <span className="has-text-grey-light">…</span>}
													</span>
												</td>
												<td className="is-size-6-tablet">
													<span className="is-ellipsis">
														{obj.description || (
															<span className="has-text-grey-light">…</span>
														)}
													</span>
												</td>
												<td className="is-size-6-tablet">{obj.points.length}</td>
												<td className="is-size-6-tablet">{formatTime(obj.createdAt)}</td>
												<td className="is-size-6-tablet">{obj.deleted ? "Yes" : "No"}</td>
												<td>
													<IconFlex
														as="button"
														onClick={() => handleEditObject(obj.id!)}
														icon={["fas", "edit"]}
														className="is-link is-medium"
														style={{ marginBottom: "0.5em" }}
														fullWidth
													>
														{t("journeySummary.actions.edit")}
													</IconFlex>

													{obj.deleted ? (
														<IconFlex
															as="button"
															onClick={() =>
																updateObjectinFinishedJourney(obj.id!, {
																	deleted: false,
																})
															}
															icon={["fas", "undo"]}
															className="is-success is-medium"
															style={{ marginBottom: "0.5em" }}
															fullWidth
														>
															{t("journeySummary.actions.restore")}
														</IconFlex>
													) : (
														<IconFlex
															as="button"
															onClick={() => {
																if (deleteConfirmId === obj.id) {
																	updateObjectinFinishedJourney(obj.id!, {
																		deleted: true,
																	});
																} else {
																	setDeleteConfirmId(obj.id!);
																}
															}}
															icon={["fas", "trash"]}
															className={`is-medium ${
																deleteConfirmId === obj.id ? "is-danger" : "is-warning"
															}`}
															style={{ marginBottom: "0.5em" }}
															fullWidth
														>
															{deleteConfirmId === obj.id
																? t("journeySummary.actions.deleteConfirm")
																: t("journeySummary.actions.delete")}
														</IconFlex>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>

				<div style={{ flexShrink: 0 }}>
					{isSubmitting && <progress className="progress is-small is-primary" max="100" />}

					<div className="mt-4 is-flex is-flex-direction-column-tablet is-justify-content-space-between is-align-items-stretch">
						<IconFlex
							as="button"
							onClick={handleFinalize}
							disabled={
								isSubmitting || (journey.objects.length > 0 && !navigator.onLine) || !journeyTitle
							}
							className="is-primary is-large"
							fullWidth
							icon={
								isSubmitting
									? { icon: ["fas", "spinner"], spinPulse: true }
									: { icon: ["fas", "check"] }
							}
						>
							{isSubmitting ? t("journeySummary.actions.submitting") : t("journeySummary.actions.submit")}
						</IconFlex>

						<IconFlex
							as="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="is-light is-large"
							fullWidth
							icon={["fas", "times"]}
						>
							{t("journeySummary.actions.close")}
						</IconFlex>
					</div>
				</div>
			</div>
			<button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
		</div>
	);
};
