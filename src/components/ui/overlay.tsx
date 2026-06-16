"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface OverlayProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** "center" = desktop dialog, "sheet" = mobile bottom sheet. */
  variant?: "center" | "sheet"
  title?: string
  description?: string
  className?: string
}

/**
 * A dependency-free overlay used for both centered dialogs and mobile bottom
 * sheets. Locks scroll, closes on Escape / backdrop click, and traps focus
 * loosely (autofocus the panel).
 */
export function Overlay({
  open,
  onClose,
  children,
  variant = "center",
  title,
  description,
  className,
}: OverlayProps) {
  // Portal SSR guard: only render into document.body after the client mounts.
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
      />
      <div
        className={cn(
          "glow-card relative z-10 m-auto w-full max-w-lg p-5 animate-in fade-in-0 zoom-in-95",
          variant === "center" && "rounded-2xl",
          variant === "sheet" &&
            "mt-auto mb-0 max-w-none rounded-t-3xl rounded-b-none pb-safe duration-200 slide-in-from-bottom-4 sm:m-auto sm:max-w-lg sm:rounded-2xl",
          className
        )}
      >
        {(title || description) && (
          <div className="mb-3 pr-8">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}
