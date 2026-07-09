import { ResumeSchema, type Resume } from "./schema";
import { ZodError } from "zod";

export type ValidationError = {
  path: string;
  message: string;
  code: string;
};

export type ValidationResult =
  | { ok: true; data: Resume }
  | { ok: false; errors: ValidationError[] };

function flattenZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
    code: issue.code,
  }));
}

export function validate(input: unknown): ValidationResult {
  const parsed = ResumeSchema.safeParse(input);

  if (!parsed.success) {
    const errors = flattenZodErrors(parsed.error);

    // ponytail: single-pass categorization from flattened errors
    const missing = errors.filter((e) => e.code === "invalid_type" && e.message.includes("Required"));
    const invalid = errors.filter((e) => !missing.includes(e));

    const all: ValidationError[] = [
      ...missing.map((e) => ({ ...e, message: `Missing required property: ${e.path}` })),
      ...invalid,
    ];

    return { ok: false, errors: all };
  }

  return { ok: true, data: parsed.data };
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((e) => `  - ${e.path}: ${e.message} (${e.code})`)
    .join("\n");
}
