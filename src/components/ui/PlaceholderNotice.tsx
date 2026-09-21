import { Badge } from "./Badge";

type PlaceholderNoticeProps = {
  /** Short label of the planned module, e.g. "Blog CMS". */
  module: string;
  /** Roadmap phase when the module is scheduled. */
  phase?: string;
  /** One-line description of what the module will do. */
  children?: React.ReactNode;
};

export function PlaceholderNotice({
  module,
  phase,
  children,
}: PlaceholderNoticeProps) {
  return (
    <section
      aria-label={`${module} — planned module`}
      className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-6 sm:p-8"
    >
      <Badge tone="neutral">Planned module</Badge>
      <h2 className="mt-3 text-lg font-semibold text-ink-900">{module}</h2>
      {children ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">{children}</p>
      ) : null}
      {phase ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand-700">
          Scheduled: {phase}
        </p>
      ) : null}
    </section>
  );
}
