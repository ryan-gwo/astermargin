import React from "react";
import config from "../../../package.json";
import { settingsText } from "../../utils/settingsText";
import { ExternalLink, SectionLabel, SettingsGroup, SettingsRow } from "./components/SettingsElements";
import { UpdatesSection } from "./UpdatesSection";

/** About and release controls live together so the settings sidebar has no
 * account, subscription, terms or privacy-policy identity. */
export default function AboutSection() {
    return (
        <>
            <SettingsGroup>
                <SettingsRow
                    title={settingsText("AsterMargin")}
                    description={settingsText("AI-assisted literature reading for Zotero, with local-first research tools.")}
                    control={
                        <span className="font-color-secondary text-sm">
                            {settingsText("Version {version}", { version: config.version })}
                        </span>
                    }
                />
                <SettingsRow
                    hasBorder
                    title={settingsText("License and attribution")}
                    description={settingsText("AsterMargin is released under AGPL-3.0-or-later and includes attribution for Beaver and other third-party components.")}
                    control={<ExternalLink href="https://github.com/ryan-gwo/astermargin">{settingsText("Source code")}</ExternalLink>}
                />
                <SettingsRow
                    hasBorder
                    title={settingsText("Data handling")}
                    description={settingsText("Local indexes, OCR results and conversation state stay on this device. Remote models receive only the material needed for the current task and selected library scope.")}
                />
            </SettingsGroup>

            <SectionLabel>{settingsText("Updates")}</SectionLabel>
            <UpdatesSection embedded />
        </>
    );
}
