import { useTranslation } from "../../i18n";
import { formatTime } from "../../utils/formatters";

export interface JourneyMetadataProps {
	startTime: string | number | undefined;
	endTime: string | number | undefined;
	objectCount: number;
}

export const JourneyMetadata = ({ startTime, endTime, objectCount }: JourneyMetadataProps) => {
	const { t } = useTranslation();

	return (
		<div className="mb-4">
			<h2 className="title is-size-4">{t("journeySummary.title")}</h2>
			<p className="is-size-6">{t("journeySummary.meta.started", { time: formatTime(startTime) })}</p>
			{endTime && <p className="is-size-6">{t("journeySummary.meta.ended", { time: formatTime(endTime) })}</p>}
			<p className="is-size-6">{t("journeySummary.meta.objectsPlaced", { count: objectCount })}</p>
		</div>
	);
};
