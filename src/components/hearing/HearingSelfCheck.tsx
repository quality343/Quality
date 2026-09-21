"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Button, Icon } from "@/components/ui";

/**
 * "Signs to look out for" self-check.
 *
 * This is deliberately NOT a hearing test and says so, in the heading, the
 * intro and the result. It collects nothing, sends nothing and stores nothing —
 * it is a prompt to think about symptoms and to book a real assessment. That
 * distinction matters both ethically and for the brand: a website must never
 * imply it has diagnosed someone.
 *
 * Built on native checkboxes so keyboard and screen-reader behaviour is the
 * platform's, not a reimplementation of it.
 */

const SIGNS: { id: string; text: string }[] = [
  { id: "repeat", text: "You often ask people to repeat themselves" },
  { id: "volume", text: "Others say your TV or phone volume is too high" },
  { id: "crowds", text: "Restaurants, family gatherings or crowds feel exhausting" },
  { id: "phone", text: "Following a conversation on the phone is difficult" },
  { id: "tinnitus", text: "You notice ringing, buzzing or hissing in your ears" },
  { id: "muffled", text: "Speech often sounds muffled, or you hear but can't make out words" },
  { id: "clinic", text: "You've been told your hearing should be checked" },
];

export function HearingSelfCheck() {
  const groupId = useId();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const count = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-start lg:gap-12">
      {/* ── The checklist ─────────────────────────────────────────────── */}
      <fieldset>
        <legend className="sr-only">Signs that may point to a hearing difficulty</legend>
        <ul className="space-y-2.5">
          {SIGNS.map((sign) => {
            const inputId = `${groupId}-${sign.id}`;
            const isOn = Boolean(checked[sign.id]);
            return (
              <li key={sign.id}>
                <label
                  htmlFor={inputId}
                  className={`group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
                    isOn
                      ? "border-brand-300 bg-brand-50 shadow-card"
                      : "border-border bg-surface hover:border-brand-200 hover:bg-brand-50/40"
                  }`}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggle(sign.id)}
                    className="peer sr-only"
                  />
                  {/* Visual checkbox — 24px, comfortably tappable via the label. */}
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                      isOn
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-border bg-surface text-transparent group-hover:border-brand-300"
                    } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600`}
                  >
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  <span className="text-[0.95rem] leading-relaxed text-ink-700">{sign.text}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* ── Result panel (aria-live so it is announced on change) ─────── */}
      <div
        className="rounded-3xl border border-border bg-surface p-7 shadow-card sm:p-8 lg:sticky lg:top-24"
        aria-live="polite"
      >
        <p className="eyebrow text-brand-700">Your selection</p>
        <p className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-900">
          {count}
          <span className="ml-2 text-base font-medium text-ink-400">
            {count === 1 ? "sign selected" : "signs selected"}
          </span>
        </p>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-[width] duration-500"
            style={{ width: `${(count / SIGNS.length) * 100}%` }}
          />
        </div>

        <p className="mt-6 text-sm leading-relaxed text-ink-600">
          {count === 0
            ? "Nothing selected yet. Tick anything you recognise — there's no wrong answer, and nothing is sent anywhere."
            : count === 1
              ? "One sign on its own is rarely anything to worry about. If it's new or getting worse, it's still worth a check."
              : "Several of these together are a good reason to have your hearing assessed properly. A hearing assessment is quick and painless."}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Button href="/book-appointment" size="lg" className="btn-lift w-full justify-center">
            <Icon name="calendar" className="h-5 w-5" />
            Book a Hearing Assessment
          </Button>
          <Button
            href="/hearing-tests"
            variant="secondary"
            size="lg"
            className="btn-lift w-full justify-center"
          >
            What a test involves
          </Button>
        </div>

        <p className="mt-6 rounded-xl bg-surface-muted p-4 text-xs leading-relaxed text-ink-500">
          This checklist is general information only — it is <strong>not</strong> a hearing
          test and cannot diagnose anything. Only a hearing assessment carried out in
          person can tell you how well you hear. Visit{" "}
          <Link href="/hearing-tests" className="font-semibold text-brand-700 hover:underline">
            hearing tests
          </Link>{" "}
          to see what is involved.
        </p>
      </div>
    </div>
  );
}
