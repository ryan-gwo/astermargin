import { openAsterMarginWindow as openWindow } from '../../src/ui/openAsterMarginWindow';
import { tryGetWindowRuntime } from '../runtime/windowRuntime';

/** Focus the independent chat without replacing its contents. */
export function openAsterMarginWindow(): void {
    const runtime = tryGetWindowRuntime();
    if (!runtime || runtime.hostWindow.closed) return;
    openWindow(runtime.hostWindow);
}
