import React from "react";
import Link from "next/link";
import { FaRegClock, FaRegFolderOpen } from "react-icons/fa";
import { Button } from "@/components/ui/button";

type Variant = "comingSoon" | "notAvailable";

type ContentNotAvailableProps = {
  variant?: Variant;
  title?: string;
  description?: string;
  /** Show a "Back home" action. Defaults to true. */
  showHomeButton?: boolean;
  className?: string;
};

const VARIANTS: Record<
  Variant,
  { icon: React.ComponentType<{ className?: string }>; title: string; description: string }
> = {
  comingSoon: {
    icon: FaRegClock,
    title: "Coming soon",
    description: "We're still putting this together. Check back before long.",
  },
  notAvailable: {
    icon: FaRegFolderOpen,
    title: "Content not available",
    description: "This content couldn't be found or isn't available right now.",
  },
};

/**
 * Friendly empty state for pages that don't exist yet or have no content.
 * @param variant - Preset copy/icon: "comingSoon" or "notAvailable".
 * @param title - Overrides the variant's default title.
 * @param description - Overrides the variant's default description.
 * @param showHomeButton - Whether to render the "Back home" link.
 * @returns A centered card matching the app's surface styling.
 */
const ContentNotAvailable: React.FC<ContentNotAvailableProps> = ({
  variant = "comingSoon",
  title,
  description,
  showHomeButton = true,
  className,
}) => {
  const preset = VARIANTS[variant];
  const Icon = preset.icon;

  return (
    <div
      className={
        "flex flex-col items-center justify-center rounded-xl border border-border bg-card p-10 text-center" +
        (className ? ` ${className}` : "")
      }
    >
      <div
        className="mb-5 flex size-14 items-center justify-center rounded-2xl shadow-[0_2px_8px_-3px_hsl(var(--primary)/0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-deep)))" }}
      >
        <Icon className="text-2xl text-primary-foreground" />
      </div>

      {variant === "comingSoon" && (
        <span className="mb-2 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
          Coming soon
        </span>
      )}

      <h1 className="font-serif text-2xl font-semibold">{title ?? preset.title}</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description ?? preset.description}
      </p>

      {showHomeButton && (
        <Button asChild className="mt-6 w-[150px]">
          <Link href="/">Back home</Link>
        </Button>
      )}
    </div>
  );
};

export default ContentNotAvailable;
