import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth";
import {
  RegisterFormErrors,
  RegisterFormValues,
  validateField,
  validateForm
} from "../utils/validation";

const initialValues: RegisterFormValues = {
  username: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: ""
};

type FieldConfig = {
  key: keyof RegisterFormValues;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
};

const fields: FieldConfig[] = [
  {
    key: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
    placeholder: "Enter username"
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    placeholder: "you@example.com"
  },
  {
    key: "mobile",
    label: "Mobile Number",
    type: "tel",
    autoComplete: "tel",
    placeholder: "04XX XXX XXX"
  },
  {
    key: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "Create password"
  },
  {
    key: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "Re-enter password"
  }
];

export default function RegisterForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const handleChange = (field: keyof RegisterFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const next = validateField(field, { ...values, [field]: value });
      setErrors((prev) => {
        const draft = { ...prev };
        if (!next) {
          delete draft[field];
        } else {
          draft[field] = next;
        }
        return draft;
      });
    }
  };

  const handleBlur = (field: keyof RegisterFormValues) => {
    const error = validateField(field, values);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const allErrors = validateForm(values);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await registerUser(values.email);
      navigate("/verify-email", {
        replace: true,
        state: { email: values.email.trim().toLowerCase() }
      });
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-brand backdrop-blur md:p-8"
    >
      <header className="mb-6 space-y-2">
        <h1 className="font-heading text-3xl font-bold text-brand-navy">Create your account</h1>
        <p className="font-body text-sm text-slate-600">
          Start your tax return with secure registration.
        </p>
      </header>

      <div className="space-y-4">
        {fields.map((field) => {
          const error = errors[field.key];
          return (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="mb-1 block font-body text-sm font-semibold text-brand-ink"
              >
                {field.label}
              </label>
              <input
                id={field.key}
                name={field.key}
                type={field.type}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(event) => handleChange(field.key, event.target.value)}
                onBlur={() => handleBlur(field.key)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${field.key}-error` : undefined}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm text-slate-900 outline-none transition focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20"
              />
              {error && (
                <p id={`${field.key}-error`} className="mt-1 font-body text-xs text-rose-600">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {formError && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-body text-sm text-rose-700">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || hasErrors}
        className="mt-6 w-full rounded-xl bg-brand-pink px-4 py-3 font-body text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating Account..." : "Register"}
      </button>
    </form>
  );
}

