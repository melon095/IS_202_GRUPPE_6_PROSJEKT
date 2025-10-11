import { useState } from "react";

import { useObjectTypes } from "../contexts/ObjectTypesContext";

export const CUSTOM_TYPE_ID = "custom";

interface ObjectTypeSelectorProps {
	onSelect: (
		typeId?: string | undefined,
		customType?: string | undefined
	) => void;
	onCancel: () => void;
}

export const ObjectTypeSelector = ({
	onSelect,
	onCancel,
}: ObjectTypeSelectorProps) => {
	const { objectTypes, isLoading, error } = useObjectTypes();
	const [selectedTypeId, setSelectedTypeId] = useState("");
	const [customType, setCustomType] = useState<string | undefined>(undefined);

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
						<i className="fas fa-spinner fa-spin"></i>
					</span>
					<p>Laster inn objekttyper...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="box">
				<div className="notification is-danger is-light">
					<p>
						Klarte ikke å laste inn objekttyper. Men du kan fortsatt
						legge til et egendefinert objekttype.
					</p>
				</div>
				<div className="field">
					<label className="label">Egendefinert objekttype</label>
					<div className="control">
						<input
							className="input"
							type="text"
							value={customType}
							onChange={(e) => setCustomType(e.target.value)}
							placeholder="F.eks. 'Min spesielle type'"
						/>
					</div>
				</div>

				<div className="field is-grouped">
					<div className="control">
						<button
							className="button is-primary"
							onClick={() => onSelect(undefined, customType)}
							disabled={!customType || customType.trim() === ""}
						>
							Legg til egendefinert type
						</button>
					</div>

					<div className="control">
						<button className="button is-light" onClick={onCancel}>
							Kanseller
						</button>
					</div>

					<div className="control">
						<button
							className="button is-light"
							onClick={() => onSelect(undefined, undefined)}
						>
							Hopp Over
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="box">
			<h4 className="title is-5">Hva type er dette objektet?</h4>

			<div className="field">
				<div className="control">
					{objectTypes.map((type) => (
						<label key={type.id} className="radio is-block mb-3">
							<input
								type="radio"
								name="object-type"
								value={type.id}
								checked={selectedTypeId === type.id}
								onChange={() => setSelectedTypeId(type.id)}
							/>
							<div className="ml-3 is-inline-block">
								<div className="media">
									<div className="media-left">
										<figure className="image is-48x48">
											<img
												src={type.primaryImageUrl}
												alt={type.name}
												style={{ objectFit: "cover" }}
											/>
										</figure>
									</div>
									<div className="media-content">
										<p className="title is-6">
											{type.name}
										</p>
									</div>
								</div>
							</div>
						</label>
					))}

					<label className="radio is-block">
						<input
							type="radio"
							name="object-type"
							value={CUSTOM_TYPE_ID}
							checked={selectedTypeId === CUSTOM_TYPE_ID}
							onChange={() => setSelectedTypeId(CUSTOM_TYPE_ID)}
						/>
						<span className="ml-3 is-inline-block">
							Egendefinert objekttype
						</span>
					</label>
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
							placeholder="F.eks. 'Min spesielle type'"
						/>
					</div>
				</div>
			)}

			<div className="field is-grouped mt-4">
				<div className="control">
					<button
						className="button is-light"
						onClick={handleConfirm}
						disabled={
							selectedTypeId === "" ||
							(selectedTypeId === CUSTOM_TYPE_ID &&
								(!customType || customType.trim() === ""))
						}
					>
						Legg til
					</button>
				</div>

				<div className="control">
					<button className="button is-light" onClick={onCancel}>
						Kanseller
					</button>
				</div>

				<div className="control">
					<button
						className="button is-info is-light"
						onClick={() => onSelect(undefined, undefined)}
					>
						Hopp Over
					</button>
				</div>
			</div>
		</div>
	);
};
