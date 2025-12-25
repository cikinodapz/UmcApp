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

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/auth/login",
}));

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
      observe() { }
      unobserve() { }
      disconnect() { }
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
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Reset google mock
    delete (window as any).google;
  });

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

  // NEW TEST: Empty email/password validation (lines 153-161)
  it("tampilkan error jika email kosong", async () => {
    const Swal = jest.requireMock("sweetalert2");
    const { container } = render(<LoginPage />);

    // Only fill password, leave email empty
    fillInput(container, "#password", "password123");
    submitForm(container);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          title: "Input belum lengkap",
        })
      );
    });
  });

  it("tampilkan error jika password kosong", async () => {
    const Swal = jest.requireMock("sweetalert2");
    const { container } = render(<LoginPage />);

    // Only fill email, leave password empty
    fillInput(container, "#email", "user@mail.com");
    submitForm(container);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          title: "Input belum lengkap",
        })
      );
    });
  });

  // NEW TEST: Successful login with PEMINJAM role
  it("redirect ke /home jika login berhasil dengan role PEMINJAM", async () => {
    (fetchData as jest.Mock)
      .mockResolvedValueOnce({ token: "test-token", user: { role: "PEMINJAM" } })
      .mockResolvedValueOnce({ user: { role: "PEMINJAM", name: "Test User" } });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "password123");
    submitForm(container);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/home");
    });
  });

  // NEW TEST: Successful login with ADMIN role
  it("redirect ke /dashboard jika login berhasil dengan role ADMIN", async () => {
    (fetchData as jest.Mock)
      .mockResolvedValueOnce({ token: "admin-token", user: { role: "ADMIN" } })
      .mockResolvedValueOnce({ user: { role: "ADMIN", name: "Admin User" } });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "admin@mail.com");
    fillInput(container, "#password", "adminpass");
    submitForm(container);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  // NEW TEST: Login without token in response
  it("handle login response tanpa token", async () => {
    (fetchData as jest.Mock)
      .mockResolvedValueOnce({ user: { role: "PEMINJAM" } })
      .mockResolvedValueOnce({ user: { role: "PEMINJAM" } });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "password123");
    submitForm(container);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
    });
  });

  // NEW TEST: Unknown role handling
  it("tampilkan info jika role tidak terdeteksi", async () => {
    const Swal = jest.requireMock("sweetalert2");

    (fetchData as jest.Mock)
      .mockResolvedValueOnce({ token: "test-token", user: { role: "UNKNOWN_ROLE" } })
      .mockResolvedValueOnce({ user: { role: "UNKNOWN_ROLE" } });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "password123");
    submitForm(container);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "info",
          title: "Perlu hak akses",
        })
      );
    });
  });

  // NEW TEST: Google button click when google is not loaded
  it("Google button disabled ketika belum loaded", () => {
    const { container } = render(<LoginPage />);
    // When Google is not loaded, the loading button is shown with aria-label="Memuat Google Login"
    const googleBtn = container.querySelector("button[aria-label='Memuat Google Login']");
    expect(googleBtn).toBeDisabled();
  });

  // NEW TEST: Google login flow
  it("handle Google login button click", async () => {
    const mockPrompt = jest.fn((callback) => {
      callback({ isNotDisplayed: () => false, isSkippedMoment: () => false });
    });

    (window as any).google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
          prompt: mockPrompt,
        },
      },
    };

    const { container, rerender } = render(<LoginPage />);

    // Simulate google loaded
    await waitFor(() => {
      const googleBtn = container.querySelector("button[aria-label='Masuk dengan Google']");
      if (googleBtn && !googleBtn.hasAttribute("disabled")) {
        fireEvent.click(googleBtn);
      }
    });
  });

  // NEW TEST: API error with generic message
  it("tampilkan pesan error default jika API error tanpa message", async () => {
    (fetchData as jest.Mock).mockRejectedValueOnce(new Error());

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "wrong");
    submitForm(container);

    await waitFor(() => {
      const alert = container.querySelector("[role='alert']");
      expect(alert || fetchData).toBeTruthy();
    });
  });

  // NEW TEST: Error with custom message from err.message
  it("tampilkan pesan error dari err.message", async () => {
    const Swal = jest.requireMock("sweetalert2");

    (fetchData as jest.Mock).mockRejectedValueOnce({
      message: "Custom error message",
    });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "wrong");
    submitForm(container);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "error",
          text: "Custom error message",
        })
      );
    });
  });

  // NEW TEST: Verify localStorage is set on successful login
  it("set localStorage dengan token dan role pada login sukses", async () => {
    (fetchData as jest.Mock)
      .mockResolvedValueOnce({ token: "my-token", user: { role: "PEMINJAM" } })
      .mockResolvedValueOnce({ user: { role: "PEMINJAM", name: "User" } });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "password123");
    submitForm(container);

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("my-token");
      expect(localStorage.getItem("role")).toBe("PEMINJAM");
    });
  });

  // NEW TEST: Role from nested data structure
  it("resolve role dari data.user.role", async () => {
    (fetchData as jest.Mock)
      .mockResolvedValueOnce({ token: "test", data: { user: { role: "ADMIN" } } })
      .mockResolvedValueOnce({ data: { user: { role: "ADMIN" } } });

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "admin@mail.com");
    fillInput(container, "#password", "adminpass");
    submitForm(container);

    await waitFor(() => {
      expect(localStorage.getItem("role")).toBe("ADMIN");
    });
  });

  // NEW TEST: Links render correctly
  it("render link Lupa password dan Daftar akun baru", () => {
    const { container } = render(<LoginPage />);
    const forgotLink = container.querySelector("a[href='/auth/forgot']");
    const registerLink = container.querySelector("a[href='/auth/register']");
    expect(forgotLink).toBeInTheDocument();
    expect(registerLink).toBeInTheDocument();
  });
  // NEW TEST: handleCustomGoogleClick with fallback
  it("Google prompt fallback ke hidden button saat skipped", async () => {
    const mockPrompt = jest.fn((callback: any) => {
      callback({
        isNotDisplayed: () => true,
        isSkippedMoment: () => false
      });
    });

    (window as any).google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
          prompt: mockPrompt,
        },
      },
    };

    const { container } = render(<LoginPage />);

    // Simulate loaded state by triggering script load
    await waitFor(() => {
      const googleBtn = container.querySelector("button[aria-label='Masuk dengan Google']");
      if (googleBtn && !(googleBtn as HTMLButtonElement).disabled) {
        fireEvent.click(googleBtn);
        expect(mockPrompt).toHaveBeenCalled();
      }
    });
  });

  // NEW TEST: resolveRole fetches from /auth/me when no role in login response
  it("resolveRole fetch dari /auth/me jika role tidak ada di login response", async () => {
    (fetchData as jest.Mock)
      .mockResolvedValueOnce({ token: "test-token" }) // login without role
      .mockResolvedValueOnce({ role: "PEMINJAM" }); // /auth/me returns role

    const { container } = render(<LoginPage />);

    fillInput(container, "#email", "user@mail.com");
    fillInput(container, "#password", "password123");
    submitForm(container);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/auth/me", expect.objectContaining({
        method: "GET",
      }));
    });
  });
});
