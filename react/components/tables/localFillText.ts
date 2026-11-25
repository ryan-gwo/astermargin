import type { TableFillJobSnapshot } from "@astermargin/agent-core/protocol/tableFillProtocol";
import { uiText } from "../../utils/interfaceText";

export function localFillSources({
    documents,
    title_abstract,
    no_input,
    unavailable = 0,
}: {
    documents: number;
    title_abstract: number;
    no_input: number;
    unavailable?: number;
}): string {
    return [
        documents
            ? uiText("Full text for {count} items", { count: documents })
            : "",
        title_abstract
            ? uiText("Title and abstract for {count} items", {
                  count: title_abstract,
              })
            : "",
        no_input + unavailable
            ? uiText("{count} items without readable sources", {
                  count: no_input + unavailable,
              })
            : "",
    ]
        .filter(Boolean)
        .join(" · ");
}

export function localFillProgress(job: TableFillJobSnapshot): string {
    const counts = { done: job.rows_done, total: job.rows_total };
    return job.state === "stopping"
        ? uiText("Stopping with {count} rows still processing…", {
              count: job.in_flight,
          })
        : uiText("Stop · {done}/{total} rows", counts);
}

export function localFillResult(job: TableFillJobSnapshot): string {
    const result = job.result;
    if (!result) return localFillProgress(job);
    const reason = result.stopped_by;
    const stopped =
        reason === "unavailable"
            ? uiText("The model endpoint could not finish the fill.")
            : reason &&
              uiText("Fill stopped after {done}/{total} rows", {
                  done: job.rows_done,
                  total: job.rows_total,
              });
    return [
        stopped,
        uiText("Filled {count} rows", { count: result.rows_answered }),
        uiText("Model requests made: {count}", {
            count: job.request_attempts ?? result.rows_answered,
        }),
        result.failed_row_ids.length &&
            uiText("{count} rows failed", {
                count: result.failed_row_ids.length,
            }),
        result.not_written &&
            uiText("{count} rows could not be saved", {
                count: result.not_written,
            }),
    ]
        .filter(Boolean)
        .join(" · ");
}
