import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import { useObjectTypes } from "../contexts/ObjectTypesContext";
import { useTranslation } from "../i18n";
import { Icon } from "./Icon";

export const CUSTOM_TYPE_ID = "custom";

interface ObjectTypeSelectorProps {
	onSelect: (typeId?: string, customType?: string) => void;
	onCancel: () => void;
}

export const ObjectTypeSelector = ({ onSelect, onCancel }: ObjectTypeSelectorProps) => {
	const { t } = useTranslation();
	const { objectTypes, isLoading, error } = useObjectTypes();
	const [selectedTypeId, setSelectedTypeId] = useState("");
	const [customType, setCustomType] = useState<string>("");

	const handleConfirm = () => {
		if (selectedTypeId === CUSTOM_TYPE_ID) {
			onSelect(undefined, customType);
		} else {
			onSelect(selectedTypeId);
		}
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

				<div className="field">
					<label className="label">{t("objectTypeSelector.customType.label")}</label>
					<div className="control">
						<input
							className="input"
							type="text"
							value={customType}
							onChange={(e) => setCustomType(e.target.value)}
							placeholder={t("objectTypeSelector.customType.placeholder")}
						/>
					</div>
				</div>

				<div className="field is-grouped">
					<div className="control">
						<button
							className="button is-primary"
							onClick={() => onSelect(undefined, customType)}
							disabled={!customType.trim()}
						>
							{t("objectTypeSelector.customType.radioLabel")}{" "}
							{t("objectTypeSelector.customType.notImplementedWarning")}
						</button>
					</div>

					<div className="control">
						<button className="button is-light" onClick={() => onSelect(undefined, undefined)}>
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
									console.log("asd");
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

					<div
						style={{
							borderRadius: "8px",
							border: "1px solid #dbdbdb",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: "1rem",
							minHeight: "64px",
						}}
						onClick={() => setSelectedTypeId(CUSTOM_TYPE_ID)}
					>
						<label className="radio is-block p-3">
							<input
								type="radio"
								name="object-type"
								value={CUSTOM_TYPE_ID}
								checked={selectedTypeId === CUSTOM_TYPE_ID}
								style={{ width: "24px", height: "24px" }}
							/>
							<span className="ml-3 is-inline-block" style={{ flex: 1 }}>
								{t("objectTypeSelector.customType.radioLabel")}{" "}
								{t("objectTypeSelector.customType.notImplementedWarning")}
							</span>
						</label>
					</div>
				</div>
			</div>

			{selectedTypeId === CUSTOM_TYPE_ID && (
				<div className="field">
					<div className="control">
						<input
							className="input"
							type="text"
							value={customType}
							onChange={(e) => setCustomType(e.target.value)}
							placeholder={t("objectTypeSelector.customType.placeholder")}
						/>
					</div>
				</div>
			)}

			<div className="field is-grouped mt-4">
				<div className="control">
					<button
						className="button  is-primary"
						onClick={handleConfirm}
						disabled={selectedTypeId === "" || (selectedTypeId === CUSTOM_TYPE_ID && !customType.trim())}
					>
						{t("objectTypeSelector.actions.add")}
					</button>
				</div>

				<div className="control">
					<button className="button is-light is-danger" onClick={onCancel}>
						{t("objectTypeSelector.actions.cancel")}
					</button>
				</div>

				<div className="control">
					<button className="button is-light" onClick={() => onSelect(undefined, undefined)}>
						{t("objectTypeSelector.actions.addWithoutType")}
					</button>
				</div>
			</div>
		</div>
	);
};
