"use client";

import { useState } from "react";
import { User, Shield, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileTabs({
  overview,
  badges,
  settings,
}: {
  overview: React.ReactNode;
  badges: React.ReactNode;
  settings: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "settings">("overview");

  return (
    <div className="space-y-6 mt-6">
      <div className="flex w-full overflow-x-auto rounded-2xl bg-background/40 p-1 backdrop-blur-md border border-border/50 shadow-sm">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<User className="size-4" />} label="Overview" />
        <TabButton active={activeTab === "badges"} onClick={() => setActiveTab("badges")} icon={<Shield className="size-4" />} label="Badges" />
        <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings className="size-4" />} label="Settings" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
        {activeTab === "overview" && overview}
        {activeTab === "badges" && badges}
        {activeTab === "settings" && settings}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
        active
          ? "bg-gradient-to-r from-purple-glow/20 to-electric/20 text-foreground shadow-sm ring-1 ring-border/50"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
