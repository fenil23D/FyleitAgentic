import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <App />
    </MemoryRouter>
  );
}

describe("US-001 register account", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows inline field errors when submitting invalid form", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText("Username is required.")).toBeInTheDocument();
    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(await screen.findByText("Mobile number is required.")).toBeInTheDocument();
    expect(await screen.findByText("Password is required.")).toBeInTheDocument();
    expect(await screen.findByText("Please confirm your password.")).toBeInTheDocument();
  });

  it("shows inline mismatch error when confirm password differs", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/username/i), "fenil");
    await user.type(screen.getByLabelText(/^email$/i), "fenil@example.com");
    await user.type(screen.getByLabelText(/mobile number/i), "0412 345 678");
    await user.type(screen.getByLabelText(/^password$/i), "Strong@123");
    await user.type(screen.getByLabelText(/confirm password/i), "Mismatch@123");

    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("prevents duplicate email and shows required message", async () => {
    const user = userEvent.setup();
    localStorage.setItem("fyle_registered_emails", JSON.stringify(["fenil@example.com"]));
    renderRegister();

    await user.type(screen.getByLabelText(/username/i), "fenil");
    await user.type(screen.getByLabelText(/^email$/i), "fenil@example.com");
    await user.type(screen.getByLabelText(/mobile number/i), "0412 345 678");
    await user.type(screen.getByLabelText(/^password$/i), "Strong@123");
    await user.type(screen.getByLabelText(/confirm password/i), "Strong@123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(
      await screen.findByText("An account with this email already exists.")
    ).toBeInTheDocument();
  });

  it("redirects to verify email page after successful registration", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/username/i), "fenil");
    await user.type(screen.getByLabelText(/^email$/i), "fresh@example.com");
    await user.type(screen.getByLabelText(/mobile number/i), "0412 345 678");
    await user.type(screen.getByLabelText(/^password$/i), "Strong@123");
    await user.type(screen.getByLabelText(/confirm password/i), "Strong@123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText(/verify your email/i)).toBeInTheDocument();
    expect(screen.getByText(/fresh@example.com/i)).toBeInTheDocument();
  });

  it("rejects invalid australian mobile format", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/username/i), "fenil");
    await user.type(screen.getByLabelText(/^email$/i), "fenil@example.com");
    await user.type(screen.getByLabelText(/mobile number/i), "123456");
    await user.type(screen.getByLabelText(/^password$/i), "Strong@123");
    await user.type(screen.getByLabelText(/confirm password/i), "Strong@123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(
      await screen.findByText("Mobile number must be in Australian format, e.g. 04XX XXX XXX.")
    ).toBeInTheDocument();
  });
});

