import { Icon, type IconName } from "./Icon";

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: IconName;
  /** Hide the "coming in an upcoming phase" note for live modules that simply have no data yet. */
  showPhaseNote?: boolean;
};

/**
 * Honest placeholder for modules that arrive in later phases.
 * Never populated with fake data by design.
 */
export function EmptyState({ title, message, icon = "sparkles", showPhaseNote = true }: EmptyStateProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-brand-200 bg-white p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink-900">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">
        {message}
      </p>
      {showPhaseNote && (
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-400">
          Coming in an upcoming phase
        </p>
      )}
    </div>
  );
}
