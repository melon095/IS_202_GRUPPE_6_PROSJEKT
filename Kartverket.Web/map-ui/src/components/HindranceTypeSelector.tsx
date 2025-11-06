import { useState } from "react";

import { useHindranceTypes } from "../contexts/HindranceTypesContext";
import { useTranslation } from "../i18n";
import { Icon } from "./Icon";
import { IconFlex } from "./IconFlex";

interface HindranceTypeSelectorProps {
	onSelect: (typeId?: string) => void;
	onCancel: () => void;
}

export const HindranceTypeSelector = ({ onSelect, onCancel }: HindranceTypeSelectorProps) => {
	const { t } = useTranslation();
	const { hindranceTypes, isLoading, error } = useHindranceTypes();
	const [selectedTypeId, setSelectedTypeId] = useState("");

	const handleConfirm = () => {
		onSelect(selectedTypeId);
	};

	if (isLoading) {
		return (
			<div className="box">
				<IconFlex as="div" icon={{ icon: ["fas", "spinner"], spin: true }} className="has-text-centered">
					<p className="is-size-5">{t("hindranceTypeSelector.loading.message")}</p>
				</IconFlex>
			</div>
		);
	}

	if (error) {
		return (
			<div className="box">
				<IconFlex as="div" className="notification is-danger is-light" icon={["fas", "exclamation"]}>
					<p className="is-size-5">{t("hindranceTypeSelector.error.message")}</p>
				</IconFlex>

				<div className="field is-grouped">
					<div className="control">
						<button className="button is-light" onClick={() => onSelect(undefined)}>
							{t("hindranceTypeSelector.actions.skip")}
						</button>
					</div>

					<div className="control">
						<button className="button is-light" onClick={onCancel}>
							{t("hindranceTypeSelector.actions.cancel")}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="box">
			<h4 className="title is-5">{t("hindranceTypeSelector.title")}</h4>

			<div className="field">
				<div className="control">
					{hindranceTypes.map((type) => {
						const inputId = `hindrance-type-${type.id}`;
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
									name="hindrance-type"
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
						{t("hindranceTypeSelector.actions.add")}
					</button>
				</div>

				<div className="control">
					<button className="button is-light is-danger" onClick={onCancel}>
						{t("hindranceTypeSelector.actions.cancel")}
					</button>
				</div>

				<div className="control">
					<button className="button is-light" onClick={() => onSelect(undefined)}>
						{t("hindranceTypeSelector.actions.addWithoutType")}
					</button>
				</div>
			</div>
		</div>
	);
};
