import { getHost } from "./index";

/** Other hosts may supply their own catalogue. English is the source text. */
export function uiText(
    message: string,
    args?: Record<string, string | number>,
): string {
    const text = getHost().translate?.(message) ?? message;
    return args
        ? text.replace(/\{(\w+)\}/g, (token, name) =>
              String(args[name] ?? token),
          )
        : text;
}
