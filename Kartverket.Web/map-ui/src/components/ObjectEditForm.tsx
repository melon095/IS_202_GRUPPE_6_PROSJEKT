import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { PlacedObject } from "../types";

interface ObjectEditFormProps {
	object: PlacedObject;
	onSave: (updates: Partial<PlacedObject>) => void;
	onCancel: () => void;
}

export const ObjectEditForm = ({ object, onSave, onCancel }: ObjectEditFormProps) => {
	const { t } = useTranslation();
	const [title, setTitle] = useState(object.title);
	const [description, setDescription] = useState(object.description || "");

	useEffect(() => {
		if (title !== object.title || description !== object.description) {
			onSave({ title, description });
		}
	}, [title, description, onSave, object.title, object.description]);

	return (
		<form className="box is-tablet">
			<div className="field">
				<label className="label is-size-7-tablet">{t("objectEditForm.form.title.label")}</label>
				<div className="control">
					<input
						className="input is-fullwidth"
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={t("objectEditForm.form.title.placeholder")}
						maxLength={100}
						autoComplete="off"
					/>
				</div>
			</div>

			<div className="field">
				<label className="label is-size-7-tablet">{t("objectEditForm.form.description.label")}</label>
				<div className="control">
					<textarea
						className="input is-fullwidth"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t("objectEditForm.form.description.placeholder")}
						maxLength={100}
						autoComplete="off"
					/>
				</div>
			</div>

			<div className="field is-grouped is-grouped-multiline">
				<div className="control is-expanded">
					<button type="button" className="button is-link is-fullwidth" onClick={onCancel}>
						{t("objectEditForm.actions.close")}
					</button>
				</div>
			</div>
		</form>
	);
};
