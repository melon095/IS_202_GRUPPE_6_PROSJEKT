import { useState } from "react";

import { useObjectTypes } from "../hooks/useObjectTypes";
import { useTranslation } from "../i18n";
import { PlaceMode } from "../types";
import { Icon } from "./Icon";
import { IconFlex } from "./IconFlex";

interface ObjectTypeSelectorProps {
	onSelect: (typeId?: string) => void;
	onCancel: () => void;
	placeMode: PlaceMode;
}

export const ObjectTypeSelector = ({ onSelect, onCancel, placeMode }: ObjectTypeSelectorProps) => {
	const { t } = useTranslation();
	const { objectTypes, isObjectTypeStandard, isLoading, error } = useObjectTypes();
	const [selectedTypeId, setSelectedTypeId] = useState("");

	const objectTypesFiltered = objectTypes.filter(
		(type) => type.geometryType === placeMode && !isObjectTypeStandard(type.id)
	);

	const handleConfirm = () => {
		onSelect(selectedTypeId);
	};

	if (isLoading) {
		return (
			<div className="box">
				<IconFlex as="div" icon={{ icon: ["fas", "spinner"], spin: true }} className="has-text-centered">
					<p className="is-size-5">{t("objectTypeSelector.loading.message")}</p>
				</IconFlex>
			</div>
		);
	}

	if (error) {
		return (
			<div className="box">
				<IconFlex as="div" className="notification is-danger is-light" icon={["fas", "exclamation"]}>
					<p className="is-size-5">{t("objectTypeSelector.error.message")}</p>
				</IconFlex>

				<div className="buttons are-small-mobile">
					<button className="button is-light" onClick={() => onSelect(undefined)}>
						{t("objectTypeSelector.actions.skip")}
					</button>
					<button className="button is-light" onClick={onCancel}>
						{t("objectTypeSelector.actions.cancel")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="box">
			<h4 className="title is-5 is-6-mobile">{t("objectTypeSelector.title")}</h4>

			<div className="field">
				<div className="control">
					{objectTypesFiltered.map((type) => {
						const inputId = `object-type-${type.id}`;
						return (
							<div
								key={type.id}
								className="radio-box mb-2"
								style={{
									borderRadius: "8px",
									border: "1px solid #dbdbdb",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									minHeight: "56px",
									padding: "0.75rem",
								}}
								onClick={() => {
									setSelectedTypeId(type.id);
								}}
							>
								<input
									type="radio"
									id={inputId}
									name="object-type"
									value={type.id}
									checked={selectedTypeId === type.id}
									onChange={() => {}}
									style={{ width: "20px", height: "20px", flexShrink: 0 }}
								/>
								<label htmlFor={inputId} style={{ flex: 1, cursor: "pointer", margin: 0 }}>
									<div className="media" style={{ alignItems: "center" }}>
										{type.imageUrl && (
											<div className="media-left" style={{ marginRight: "0.5rem" }}>
												<Icon src={type.imageUrl} alt={type.name} />
											</div>
										)}
										<div className="media-content">
											<p className="title is-6 mb-0">{type.name}</p>
										</div>
									</div>
								</label>
							</div>
						);
					})}
				</div>
			</div>

			<div className="buttons are-small-mobile mt-4">
				<button className="button is-primary" onClick={handleConfirm} disabled={selectedTypeId === ""}>
					{t("objectTypeSelector.actions.add")}
				</button>
				<button className="button is-light is-danger" onClick={onCancel}>
					{t("objectTypeSelector.actions.cancel")}
				</button>
				<button className="button is-light" onClick={() => onSelect(undefined)}>
					{t("objectTypeSelector.actions.addWithoutType")}
				</button>
			</div>
		</div>
	);
};
