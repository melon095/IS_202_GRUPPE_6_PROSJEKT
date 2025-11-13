import { useTranslation } from "../../i18n";
import { ObjectType, PlacedObject } from "../../types";
import { ObjectEditForm } from "../ObjectEditForm";
import { ObjectTableRow } from "./ObjectTableRow";

export interface ObjectsTableProps {
	objects: PlacedObject[];
	editingObjectId: string | null;
	deleteConfirmId: string | null;
	getObjectTypeById: (id: string) => ObjectType | undefined;
	onEdit: (id: string) => void;
	onSave: (id: string, updates: Partial<PlacedObject>) => void;
	onCancelEdit: () => void;
	onDelete: (id: string) => void;
	onRestore: (id: string) => void;
}

export const ObjectsTable = ({
	objects,
	editingObjectId,
	deleteConfirmId,
	getObjectTypeById,
	onEdit,
	onSave,
	onCancelEdit,
	onDelete,
	onRestore,
}: ObjectsTableProps) => {
	const { t } = useTranslation();

	if (objects.length === 0) {
		return <p>{t("journeySummary.objects.emptyState")}</p>;
	}

	return (
		<div style={{ overflowX: "auto", width: "100%" }}>
			<table className="table is-fullwidth is-striped is-hoverable">
				<thead>
					<tr>
						<th className="is-size-7" style={{ whiteSpace: "nowrap" }}>
							{t("journeySummary.objects.table.headers.type")}
						</th>
						<th className="is-size-7" style={{ whiteSpace: "nowrap" }}>
							{t("journeySummary.objects.table.headers.title")}
						</th>
						<th className="is-size-7" style={{ whiteSpace: "nowrap" }}>
							{t("journeySummary.objects.table.headers.description")}
						</th>
						<th className="is-size-7" style={{ whiteSpace: "nowrap" }}>
							{t("journeySummary.objects.table.headers.points")}
						</th>
						<th className="is-size-7" style={{ whiteSpace: "nowrap" }}>
							{t("journeySummary.objects.table.headers.created")}
						</th>
						<th className="is-size-7" style={{ whiteSpace: "nowrap" }}>
							{t("journeySummary.objects.table.headers.deleted")}
						</th>
						<th className="is-size-7"></th>
					</tr>
				</thead>
				<tbody>
					{objects.map((obj) => {
						const objectType = obj.typeId ? getObjectTypeById(obj.typeId) : null;
						const isEditing = editingObjectId === obj.id;

						if (isEditing) {
							return (
								<tr key={obj.id}>
									<td colSpan={7}>
										<ObjectEditForm
											object={obj}
											onSave={(updates) => onSave(obj.id!, updates)}
											onCancel={onCancelEdit}
										/>
									</td>
								</tr>
							);
						}

						return (
							<ObjectTableRow
								key={obj.id}
								object={obj}
								objectTypeName={objectType?.name}
								objectTypeImageUrl={objectType?.imageUrl}
								deleteConfirmId={deleteConfirmId}
								onEdit={() => onEdit(obj.id!)}
								onDelete={() => onDelete(obj.id!)}
								onRestore={() => onRestore(obj.id!)}
							/>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
