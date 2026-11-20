import { windowCommands } from "../runtime/windowCommands";
import type { WindowRuntime } from '../../src/runtime/instance';
import {
    handleTestApplicationStateHttpRequest,
    handleTestAsterMarginSidebarHttpRequest,
    handleTestAsterMarginWindowHttpRequest,
    handleTestSelectTabHttpRequest,
} from './httpHandlers/testApplicationStateHandlers';
import {
    handleBatchProgressClear,
    handleBatchProgressPreview,
} from './httpHandlers/testBatchProgressHandlers';
import {
    handleTestApproveActionHttpRequest,
    handleTestChatDropConnectionHttpRequest,
    handleTestRunSnapshotHttpRequest,
    handleTestChatStopHttpRequest,
    handleTestChatContinueHttpRequest,
    handleTestChatSendHttpRequest,
    handleTestConfirmCreditsHttpRequest,
    handleTestTableCardHttpRequest,
    handleTestAnswerQuestionHttpRequest,
    handleTestBatchApprovalHttpRequest,
    handleTestTableFillProgressHttpRequest,
    handleTestCurrentIdsHttpRequest,
    handleTestListActionsHttpRequest,
    handleTestLoadThreadHttpRequest,
    handleTestNewThreadHttpRequest,
    handleTestUndoActionHttpRequest,
} from './httpHandlers/testChatHandlers';
import {
    handleTestResolveItemDisplayHttpRequest,
} from './httpHandlers/testCitationHandlers';
import {
    handleTestEpubAnnotationParityHttpRequest,
} from './httpHandlers/testEpubAnnotationHandlers';

import {
    handleTestNoteApplyHttpRequest,
    handleTestNoteCloseEditorHttpRequest,
    handleTestNoteOpenEditorHttpRequest,
    handleTestNotePreviewHttpRequest,
    handleTestNoteUndoHttpRequest,
} from './httpHandlers/testNoteHandlers';

import {
    handleTestPdfCaptchaEligibilityHttpRequest,
    handleTestPdfRetrievalHttpRequest,
} from './httpHandlers/testPdfRetrievalHandlers';

import { handleTestQuickPromptHttpRequest } from './httpHandlers/testQuickPromptHandlers';
import {
    handleTestEpubCitationNavigateHttpRequest,
    handleTestReaderStateHttpRequest,
} from './httpHandlers/testReaderHandlers';
import { handleTestRunStatusPopupHttpRequest } from './httpHandlers/testRunStatusPopupHandlers';
import { handleTestFeatureTipHttpRequest } from './httpHandlers/testFeatureTipHandlers';
import { handleTestListSavedActionsHttpRequest } from './httpHandlers/testSavedActionsHandlers';
import {
    handleTestSnapshotAnnotationParityHttpRequest,
} from './httpHandlers/testSnapshotAnnotationHandlers';
import {
    handleTestOpenStoredTableHttpRequest,
} from './httpHandlers/testTableHandlers';
import { handleTestVersionPopupHttpRequest } from './httpHandlers/testVersionPopupHandlers';
import { handleTestExportHttpRequest } from './httpHandlers/testExportHandlers';
import { captureOperationContext } from '../runtime/operationContext';
export function registerWindowTestCommands(
    runtime: WindowRuntime,
    inspect: (request: any) => any,
): void {
    const handlers = {
        ...windowCommands,
        'inspect-runtime': async (request: any) => inspect(request),
        '/astermargin/test/batch-progress-preview': handleBatchProgressPreview,
        '/astermargin/test/batch-progress-clear': handleBatchProgressClear,
        '/astermargin/test/note-open-editor': handleTestNoteOpenEditorHttpRequest,
        '/astermargin/test/note-close-editor': handleTestNoteCloseEditorHttpRequest,
        '/astermargin/test/note-undo': handleTestNoteUndoHttpRequest,
        '/astermargin/test/note-apply': handleTestNoteApplyHttpRequest,
        '/astermargin/test/note-preview': handleTestNotePreviewHttpRequest,
        '/astermargin/test/pdf-retrieval': handleTestPdfRetrievalHttpRequest,
        '/astermargin/test/pdf-captcha-eligibility': handleTestPdfCaptchaEligibilityHttpRequest,
        '/astermargin/test/epub-annotation-parity': handleTestEpubAnnotationParityHttpRequest,
        '/astermargin/test/snapshot-annotation-parity': handleTestSnapshotAnnotationParityHttpRequest,
        '/astermargin/test/reader-state': handleTestReaderStateHttpRequest,
        '/astermargin/test/epub-citation-navigate': handleTestEpubCitationNavigateHttpRequest,
        '/astermargin/test/resolve-item-display': handleTestResolveItemDisplayHttpRequest,
        '/astermargin/test/new-thread': handleTestNewThreadHttpRequest,
        '/astermargin/test/chat-send': handleTestChatSendHttpRequest,
        '/astermargin/test/current-ids': handleTestCurrentIdsHttpRequest,
        '/astermargin/test/load-thread': handleTestLoadThreadHttpRequest,
        '/astermargin/test/list-actions': handleTestListActionsHttpRequest,
        '/astermargin/test/approve-action': handleTestApproveActionHttpRequest,
        '/astermargin/test/confirm-credits': handleTestConfirmCreditsHttpRequest,
        '/astermargin/test/table-card': handleTestTableCardHttpRequest,
        '/astermargin/test/answer-question': handleTestAnswerQuestionHttpRequest,
        '/astermargin/test/batch-approval': handleTestBatchApprovalHttpRequest,
        '/astermargin/test/table-fill-progress': handleTestTableFillProgressHttpRequest,
        '/astermargin/test/undo-action': handleTestUndoActionHttpRequest,
        '/astermargin/test/chat-drop-connection': handleTestChatDropConnectionHttpRequest,
        '/astermargin/test/run-snapshot': handleTestRunSnapshotHttpRequest,
        '/astermargin/test/chat-stop': handleTestChatStopHttpRequest,
        '/astermargin/test/chat-continue': handleTestChatContinueHttpRequest,
        '/astermargin/test/application-state': handleTestApplicationStateHttpRequest,
        'application-state': handleTestApplicationStateHttpRequest,
        '/astermargin/test/astermargin-window': handleTestAsterMarginWindowHttpRequest,
        '/astermargin/test/open-stored-table': handleTestOpenStoredTableHttpRequest,
        '/astermargin/test/astermargin-sidebar': handleTestAsterMarginSidebarHttpRequest,
        '/astermargin/test/select-tab': handleTestSelectTabHttpRequest,
        '/astermargin/test/run-status-popup': handleTestRunStatusPopupHttpRequest,
        '/astermargin/test/feature-tip': handleTestFeatureTipHttpRequest,
        '/astermargin/test/quick-prompt': handleTestQuickPromptHttpRequest,
        '/astermargin/test/version-popup': handleTestVersionPopupHttpRequest,
        '/astermargin/test/saved-actions': handleTestListSavedActionsHttpRequest,
        '/astermargin/test/export': handleTestExportHttpRequest,
        'automatic-reading-note': async (request:{ids:number[]}) => (await import('../runtime/newItemAction')).onNewPapers(request.ids),
        'local-semantic-search': async (request:{query:string;options:import('../../src/services/semanticSearchService').SearchOptions}) => (await import('../runtime/semanticIndex')).rankLocalDocuments(request.query,request.options),
        'render-markdown': async (request: { content: string }) => captureOperationContext(false).renderMarkdown!(request.content),
    };
    Zotero.AsterMargin.runtime.registerWindowCommands(runtime, handlers);
}
