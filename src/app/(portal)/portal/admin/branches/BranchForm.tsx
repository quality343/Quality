"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { branchUpsertAction } from "../../actions-org";
import type { ActionResult } from "../../actions-scheduling";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelClass = "text-xs font-semibold text-ink-700";
const hintClass = "mt-1 text-xs text-ink-500";

export type ClinicFormValues = {
  id: string;
  code: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  acceptsOnlineBookings: boolean;
  homeConsultationsEnabled: boolean;
  homeConsultationNote: string | null;
  homeServiceAreas: string | null;
  homeMaxPerDay: number | null;
};

/**
 * Clinic information form. QUALITY Hearing Care publishes ONE clinic, so this
 * edits the existing record rather than creating branches.
 */
export function BranchForm({ clinic }: { clinic: ClinicFormValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);

  function onSubmit(formData: FormData) {
    const raw = {
      id: clinic.id,
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      city: String(formData.get("city") ?? ""),
      address: String(formData.get("address") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      isActive: formData.get("isActive") === "on",
      acceptsOnlineBookings: formData.get("acceptsOnlineBookings") === "on",
      homeConsultationsEnabled: formData.get("homeConsultationsEnabled") === "on",
      homeConsultationNote: String(formData.get("homeConsultationNote") ?? ""),
      homeServiceAreas: String(formData.get("homeServiceAreas") ?? ""),
      homeMaxPerDay: String(formData.get("homeMaxPerDay") ?? ""),
    };
    startTransition(async () => {
      const res = await branchUpsertAction(raw);
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="mt-4 space-y-4" aria-label="Clinic information">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink-900">Clinic details</legend>
        <div>
          <label htmlFor={`clinic-name-${clinic.id}`} className={labelClass}>
            Clinic name
          </label>
          <input
            id={`clinic-name-${clinic.id}`}
            name="name"
            required
            maxLength={120}
            defaultValue={clinic.name}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`clinic-code-${clinic.id}`} className={labelClass}>
            Internal code
          </label>
          <input
            id={`clinic-code-${clinic.id}`}
            name="code"
            required
            maxLength={20}
            defaultValue={clinic.code}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`clinic-city-${clinic.id}`} className={labelClass}>
            City
          </label>
          <input
            id={`clinic-city-${clinic.id}`}
            name="city"
            maxLength={80}
            defaultValue={clinic.city ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`clinic-address-${clinic.id}`} className={labelClass}>
            Address
          </label>
          <textarea
            id={`clinic-address-${clinic.id}`}
            name="address"
            rows={3}
            maxLength={300}
            defaultValue={clinic.address ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`clinic-phone-${clinic.id}`} className={labelClass}>
            Phone
          </label>
          <input
            id={`clinic-phone-${clinic.id}`}
            name="phone"
            maxLength={20}
            defaultValue={clinic.phone ?? ""}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-ink-900">Website visibility</legend>
        <label htmlFor={`clinic-active-${clinic.id}`} className="flex items-start gap-3">
          <input
            id={`clinic-active-${clinic.id}`}
            name="isActive"
            type="checkbox"
            defaultChecked={clinic.isActive}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium text-ink-800">
              Show this clinic on the website
            </span>
            <span className={hintClass}>
              Unchecked hides it from the public site and from booking.
            </span>
          </span>
        </label>
        <label
          htmlFor={`clinic-online-${clinic.id}`}
          className="flex items-start gap-3"
        >
          <input
            id={`clinic-online-${clinic.id}`}
            name="acceptsOnlineBookings"
            type="checkbox"
            defaultChecked={clinic.acceptsOnlineBookings}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium text-ink-800">
              Accept online appointment bookings
            </span>
            <span className={hintClass}>
              When off, visitors are asked to call the clinic instead.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-3 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-ink-900">Home consultation</legend>
        <label
          htmlFor={`clinic-home-${clinic.id}`}
          className="flex items-start gap-3"
        >
          <input
            id={`clinic-home-${clinic.id}`}
            name="homeConsultationsEnabled"
            type="checkbox"
            defaultChecked={clinic.homeConsultationsEnabled}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium text-ink-800">
              Offer home consultations
            </span>
            <span className={hintClass}>
              Requests are always marked “requires clinic confirmation”.
            </span>
          </span>
        </label>
        <div>
          <label htmlFor={`clinic-home-areas-${clinic.id}`} className={labelClass}>
            Service areas (optional)
          </label>
          <input
            id={`clinic-home-areas-${clinic.id}`}
            name="homeServiceAreas"
            maxLength={500}
            defaultValue={clinic.homeServiceAreas ?? ""}
            placeholder="e.g. Kukatpally, KPHB, Miyapur"
            className={inputClass}
          />
          <p className={hintClass}>
            Leave blank until the clinic confirms areas — the site will not claim a
            radius.
          </p>
        </div>
        <div>
          <label htmlFor={`clinic-home-max-${clinic.id}`} className={labelClass}>
            Maximum home visits per day (optional)
          </label>
          <input
            id={`clinic-home-max-${clinic.id}`}
            name="homeMaxPerDay"
            type="number"
            min={1}
            max={200}
            defaultValue={clinic.homeMaxPerDay ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`clinic-home-note-${clinic.id}`} className={labelClass}>
            Note shown with home consultation (optional)
          </label>
          <input
            id={`clinic-home-note-${clinic.id}`}
            name="homeConsultationNote"
            maxLength={300}
            defaultValue={clinic.homeConsultationNote ?? ""}
            className={inputClass}
          />
        </div>
      </fieldset>

      {result && !result.ok ? (
        <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {result.error}
        </p>
      ) : null}
      {result?.ok ? (
        <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {result.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save clinic information"}
      </Button>
    </form>
  );
}
