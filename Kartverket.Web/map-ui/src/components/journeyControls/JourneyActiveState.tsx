import { SyncObjectMutation } from "../../hooks/useSyncObjectMutation";
import { useTranslation } from "../../i18n";
import { Journey, PlaceMode, Point } from "../../types";
import { Divider } from "../Divider";
import { IconFlex } from "../IconFlex";
import { PlacementControls } from "./PlacementControls";
import { PlacementModeIndicator } from "./PlacementModeIndicator";

export interface JourneyActiveStateProps {
	currentJourney: Journey;
	placeMode: PlaceMode;
	currentObjectPoints: Point[];
	notEnoughPointsMessage: string | null;
	isFollowing: boolean;

	syncObjectMutation: SyncObjectMutation;
	onSetPlaceMode: (mode: PlaceMode) => void;
	onFinishPlace: () => void;
	onCancelPlace: () => void;
	onEndJourney: () => void;
	onToggleFollowing: () => void;
	onDeleteStore: () => void;

	children?: React.ReactNode;
}

export const JourneyActiveState = ({
	currentJourney,
	placeMode,
	currentObjectPoints,
	notEnoughPointsMessage,
	isFollowing,
	syncObjectMutation,
	onSetPlaceMode,
	onFinishPlace,
	onCancelPlace,
	onEndJourney,
	onToggleFollowing,
	onDeleteStore,
	children,
}: JourneyActiveStateProps) => {
	const { t } = useTranslation();

	return (
		<>
			<div className="content">
				<IconFlex as="h4" icon={["fas", "route"]} className="title is-5 mb-3">
					{t("controls.header")}
				</IconFlex>

				<div className="tags has-addons mb-3">
					<span className="tag is-dark">{t("controls.objects_count")}</span>
					<span className="tag is-info">{currentJourney.objects.length}</span>
				</div>

				{placeMode !== PlaceMode.None && (
					<div className="tags has-addons mb-3">
						<span className="tag is-dark">{t("controls.point_count")}</span>
						<span className="tag is-warning">{currentObjectPoints.length}</span>
					</div>
				)}

				{syncObjectMutation.isPending && (
					<IconFlex as="div" icon={["fas", "sync"]} className="mb-3" fullWidth>
						{t("controls.syncing")}
					</IconFlex>
				)}
			</div>

			<Divider />

			{notEnoughPointsMessage && (
				<div className="content mb-3">
					<div className="notification is-warning is-light">{notEnoughPointsMessage}</div>
				</div>
			)}

			<PlacementModeIndicator placeMode={placeMode} />

			<PlacementControls
				placeMode={placeMode}
				currentObjectPoints={currentObjectPoints}
				onSetPlaceMode={onSetPlaceMode}
				onFinishPlace={onFinishPlace}
				onCancelPlace={onCancelPlace}
			/>

			<Divider />

			<div className="buttons">
				<IconFlex
					as="button"
					onClick={onEndJourney}
					icon={["fas", "stop-circle"]}
					className="is-danger"
					fullWidth
				>
					{t("controls.buttons.end")}
				</IconFlex>
			</div>

			<Divider />

			<div>
				<div className="content is-small">
					<IconFlex
						as="button"
						onClick={onToggleFollowing}
						icon={["fas", "location-arrow"]}
						className={isFollowing ? "is-success" : "is-light"}
						fullWidth
					>
						{t("controls.buttons.my_location")}
					</IconFlex>
				</div>
			</div>

			<Divider />

			<div className="content is-small mt-4">
				<IconFlex
					as="button"
					onClick={onDeleteStore}
					icon={["fas", "trash"]}
					fullWidth
					className="is-fullwidth is-light"
				>
					{t("controls.restartJourney")}
				</IconFlex>
			</div>

			<Divider />

			<div className="content">{children}</div>
		</>
	);
};
