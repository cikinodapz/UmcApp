/**
 * @file app/(main)/sewa/services/[id]/page.test.tsx
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ServiceDetailPage from "./[id]/page";
import { fetchData } from "@/lib/api";
import Swal from "sweetalert2";

jest.mock("@/lib/api", () => ({ fetchData: jest.fn() }));

jest.mock("next/image", () => (props: any) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={props.alt || "img"} {...rest} />;
});

const pushMock = jest.fn();
const backMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
}));

const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock("@/lib/format", () => ({
  formatCurrency: (n: number) => `Rp${n}`,
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <span data-testid="icon-loader" />,
  Wrench: () => <span data-testid="icon-wrench" />,
  ShoppingCart: () => <span data-testid="icon-cart" />,
  ChevronLeft: () => <span data-testid="icon-back" />,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) return React.cloneElement(children, props);
    return <button {...props}>{children}</button>;
  },
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  CardDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: any) => (open ? <div data-testid="alertdialog">{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe("ServiceDetailPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  test("render detail jasa setelah fetch sukses", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce({
      id: "s1",
      categoryId: null,
      code: "SRV-001",
      name: "Jasa Fotografi",
      description: "Untuk event",
      unitRate: "200000",
      isActive: true,
      photoUrl: null,
      createdAt: "x",
      updatedAt: "y",
      category: { id: "c2", name: "Kreatif" },
    });

    render(<ServiceDetailPage params={{ id: "s1" }} />);
    expect(await screen.findByText("Jasa Fotografi")).toBeInTheDocument();
    expect(fetchData).toHaveBeenCalledWith("/services/s1", { method: "GET" });
    expect(screen.getByText("#SRV-001")).toBeInTheDocument();
    expect(screen.getByText(/Rp200000/i)).toBeInTheDocument();
  });

  test("button tambah disabled jika jasa nonaktif", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce({
      id: "s1",
      categoryId: null,
      code: "SRV-001",
      name: "Jasa Fotografi",
      description: "Untuk event",
      unitRate: "200000",
      isActive: false,
      photoUrl: null,
      createdAt: "x",
      updatedAt: "y",
      category: null,
    });

    render(<ServiceDetailPage params={{ id: "s1" }} />);
    await screen.findByText("Jasa Fotografi");

    const btn = screen.getByRole("button", { name: /Tambah ke Keranjang/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Jasa ini sedang tidak aktif/i)).toBeInTheDocument();
  });

  test("tambah ke keranjang sukses (JASA): dialog -> POST /cart -> Swal -> push /sewa", async () => {
    (fetchData as jest.Mock).mockImplementation((url: string, opt?: any) => {
      if (url === "/services/s1" && opt?.method === "GET") {
        return Promise.resolve({
          id: "s1",
          categoryId: null,
          code: "SRV-001",
          name: "Jasa Fotografi",
          description: "Untuk event",
          unitRate: "200000",
          isActive: true,
          photoUrl: null,
          createdAt: "x",
          updatedAt: "y",
          category: null,
        });
      }
      if (url === "/cart" && opt?.method === "POST") {
        return Promise.resolve({ message: "ok", cartItem: {} });
      }
      return Promise.resolve({});
    });

    render(<ServiceDetailPage params={{ id: "s1" }} />);
    await screen.findByText("Jasa Fotografi");

    fireEvent.click(screen.getByRole("button", { name: /Tambah ke Keranjang/i }));
    expect(screen.getByTestId("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ya, Tambahkan/i }));

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/cart", {
        method: "POST",
        data: { itemType: "JASA", serviceId: "s1", qty: 1, price: 200000 },
      });
    });

    expect(Swal.fire).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/sewa");
  });
});
