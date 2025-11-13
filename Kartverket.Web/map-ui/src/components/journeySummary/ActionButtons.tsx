import { useTranslation } from "../../i18n";
import { IconFlex } from "../IconFlex";

export interface ActionButtonsProps {
	isSubmitting: boolean;
	canSubmit: boolean;
	onSubmit: () => void;
	onClose: () => void;
}

export const ActionButtons = ({ isSubmitting, canSubmit, onSubmit, onClose }: ActionButtonsProps) => {
	const { t } = useTranslation();

	return (
		<div className="buttons">
			<IconFlex
				as="button"
				onClick={onSubmit}
				disabled={!canSubmit || isSubmitting}
				className="is-primary is-large"
				fullWidth
				icon={isSubmitting ? { icon: ["fas", "spinner"], spinPulse: true } : { icon: ["fas", "check"] }}
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
	);
};
