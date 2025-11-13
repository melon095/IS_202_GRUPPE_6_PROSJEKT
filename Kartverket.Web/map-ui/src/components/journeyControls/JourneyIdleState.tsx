import { useTranslation } from "../../i18n";
import { IconFlex } from "../IconFlex";

export interface JourneyIdleStateProps {
	onStart: () => void;
	children?: React.ReactNode;
}

export const JourneyIdleState = ({ onStart, children }: JourneyIdleStateProps) => {
	const { t } = useTranslation();

	return (
		<>
			<div className="field">
				<div className="control">
					<IconFlex
						as="button"
						onClick={onStart}
						icon={["fas", "play"]}
						className="is-success is-large"
						fullWidth
					>
						{t("controls.buttons.start")}
					</IconFlex>
				</div>
			</div>

			<div className="content">{children}</div>
		</>
	);
};
