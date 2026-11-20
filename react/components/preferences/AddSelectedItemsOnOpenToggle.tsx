import React from "react";
import PreferenceToggle from "./PreferenceToggle";
import { getPref, setPref } from "../../../src/utils/prefs";

interface AddSelectedItemsOnOpenToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const AddSelectedItemsOnOpenToggle: React.FC<AddSelectedItemsOnOpenToggleProps> = ({ checked, onChange }) => {
    const handleChange = (newValue: boolean) => {
        setPref("addSelectedItemsOnOpen", newValue);
        onChange(newValue);
    };

    return (
        <PreferenceToggle
            checked={checked}
            onChange={handleChange}
            title="Add Selected Items When Opening AsterMargin"
            description="Automatically include items selected in Zotero when opening the AsterMargin sidebar."
            tooltip="When enabled, any items you have selected in Zotero will be automatically added as sources when you open AsterMargin."
        />
    );
};

export default AddSelectedItemsOnOpenToggle; 