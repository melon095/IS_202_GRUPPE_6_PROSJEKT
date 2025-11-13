import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { useTranslation } from "../../i18n";
import { PlaceMode } from "../../types";
import { IconFlex } from "../IconFlex";

export interface PlacementModeIndicatorProps {
	placeMode: PlaceMode;
}

interface ModeInfo {
	icon: IconProp;
	messageKey: string;
}

type PlaceModeWithoutNone = Exclude<PlaceMode, PlaceMode.None>;

const modes: Record<PlaceModeWithoutNone, ModeInfo> = {
	[PlaceMode.Point]: {
		icon: ["fas", "crosshairs"],
		messageKey: "controls.placing_point",
	},
	[PlaceMode.Line]: {
		icon: ["fas", "route"],
		messageKey: "controls.placing_line",
	},
	[PlaceMode.Area]: {
		icon: ["fas", "draw-polygon"],
		messageKey: "controls.placing_area",
	},
};

export const PlacementModeIndicator = ({ placeMode }: PlacementModeIndicatorProps) => {
	const { t } = useTranslation();

	if (placeMode === PlaceMode.None) {
		return null;
	}

	const mode = modes[placeMode];
	if (!mode) {
		return null;
	}

	return (
		<div className="content mb-3">
			<IconFlex as="div" icon={{ icon: mode.icon }} className="message is-info" fullWidth>
				{t(mode.messageKey)}
			</IconFlex>
		</div>
	);
};
