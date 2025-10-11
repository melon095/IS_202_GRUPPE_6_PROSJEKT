import { DomEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";

import { useJourney } from "../contexts/JourneyContext";
import { useObjectTypes } from "../contexts/ObjectTypesContext";
import "../css/JourneySummary.css";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { Journey, PlacedObject } from "../types";
import { Icon } from "./Icon";
import { ObjectEditForm } from "./ObjectEditForm";

const DELETE_TIMEOUT = 2000;
const DEBOUNCE_TIMEOUT = 500;

interface JourneySummaryProps {
	journey: Journey;
	onClose: () => void;
	onSubmit: () => void;
	isSubmitting: boolean;
}

export const JourneySummary = ({ journey, onClose, onSubmit, isSubmitting }: JourneySummaryProps) => {
	const { updateObjectInCurrentJourney, updateJourneyMeta } = useJourney();
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

	const debouncedSave = useDebouncedCallback(updateJourneyMeta, DEBOUNCE_TIMEOUT);

	useEffect(() => {
		debouncedSave({ title: journeyTitle, description: journeyDescription });
	}, [journeyTitle, journeyDescription, debouncedSave]);

	const handleEditObject = (objectId: string) => {
		setEditingObjectId(objectId);
	};

	const handleSaveObject = (objectId: string, updates: Partial<PlacedObject>) => {
		updateObjectInCurrentJourney(objectId, updates);
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
					backgroundColor: "rgba(0, 0, 0, 0.5)",
				}}
			></div>
			<div
				className="modal-content"
				style={{
					maxHeight: "90vh",
					overflowY: "auto",
					width: "100vw",
					marginTop: "env(safe-area-inset-top)",
				}}
			>
				{/* Main container */}
				<div className="box is-tablet">
					<div>
						<h2 className="title is-size-4-tablet">Journey Summary</h2>
						<p className="is-size-6-tablet">Started: {formatTime(journey.startTime)}</p>
						{journey.endTime && <p className="is-size-6-tablet">Ended: {formatTime(journey.endTime)}</p>}
						<p className="is-size-6-tablet">Objects Placed: {journey.objects.length}</p>
					</div>

					<div className="columns is-tablet mb-4">
						<div className="column is-half">
							<div className="field">
								<label className="label is-size-6-tablet">Journey Title</label>
								<div className="control">
									<input
										className="input is-medium"
										type="text"
										placeholder="Enter journey title..."
										value={journeyTitle}
										onChange={(e) => setJourneyTitle(e.target.value)}
										autoComplete="off"
									/>
								</div>
							</div>
						</div>
						<div className="column is-half">
							<div className="field">
								<label className="label is-size-6-tablet">Journey Description</label>
								<div className="control">
									<textarea
										className="textarea is-medium"
										placeholder="Enter journey description..."
										value={journeyDescription}
										onChange={(e) => setJourneyDescription(e.target.value)}
										rows={2}
									/>
								</div>
							</div>
						</div>
					</div>

					<div>
						<h3 className="subtitle is-size-5-tablet">Placed Objects</h3>
						{journey.objects.length === 0 ? (
							<p>No objects were placed during this journey.</p>
						) : (
							<div className="table-container">
								<table className="table is-fullwidth is-striped is-hoverable is-narrow">
									<thead>
										<tr>
											<th className="is-size-6-tablet">Type</th>
											<th className="is-size-6-tablet">Title</th>
											<th className="is-size-6-tablet">Description</th>
											<th className="is-size-6-tablet">Pts</th>
											<th className="is-size-6-tablet">Created</th>
											<th className="is-size-6-tablet">Deleted</th>
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
																	src={objectType.primaryImageUrl}
																	alt={objectType.name}
																/>
																<span className="is-size-6-tablet">
																	{objectType.name}
																</span>
															</div>
														) : (
															<span className="is-size-6-tablet">
																{obj.typeId || obj.customType || "-"}
															</span>
														)}
													</td>
													<td className="is-size-6-tablet">
														<span>
															{obj.title || (
																<span className="has-text-grey-light">…</span>
															)}
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
														<button
															className="button is-link is-medium"
															onClick={() => handleEditObject(obj.id!)}
															style={{ marginBottom: "0.5em" }}
														>
															<span className="icon is-medium">
																<i className="fas fa-edit"></i>
															</span>
															<span>Edit</span>
														</button>

														{obj.deleted ? (
															<button
																className="button is-success is-medium ml-2"
																onClick={() =>
																	updateObjectInCurrentJourney(obj.id!, {
																		deleted: false,
																	})
																}
																style={{ marginBottom: "0.5em" }}
															>
																<span className="icon is-medium">
																	<i className="fas fa-undo"></i>
																</span>
																<span>Restore</span>
															</button>
														) : (
															<button
																className={`button is-danger is-medium ml-2 ${
																	deleteConfirmId === obj.id ? "is-outlined" : ""
																}`}
																onClick={() => {
																	if (deleteConfirmId === obj.id) {
																		updateObjectInCurrentJourney(obj.id!, {
																			deleted: true,
																		});
																	} else {
																		setDeleteConfirmId(obj.id!);
																	}
																}}
																style={{ marginBottom: "0.5em" }}
															>
																<span className="icon is-medium">
																	<i className="fas fa-trash"></i>
																</span>
																<span>
																	{deleteConfirmId === obj.id ? "Confirm?" : "Delete"}
																</span>
															</button>
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

					{isSubmitting && <progress className="progress is-small is-primary" max="100" />}

					<div className="mt-4 is-flex is-flex-direction-column-tablet is-justify-content-space-between is-align-items-stretch">
						<button
							onClick={handleFinalize}
							disabled={isSubmitting || (journey.objects.length > 0 && !navigator.onLine)}
							className="button is-primary is-large is-fullwidth"
						>
							{isSubmitting ? (
								<>
									<span className="icon is-large">
										<i className="fas fa-spinner fa-spin-pulse"></i>
									</span>
									<span>Submitting</span>
								</>
							) : (
								<>
									<span className="icon is-large">
										<i className="fas fa-check"></i>
									</span>
									<span>Submit & Close</span>
								</>
							)}
						</button>

						<button
							onClick={onClose}
							disabled={isSubmitting}
							className="button is-light is-large is-fullwidth"
						>
							<span className="icon is-large">
								<i className="fas fa-times"></i>
							</span>
							<span>Close</span>
						</button>
					</div>
				</div>
			</div>
			<button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
		</div>
	);
};
