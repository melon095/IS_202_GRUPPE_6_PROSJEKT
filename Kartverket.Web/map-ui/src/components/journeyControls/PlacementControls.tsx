import { useTranslation } from "../../i18n";
import { PlaceMode, Point } from "../../types";
import { IconFlex } from "../IconFlex";

interface PlacementControlsProps {
	placeMode: PlaceMode;
	onSetPlaceMode: (mode: PlaceMode) => void;
	onFinishPlace: () => void;
	onCancelPlace: () => void;
	currentObjectPoints: Point[];
}

export const PlacementControls = ({
	placeMode,
	onSetPlaceMode,
	onFinishPlace,
	onCancelPlace,
	currentObjectPoints,
}: PlacementControlsProps) => {
	const { t } = useTranslation();

	return (
		<div className="buttons">
			{placeMode === PlaceMode.None ? (
				<div>
					<p className="control is-expanded mb-2">
						<IconFlex
							as="button"
							onClick={() => onSetPlaceMode(PlaceMode.Point)}
							icon={["fas", "crosshairs"]}
							fullWidth
							style={{ justifyContent: "space-between" }}
							className="is-info"
						>
							{t("controls.buttons.place_point")}
						</IconFlex>
					</p>
					<p className="control is-expanded mb-2">
						<IconFlex
							as="button"
							onClick={() => onSetPlaceMode(PlaceMode.Line)}
							icon={["fas", "route"]}
							fullWidth
							style={{ justifyContent: "space-between" }}
							className="is-info"
						>
							{t("controls.buttons.place_line")}
						</IconFlex>
					</p>
					<p className="control is-expanded mb-2">
						<IconFlex
							as="button"
							onClick={() => onSetPlaceMode(PlaceMode.Area)}
							icon={["fas", "draw-polygon"]}
							fullWidth
							style={{ justifyContent: "space-between" }}
							className="is-info"
						>
							{t("controls.buttons.place_area")}
						</IconFlex>
					</p>
				</div>
			) : (
				<div className="buttons mb-3">
					<IconFlex
						as="button"
						onClick={onFinishPlace}
						icon={["fas", "check"]}
						className="is-success"
						fullWidth
					>
						{t("controls.buttons.stop", { count: currentObjectPoints.length })}
					</IconFlex>

					<IconFlex
						as="button"
						onClick={onCancelPlace}
						icon={["fas", "trash-alt"]}
						className="is-light"
						fullWidth
					>
						{t("controls.buttons.cancel")}
					</IconFlex>
				</div>
			)}
		</div>
	);
};
