/**
 * Validate the seed QCM bank. Run with: npm run validate:qcm
 * Exits 1 on any validation error so it can gate CI / pre-seed.
 */
import { validateQcm, formatValidationReport } from "@/lib/seed/validate-qcm";

const result = validateQcm();
console.log(formatValidationReport(result));

if (!result.ok) {
  process.exit(1);
}
