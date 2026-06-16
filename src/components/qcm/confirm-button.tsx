"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/ui/overlay";

/**
 * A button that asks for confirmation before running a (server) action.
 * Used for archive / delete so a tap can't destroy work by accident.
 */
export function ConfirmButton({
  action,
  children,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
  size = "sm",
  className,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Overlay open={open} onClose={() => !pending && setOpen(false)} variant="center" title={title}>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" disabled={pending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={variant}
            className="flex-1"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await action();
                setOpen(false);
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </Overlay>
    </>
  );
}
