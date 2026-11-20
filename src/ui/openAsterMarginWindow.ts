import { AsterMarginUIFactory } from './ui';

/**
 * Open AsterMargin in a separate window.
 * If a window already exists, it will be focused instead.
 */
export function openAsterMarginWindow(origin?: Window): void {
    AsterMarginUIFactory.openAsterMarginWindow(origin);
}
