import { useTranslation } from "../../i18n";
import { PlacedObject } from "../../types";
import { formatTime } from "../../utils/formatters";
import { Icon } from "../Icon";
import { IconFlex } from "../IconFlex";

export interface ObjectTableRowProps {
	object: PlacedObject;
	objectTypeName?: string;
	objectTypeImageUrl?: string;
	deleteConfirmId: string | null;
	onEdit: () => void;
	onDelete: () => void;
	onRestore: () => void;
}

export const ObjectTableRow = ({
	object,
	objectTypeName,
	objectTypeImageUrl,
	deleteConfirmId,
	onEdit,
	onDelete,
	onRestore,
}: ObjectTableRowProps) => {
	const { t } = useTranslation();

	const isDeleteConfirm = deleteConfirmId === object.id;

	return (
		<tr>
			<td>
				{objectTypeName ? (
					<div className="is-flex is-align-items-center is-flex-wrap-nowrap">
						<Icon src={objectTypeImageUrl || ""} alt={objectTypeName} />
						<span className="is-size-6 ml-2">{objectTypeName}</span>
					</div>
				) : (
					<span className="is-size-6">{object.typeId || "-"}</span>
				)}
			</td>
			<td className="is-size-6">{object.title || <span className="has-text-grey-light">…</span>}</td>
			<td className="is-size-6">
				<div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
					{object.description || <span className="has-text-grey-light">…</span>}
				</div>
			</td>
			<td className="is-size-6">{object.points.length}</td>
			<td className="is-size-6">{formatTime(object.createdAt)}</td>
			<td className="is-size-6">
				{object.deleted
					? t("journeySummary.objects.table.deleted.yes")
					: t("journeySummary.objects.table.deleted.no")}
			</td>
			<td>
				<div className="buttons">
					<IconFlex as="button" onClick={onEdit} icon={["fas", "edit"]} className="is-link">
						{t("journeySummary.actions.edit")}
					</IconFlex>

					{object.deleted ? (
						<IconFlex as="button" onClick={onRestore} icon={["fas", "undo"]} className="is-success">
							{t("journeySummary.actions.restore")}
						</IconFlex>
					) : (
						<IconFlex
							as="button"
							onClick={onDelete}
							icon={["fas", "trash"]}
							className={isDeleteConfirm ? "is-danger" : "is-warning"}
						>
							{isDeleteConfirm
								? t("journeySummary.actions.deleteConfirm")
								: t("journeySummary.actions.delete")}
						</IconFlex>
					)}
				</div>
			</td>
		</tr>
	);
};
