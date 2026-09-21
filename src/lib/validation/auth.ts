import { z } from "zod";

/** Indian mobile numbers, optionally +91-prefixed; stored normalized (10 digits). */
const mobileRegex = /^(\+?91)?[6-9]\d{9}$/;

export function normalizeMobile(input: string): string {
  // Strip spaces/dashes first so grouped formats like "+91 98765 43210" work,
  // then drop a leading 91 country code.
  const cleaned = input.replace(/[\s-]/g, "").replace(/^\+/, "");
  const digits = cleaned.replace(/[^\d]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Please enter your full name")
      .max(100, "Name is too long"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(5)
      .max(254)
      .email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .transform(normalizeMobile)
      .pipe(
        z
          .string()
          .regex(mobileRegex, "Enter a valid 10-digit mobile number"),
      ),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/** Identifier may be an email or a mobile number. */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your email or mobile number")
    .max(254)
    .transform((v) => (v.includes("@") ? v.toLowerCase() : v)),
  password: z.string().min(1, "Enter your password").max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes("@");
}
