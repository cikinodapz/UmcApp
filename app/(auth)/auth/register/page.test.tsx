import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  return function Link({ href, children }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("next/image", () => {
  return function Image(props: any) {
    const { src, alt, fill, priority, ...rest } = props;
    const resolvedSrc =
      typeof src === "string" ? src : src?.src ? src.src : "";
    return <img src={resolvedSrc} alt={alt ?? ""} {...rest} />;
  };
});

jest.mock("sweetalert2", () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/auth/register",
}));

jest.mock("@/hooks/use-toast", () => {
  const toast = jest.fn();
  return { useToast: () => ({ toast }), __toast: toast };
});

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}));

import RegisterPage from "./page";
import { fetchData } from "@/lib/api";

function setValueById(container: HTMLElement, id: string, value: string) {
  const el = container.querySelector(id) as HTMLInputElement | null;
  if (!el) return;
  fireEvent.change(el, { target: { value } });
}

function submit(container: HTMLElement) {
  const form = container.querySelector("form") as HTMLFormElement | null;
  if (form) fireEvent.submit(form);
}

describe("RegisterPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("render halaman register (smoke)", () => {
    const { container } = render(<RegisterPage />);
    expect(container.querySelector("#name")).toBeInTheDocument();
    expect(container.querySelector("#email")).toBeInTheDocument();
  });

  it("submit register memanggil fetchData", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce({ message: "ok" });

    const { container } = render(<RegisterPage />);

    // sesuai DOM kamu: #name, #email, #phone kemungkinan ada
    setValueById(container, "#name", "Syauqi");
    setValueById(container, "#email", "user@mail.com");
    setValueById(container, "#phone", "08123456789");

    // password + confirm (id bisa beda, jadi fallback: isi semua input[type=password])
    const pw = Array.from(
      container.querySelectorAll("input[type='password']")
    ) as HTMLInputElement[];
    if (pw[0]) fireEvent.change(pw[0], { target: { value: "password123" } });
    if (pw[1]) fireEvent.change(pw[1], { target: { value: "password123" } });

    submit(container);

    await waitFor(() => expect(fetchData).toHaveBeenCalled());
  });

  it("jika API error, muncul alert atau toast", async () => {
    const { __toast } = jest.requireMock("@/hooks/use-toast");

    (fetchData as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: "Register gagal" } },
    });

    const { container } = render(<RegisterPage />);

    setValueById(container, "#name", "Syauqi");
    setValueById(container, "#email", "user@mail.com");
    setValueById(container, "#phone", "08123456789");

    const pw = Array.from(
      container.querySelectorAll("input[type='password']")
    ) as HTMLInputElement[];
    if (pw[0]) fireEvent.change(pw[0], { target: { value: "password123" } });
    if (pw[1]) fireEvent.change(pw[1], { target: { value: "password123" } });

    submit(container);

    await waitFor(() => {
      const hasToast = __toast.mock.calls.length > 0;
      const hasAlert = !!document.querySelector("[role='alert']");
      expect(hasToast || hasAlert).toBe(true);
    });
  });
});
