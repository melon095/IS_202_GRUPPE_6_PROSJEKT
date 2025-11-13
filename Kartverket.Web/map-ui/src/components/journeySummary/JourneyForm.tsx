import { useTranslation } from "../../i18n";

export interface JourneyFormProps {
	title: string;
	description: string;
	onTitleChange: (title: string) => void;
	onDescriptionChange: (description: string) => void;
}

export const JourneyForm = ({ title, description, onTitleChange, onDescriptionChange }: JourneyFormProps) => {
	const { t } = useTranslation();

	return (
		<div className="columns mb-4">
			<div className="column is-half">
				<div className="field">
					<label className="label is-size-6">{t("journeySummary.form.journeyTitle.label")}</label>
					<div className="control">
						<input
							className="input"
							type="text"
							placeholder={t("journeySummary.form.journeyTitle.placeholder")}
							value={title}
							onChange={(e) => onTitleChange(e.target.value)}
							autoComplete="off"
						/>
					</div>
				</div>
			</div>
			<div className="column is-half">
				<div className="field">
					<label className="label is-size-6">{t("journeySummary.form.journeyDescription.label")}</label>
					<div className="control">
						<textarea
							className="textarea"
							placeholder={t("journeySummary.form.journeyDescription.placeholder")}
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
							autoComplete="off"
							rows={3}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
