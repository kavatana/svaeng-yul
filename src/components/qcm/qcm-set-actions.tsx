"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/qcm/confirm-button";
import { deleteQcmSetAction, setQcmSetArchivedAction } from "@/lib/qcm/actions";

export function QcmSetActions({ setId, isArchived }: { setId: string; isArchived: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setQcmSetArchivedAction(setId, !isArchived);
          })
        }
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isArchived ? (
          <ArchiveRestore className="size-3.5" />
        ) : (
          <Archive className="size-3.5" />
        )}
        {isArchived ? "Restore" : "Archive"}
      </Button>
      <ConfirmButton
        variant="ghost"
        size="sm"
        className="text-destructive"
        action={() => deleteQcmSetAction(setId)}
        title="Delete this whole set?"
        description="This permanently deletes the set and all its questions and practice history. This can't be undone."
        confirmLabel="Delete set"
      >
        <Trash2 className="size-3.5" /> Delete
      </ConfirmButton>
    </div>
  );
}
