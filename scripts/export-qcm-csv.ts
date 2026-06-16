/**
 * Generate the seed-bank artifacts. Run with: npm run export:qcm-csv
 *
 * Writes:
 *   data/svaeng-yul-qcm-seed.full.csv     (all columns incl. metadata)
 *   data/svaeng-yul-qcm-seed.import.csv   (admin-importer-safe columns)
 *   data/svaeng-yul-qcm-seed.csv          (alias of the full CSV)
 *   data/svaeng-yul-qcm-seed.json         (subjects, topics, questions, sources)
 *   data/svaeng-yul-qcm-seed-preview.md   (human-readable preview)
 *   public/sample-questions.csv           (import-safe; powers the admin "sample" link)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateQcm, formatValidationReport } from "@/lib/seed/validate-qcm";
import { toFullCsv, toImportCsv, toSeedJson, toPreviewMarkdown } from "@/lib/seed/export-csv";

const root = process.cwd();
const dataDir = resolve(root, "data");
const publicDir = resolve(root, "public");
mkdirSync(dataDir, { recursive: true });

// Refuse to export an invalid bank — keeps artifacts trustworthy.
const result = validateQcm();
if (!result.ok) {
  console.error(formatValidationReport(result));
  console.error("\nExport aborted: fix validation errors first.");
  process.exit(1);
}

const fullCsv = toFullCsv();
const importCsv = toImportCsv();
const json = JSON.stringify(toSeedJson(), null, 2);
const preview = toPreviewMarkdown();

writeFileSync(resolve(dataDir, "svaeng-yul-qcm-seed.full.csv"), fullCsv);
writeFileSync(resolve(dataDir, "svaeng-yul-qcm-seed.import.csv"), importCsv);
writeFileSync(resolve(dataDir, "svaeng-yul-qcm-seed.csv"), fullCsv);
writeFileSync(resolve(dataDir, "svaeng-yul-qcm-seed.json"), json + "\n");
writeFileSync(resolve(dataDir, "svaeng-yul-qcm-seed-preview.md"), preview + "\n");
writeFileSync(resolve(publicDir, "sample-questions.csv"), importCsv);

console.log("Exported QCM seed artifacts:");
console.log("- data/svaeng-yul-qcm-seed.full.csv");
console.log("- data/svaeng-yul-qcm-seed.import.csv");
console.log("- data/svaeng-yul-qcm-seed.csv");
console.log("- data/svaeng-yul-qcm-seed.json");
console.log("- data/svaeng-yul-qcm-seed-preview.md");
console.log("- public/sample-questions.csv (refreshed)");
