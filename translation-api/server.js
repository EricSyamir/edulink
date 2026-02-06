import express from "express";
import cors from "cors";
import translate from "@vitalets/google-translate-api";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: "*", // standalone service
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (_req, res) => res.status(200).send("ok\n"));

app.post("/translation/", async (req, res) => {
  try {
    const { text, source_lang, target_lang } = req.body ?? {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ detail: "Text is required" });
    }
    if (!target_lang || typeof target_lang !== "string") {
      return res.status(400).json({ detail: "target_lang is required" });
    }

    // Match your frontend language codes
    const langMap = {
      malay: "ms",
      ms: "ms",
      english: "en",
      en: "en",
      mandarin: "zh-CN",
      zh: "zh-CN",
      tamil: "ta",
      ta: "ta",
      auto: "auto",
    };

    const fromRaw = (source_lang || "auto").toString().toLowerCase();
    const toRaw = target_lang.toString().toLowerCase();
    const from = langMap[fromRaw] || source_lang || "auto";
    const to = langMap[toRaw] || target_lang;

    const result = await translate(text, { from, to });

    return res.json({
      translated_text: result.text,
      original_text: text,
      src_lang: from,
      tgt_lang: to,
    });
  } catch (e) {
    return res.status(500).json({ detail: `Translation failed: ${e?.message || e}` });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Translation API listening on :${port}`);
});

