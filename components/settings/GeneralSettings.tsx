"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light",  label: "Light",  Icon: Sun },
  { value: "dark",   label: "Dark",   Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export default function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- next-themes hydration gate; theme is unknown until client mount
    setMounted(true);
  }, []);
  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">General Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">Theme and other app-wide preferences.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Theme</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choose how the forum looks on this device.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map(({ value, label, Icon }) => {
            const selected = active === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border px-3 py-4 transition-colors",
                  selected
                    ? "border-primary bg-primary-mute text-primary"
                    : "border-border text-muted-foreground hover:border-primary-soft hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
