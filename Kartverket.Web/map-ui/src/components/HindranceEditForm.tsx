import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { PlacedHindrance } from "../types";

interface HindranceEditFormProps {
	hindrance: PlacedHindrance;
	onSave: (updates: Partial<PlacedHindrance>) => void;
	onCancel: () => void;
}

export const HindranceEditForm = ({ hindrance, onSave, onCancel }: HindranceEditFormProps) => {
	const { t } = useTranslation();
	const [title, setTitle] = useState(hindrance.title);
	const [description, setDescription] = useState(hindrance.description || "");

	useEffect(() => {
		if (title !== hindrance.title || description !== hindrance.description) {
			onSave({ title, description });
		}
	}, [title, description, onSave, hindrance.title, hindrance.description]);

	return (
		<form className="box is-tablet">
			<div className="field">
				<label className="label is-size-7-tablet">{t("hindranceEditForm.form.title.label")}</label>
				<div className="control">
					<input
						className="input is-fullwidth"
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={t("hindranceEditForm.form.title.placeholder")}
						maxLength={100}
						autoComplete="off"
					/>
				</div>
			</div>

			<div className="field">
				<label className="label is-size-7-tablet">{t("hindranceEditForm.form.description.label")}</label>
				<div className="control">
					<textarea
						className="input is-fullwidth"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t("hindranceEditForm.form.description.placeholder")}
						maxLength={100}
						autoComplete="off"
					/>
				</div>
			</div>

			<div className="field is-grouped is-grouped-multiline">
				<div className="control is-expanded">
					<button type="button" className="button is-link is-fullwidth" onClick={onCancel}>
						{t("hindranceEditForm.actions.close")}
					</button>
				</div>
			</div>
		</form>
	);
};
