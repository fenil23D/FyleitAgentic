const EMAILS_STORAGE_KEY = "fyle_registered_emails";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getRegisteredEmails(): string[] {
  try {
    const raw = localStorage.getItem(EMAILS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setRegisteredEmails(emails: string[]): void {
  localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(emails));
}

export async function registerUser(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const existing = getRegisteredEmails();

  if (existing.includes(normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  setRegisteredEmails([...existing, normalizedEmail]);
}

