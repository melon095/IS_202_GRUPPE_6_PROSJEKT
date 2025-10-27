import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import { useObjectTypes } from "../contexts/ObjectTypesContext";
import { useTranslation } from "../i18n";
import { Icon } from "./Icon";

interface ObjectTypeSelectorProps {
	onSelect: (typeId?: string) => void;
	onCancel: () => void;
}

export const ObjectTypeSelector = ({ onSelect, onCancel }: ObjectTypeSelectorProps) => {
	const { t } = useTranslation();
	const { objectTypes, isLoading, error } = useObjectTypes();
	const [selectedTypeId, setSelectedTypeId] = useState("");

	const handleConfirm = () => {
		onSelect(selectedTypeId);
	};

	if (isLoading) {
		return (
			<div className="box">
				<div className="has-text-centered">
					<span className="icon">
						<FontAwesomeIcon icon={["fas", "spinner"]} spin />
					</span>
					<p>{t("objectTypeSelector.loading.message")}</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="box">
				<div className="notification is-danger is-light">
					<p>
						<FontAwesomeIcon icon={["fas", "triangle-exclamation"]} />{" "}
						{t("objectTypeSelector.error.message")}
					</p>
				</div>

				<div className="field is-grouped">
					<div className="control">
						<button className="button is-light" onClick={() => onSelect(undefined)}>
							{t("objectTypeSelector.actions.skip")}
						</button>
					</div>

					<div className="control">
						<button className="button is-light" onClick={onCancel}>
							{t("objectTypeSelector.actions.cancel")}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="box">
			<h4 className="title is-5">{t("objectTypeSelector.title")}</h4>

			<div className="field">
				<div className="control">
					{objectTypes.map((type) => {
						const inputId = `object-type-${type.id}`;
						return (
							<div
								key={type.id}
								className="radio-box"
								style={{
									borderRadius: "8px",
									border: "1px solid #dbdbdb",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									gap: "1rem",
									minHeight: "64px",
									padding: "1rem",
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
									style={{ width: "24px", height: "24px" }}
								/>
								<label htmlFor={inputId} style={{ flex: 1, cursor: "pointer" }}>
									<div className="media">
										{type.primaryImageUrl && (
											<div className="media-left">
												<Icon src={type.primaryImageUrl} alt={type.name} />
											</div>
										)}
										<div className="media-content">
											<p className="title is-6">{type.name}</p>
										</div>
									</div>
								</label>
							</div>
						);
					})}
				</div>
			</div>

			<div className="field is-grouped mt-4">
				<div className="control">
					<button className="button  is-primary" onClick={handleConfirm} disabled={selectedTypeId === ""}>
						{t("objectTypeSelector.actions.add")}
					</button>
				</div>

				<div className="control">
					<button className="button is-light is-danger" onClick={onCancel}>
						{t("objectTypeSelector.actions.cancel")}
					</button>
				</div>

				<div className="control">
					<button className="button is-light" onClick={() => onSelect(undefined)}>
						{t("objectTypeSelector.actions.addWithoutType")}
					</button>
				</div>
			</div>
		</div>
	);
};
