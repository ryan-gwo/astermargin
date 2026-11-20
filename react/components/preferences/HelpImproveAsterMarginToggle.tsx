import React from "react";
import PreferenceToggle from "./PreferenceToggle";

interface HelpImproveAsterMarginToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const HelpImproveAsterMarginToggle: React.FC<HelpImproveAsterMarginToggleProps> = ({ checked, onChange, disabled }) => {
    return (
        <PreferenceToggle
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            title="Help Improve AsterMargin"
            subtitle="(optional)"
            description="Share anonymized prompts to help improve AsterMargin"
            tooltip="When enabled, we use your prompts, queries, and AI responses to improve AsterMargin's features and performance. We automatically remove personal information and never share your PDFs, documents, or other files. You can change this setting anytime."
        />
    );
};

export default HelpImproveAsterMarginToggle;