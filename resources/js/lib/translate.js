// Free, on-device Arabic -> English translation using the browser's built-in
// Translator API (Chrome desktop 138+). It runs only in the ADMIN's browser at
// product-save time; the English text is stored with the product, so customers
// get it instantly with no service, key or cost.
//
// It must NEVER block saving: every step has a time limit, and when the language
// pack is not ready yet, the download is started in the background (used by the
// next save) and this save simply continues without English.
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve("__timeout__"), ms))]);

export async function translateArToEn(texts) {
  try {
    const Translator = typeof window !== "undefined" ? window.Translator : null;
    if (!Translator) return null;
    const options = { sourceLanguage: "ar", targetLanguage: "en" };

    const availability = await withTimeout(Translator.availability(options), 2000);
    if (availability === "__timeout__" || availability === "unavailable") return null;
    if (availability !== "available") {
      // Pack not downloaded yet: start it in the background, do not wait.
      Promise.resolve(Translator.create(options)).catch(() => {});
      return null;
    }

    const translator = await withTimeout(Translator.create(options), 3000);
    if (translator === "__timeout__" || !translator) return null;

    const out = [];
    for (const text of texts) {
      const value = String(text || "").trim();
      if (!value) {
        out.push("");
        continue;
      }
      const result = await withTimeout(translator.translate(value), 5000);
      out.push(result === "__timeout__" ? "" : String(result).trim());
    }
    return out;
  } catch {
    return null;
  }
}
