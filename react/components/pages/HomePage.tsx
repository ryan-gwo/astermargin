import {uiText} from "../../utils/interfaceText";
import React from "react";
import { useAtomValue } from 'jotai';
import { allLibrariesExcludedAtom } from "../../atoms/profile";
import RecentChats from "../RecentChats";
import HomeLauncher from "../HomeLauncher";
import InputArea from "../input/InputArea";
import DragDropWrapper from "../input/DragDropWrapper";
import PopupOverlayContainer from "../PopupOverlayContainer";
import { SettingsIcon }  from "../icons/icons";
import { openPreferencesWindow } from "../../ui/openPreferencesWindow";
import Button from "@astermargin/agent-ui/primitives/Button";

interface HomePageProps {
    isWindow?: boolean;
    inputRef: React.RefObject<HTMLElement | null>;
}


const AllLibrariesExcludedMessage = () => (
    <div
        className="display-flex flex-row items-center gap-2 text-sm p-2 rounded-md"
        style={{ color: 'var(--tag-red-secondary)', border: '1px solid var(--tag-red-tertiary)', background: 'var(--tag-red-quinary)' }}
    >
        <span className="flex-1">
            {uiText("AsterMargin can't access any libraries. You've excluded all of them.")}
        </span>
        <Button
            variant="error"
            icon={SettingsIcon}
            onClick={() => openPreferencesWindow('sync')}
        >
            {uiText("Open Settings")}
        </Button>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ isWindow = false, inputRef }) => {
    const allLibrariesExcluded = useAtomValue(allLibrariesExcludedAtom);

    // Beta versions use a pre-release tag (e.g. "0.20.0-beta.1")
    const isBeta = /-beta\.\d+$/.test(Zotero.AsterMargin?.pluginVersion ?? "");

    return (
        <div
            id="welcome-page"
            className="display-flex flex-col flex-1 min-h-0"
        >
            {/* Scrollable top section */}
            <div className="display-flex flex-col flex-1 overflow-y-auto scrollbar px-3 pt-4">
                <div className="display-flex flex-col flex-1 gap-4 astermargin-content-column">
                    {/* Top spacer. The window has the height to sit the
                        greeting lower, where the eye lands first. */}
                    <div className="flex-1" style={{ minHeight: '2vh', maxHeight: isWindow ? '18vh' : '4vh' }} />

                    {/* Greeting */}
                    <div className="text-2xl font-semibold text-center p-2">{uiText("How can I help you?")}</div>

                    {/* Input area */}
                    <DragDropWrapper>
                        <InputArea inputRef={inputRef} verticalPosition="below" />
                    </DragDropWrapper>

                    {/* Action launcher — category row + expandable panels */}
                    {allLibrariesExcluded ? (
                        <AllLibrariesExcludedMessage />
                    ) : (
                        <HomeLauncher />
                    )}

                    {/* Bottom spacer */}
                    <div className="flex-1" />
                </div>
            </div>

            {/* Fixed bottom section */}
            <div
                id="astermargin-home-footer"
                className="flex-none px-25 astermargin-content-column"
            >
                {/* The separate window lists its history in its sidebar. */}
                {!isWindow && <RecentChats />}

                <div className="relative -mx-4 px-4 mb-3">
                    <PopupOverlayContainer />
                </div>

                {isBeta && (
                    <div className="text-sm font-color-secondary mb-2 bg-quinary p-2 rounded-md">
                        {uiText("You're using a beta version. Please report any issues.")}{" "}
                        <a href="mailto:contact@astermarginapp.ai">contact@astermarginapp.ai</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
