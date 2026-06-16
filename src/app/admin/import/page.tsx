import { connection } from "next/server";

import { CsvImport } from "@/components/admin/csv-import";

export default async function ImportPage() {
  await connection();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">CSV import</h1>
        <p className="text-sm text-muted-foreground">
          Upload questions in bulk. We&apos;ll validate every row and show a preview
          before importing. New topics are created automatically.
        </p>
      </header>
      <CsvImport />
    </div>
  );
}
