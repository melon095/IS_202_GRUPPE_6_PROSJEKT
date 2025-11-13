import { useTranslation } from "../../i18n";
import { ResponseError } from "../../types";

export interface ErrorNotificationProps {
	errors: ResponseError;
}

export const ErrorNotification = ({ errors }: ErrorNotificationProps) => {
	const { t } = useTranslation();

	return (
		<div className="notification is-danger mb-4">
			<h4 className="title is-size-5">{t("journeySummary.errors.title")}</h4>
			<ul>
				{Object.entries(errors).map(([key, value]) => (
					<li key={key}>
						<strong>{key}:</strong> {value}
					</li>
				))}
			</ul>
		</div>
	);
};
