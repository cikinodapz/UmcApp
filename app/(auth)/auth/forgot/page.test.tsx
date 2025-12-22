import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("next/link", () => {
  return function Link({ href, children }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("sweetalert2", () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
}));

jest.mock("next/navigation", () => {
  const push = jest.fn();
  const replace = jest.fn();
  const refresh = jest.fn();
  const back = jest.fn();
  const prefetch = jest.fn();
  return {
    useRouter: () => ({ push, replace, refresh, back, prefetch }),
    __router: { push, replace, refresh, back, prefetch },
    useSearchParams: () => new URLSearchParams(""),
    usePathname: () => "/auth/forgot",
  };
});

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}));

import ForgotPage from "./page";
import { fetchData } from "@/lib/api";

describe("ForgotPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("render halaman forgot password (smoke test)", () => {
    const { container } = render(<ForgotPage />);
    expect(container.querySelectorAll("input").length).toBeGreaterThan(0);
  });

  it("submit forgot password memanggil API", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce({ message: "ok" });

    const { container } = render(<ForgotPage />);
    const email = container.querySelector("input") as HTMLInputElement;

    fireEvent.change(email, { target: { value: "user@mail.com" } });
    fireEvent.click(container.querySelector("button[type='submit']") as HTMLButtonElement);

    await waitFor(() => expect(fetchData).toHaveBeenCalled());
  });

  it("jika API error, tampilkan Alert error", async () => {
    (fetchData as jest.Mock).mockRejectedValueOnce(new Error("Gagal kirim reset link"));

    const { container } = render(<ForgotPage />);
    const email = container.querySelector("input") as HTMLInputElement;

    fireEvent.change(email, { target: { value: "user@mail.com" } });
    fireEvent.click(container.querySelector("button[type='submit']") as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Gagal kirim reset link/i);
    });
  });
});
