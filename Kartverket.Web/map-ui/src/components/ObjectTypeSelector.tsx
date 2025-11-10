import {useState} from "react";

import {useObjectTypes} from "../contexts/ObjectTypesContext";
import {useTranslation} from "../i18n";
import {Icon} from "./Icon";
import {IconFlex} from "./IconFlex";
import {PlaceMode} from "../types.ts";

interface ObjectTypeSelectorProps {
    onSelect: (typeId?: string) => void;
    onCancel: () => void;
    placeMode: PlaceMode;
}

export const ObjectTypeSelector = ({onSelect, onCancel, placeMode}: ObjectTypeSelectorProps) => {
    const {t} = useTranslation();
    const {objectTypes, isLoading, error} = useObjectTypes();
    const [selectedTypeId, setSelectedTypeId] = useState("");

    const objectTypesFiltered = objectTypes.filter((type) => type.geometryType === placeMode);

    const handleConfirm = () => {
        onSelect(selectedTypeId);
    };

    if (isLoading) {
        return (
            <div className="box">
                <IconFlex as="div" icon={{icon: ["fas", "spinner"], spin: true}} className="has-text-centered">
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
                    {objectTypesFiltered.map((type) => {
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
                                    style={{width: "24px", height: "24px"}}
                                />
                                <label htmlFor={inputId} style={{flex: 1, cursor: "pointer"}}>
                                    <div className="media">
                                        {type.imageUrl && (
                                            <div className="media-left">
                                                <Icon src={type.imageUrl} alt={type.name}
                                                      fill={type.colour ?? "#000000"}/>
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
