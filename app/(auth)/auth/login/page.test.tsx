import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, waitFor } from "@testing-library/react";

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

jest.mock("next/navigation", () => {
  const push = jest.fn();
  return {
    useRouter: () => ({ push }),
    useSearchParams: () => new URLSearchParams(""),
    usePathname: () => "/auth/login",
  };
});

jest.mock("@/hooks/use-toast", () => {
  const toast = jest.fn();
  return { useToast: () => ({ toast }), __toast: toast };
});

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}));

import LoginPage from "./page";
import { fetchData } from "@/lib/api";

function polyfill() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });

  // @ts-ignore
  global.ResizeObserver =
    // @ts-ignore
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
}

function fillInput(container: HTMLElement, selector: string, value: string) {
  const el = container.querySelector(selector) as HTMLInputElement | null;
  if (!el) return;
  fireEvent.change(el, { target: { value } });
}

function submitForm(container: HTMLElement) {
  const form = container.querySelector("form") as HTMLFormElement | null;
  if (form) fireEvent.submit(form);
  else {
    const btn = container.querySelector(
      "button[type='submit']"
    ) as HTMLButtonElement | null;
    if (btn) fireEvent.click(btn);
  }
}

describe("LoginPage", () => {
  beforeAll(() => polyfill());
  beforeEach(() => jest.clearAllMocks());

  it("render halaman login (smoke)", () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector("#email")).toBeInTheDocument();
    expect(container.querySelector("#password")).toBeInTheDocument();
  });

  it("submit login memanggil fetchData", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce({ message: "ok" });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "password123");

    submitForm(container);

    await waitFor(() => expect(fetchData).toHaveBeenCalled());
  });

  it("jika API error, tampilkan toast ATAU alert (tergantung implementasi)", async () => {
    const { __toast } = jest.requireMock("@/hooks/use-toast");

    (fetchData as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: "Login gagal" } },
    });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "wrong");

    submitForm(container);

    await waitFor(() => {
      const hasToast = __toast.mock.calls.length > 0;
      const hasAlert = !!document.querySelector("[role='alert']");
      expect(hasToast || hasAlert).toBe(true);
    });
  });
});
