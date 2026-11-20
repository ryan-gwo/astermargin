import type { BackgroundTaskSource } from '../../src/utils/backgroundTasks';

/** Read the plugin-owned registry instead of creating a renderer-local task registry. */
export const subscribeToTasks: BackgroundTaskSource['subscribeToTasks'] = listener =>
    Zotero.AsterMargin.backgroundTasks.subscribeToTasks(listener);
export const getTasksForItem: BackgroundTaskSource['getTasksForItem'] = (...args) =>
    Zotero.AsterMargin.backgroundTasks.getTasksForItem(...args);
export const getTasksByType: BackgroundTaskSource['getTasksByType'] = type =>
    Zotero.AsterMargin.backgroundTasks.getTasksByType(type);
export const getActiveTasks: BackgroundTaskSource['getActiveTasks'] = () =>
    Zotero.AsterMargin.backgroundTasks.getActiveTasks();
export const getAllTasks: BackgroundTaskSource['getAllTasks'] = () =>
    Zotero.AsterMargin.backgroundTasks.getAllTasks();
