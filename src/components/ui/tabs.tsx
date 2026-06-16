"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TabItem {
  value: string
  label: React.ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

/** A simple segmented tab bar. Content is rendered by the parent. */
export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-xl bg-secondary/60 p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
