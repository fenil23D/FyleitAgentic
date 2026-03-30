export type RegisterFormValues = {
  username: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_AU_REGEX = /^04\d{2}\s?\d{3}\s?\d{3}$/;
const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;

export function validateField(
  field: keyof RegisterFormValues,
  values: RegisterFormValues
): string | undefined {
  const value = values[field].trim();

  if (field === "username" && value.length === 0) {
    return "Username is required.";
  }

  if (field === "email") {
    if (!value) return "Email is required.";
    if (!EMAIL_REGEX.test(value)) return "Please enter a valid email address.";
  }

  if (field === "mobile") {
    if (!value) return "Mobile number is required.";
    if (!MOBILE_AU_REGEX.test(value)) {
      return "Mobile number must be in Australian format, e.g. 04XX XXX XXX.";
    }
  }

  if (field === "password") {
    if (!value) return "Password is required.";
    if (!PASSWORD_COMPLEXITY_REGEX.test(values.password)) {
      return "Password must be 8+ chars, include 1 uppercase, 1 number, and 1 special character.";
    }
  }

  if (field === "confirmPassword") {
    if (!values.confirmPassword.trim()) return "Please confirm your password.";
    if (values.confirmPassword !== values.password) {
      return "Passwords do not match.";
    }
  }

  return undefined;
}

export function validateForm(values: RegisterFormValues): RegisterFormErrors {
  const fields: Array<keyof RegisterFormValues> = [
    "username",
    "email",
    "mobile",
    "password",
    "confirmPassword"
  ];

  return fields.reduce<RegisterFormErrors>((errors, field) => {
    const error = validateField(field, values);
    if (error) {
      errors[field] = error;
    }
    return errors;
  }, {});
}

