/* Tesseract.js 6 accepts preverified language bytes in loadLanguage, while
 * initialize expects language codes. Keep both stages offline. */
self.addEventListener("message", function (event) {
    const job = event.data;
    if (job.action === "initialize" && Array.isArray(job.payload.langs)) {
        job.payload.langs = job.payload.langs.map(lang => typeof lang === "string" ? lang : lang.code);
    }
});
importScripts("worker.min.js");
