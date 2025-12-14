/**
 * @file app/(main)/sewa/assets/[id]/page.test.tsx
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AssetDetailPage from "./page";
import { fetchData } from "@/lib/api";
import Swal from "sweetalert2";

jest.mock("@/lib/api", () => ({ fetchData: jest.fn() }));

// next/image -> <img>
jest.mock("next/image", () => (props: any) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={props.alt || "img"} {...props} />;
});

// router
const pushMock = jest.fn();
const backMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
}));

// toast
const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

// format
jest.mock("@/lib/format", () => ({
  formatCurrency: (n: number) => `Rp${n}`,
}));

// Sweetalert
jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

// lucide icons
jest.mock("lucide-react", () => ({
  Loader2: () => <span data-testid="icon-loader" />,
  Boxes: () => <span data-testid="icon-boxes" />,
  ShoppingCart: () => <span data-testid="icon-cart" />,
  ChevronLeft: () => <span data-testid="icon-back" />,
}));

// shadcn UI mocks
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, props);
    }
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

// AlertDialog mock: render jika open=true
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

describe("AssetDetailPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  test("menampilkan detail aset setelah fetch sukses", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce({
      id: "a1",
      categoryId: null,
      code: "AST-001",
      name: "Kamera Sony",
      specification: "4K",
      acquisitionDate: null,
      conditionNow: "BAIK",
      status: "TERSEDIA",
      dailyRate: "50000",
      stock: 3,
      photoUrl: "sony.jpg",
      createdAt: "x",
      updatedAt: "y",
      category: { id: "c1", name: "Elektronik" },
    });

    render(<AssetDetailPage params={{ id: "a1" }} />);

    expect(await screen.findByText("Kamera Sony")).toBeInTheDocument();
    expect(fetchData).toHaveBeenCalledWith("/assets/a1", { method: "GET" });
    expect(screen.getByText("#AST-001")).toBeInTheDocument();
    expect(screen.getByText("Stok: 3")).toBeInTheDocument();
    expect(screen.getByText(/Rp50000/i)).toBeInTheDocument();
  });

  test("qty di-clamp: tidak boleh > stock", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce({
      id: "a1",
      categoryId: null,
      code: "AST-001",
      name: "Kamera Sony",
      specification: null,
      acquisitionDate: null,
      conditionNow: "BAIK",
      status: "TERSEDIA",
      dailyRate: "50000",
      stock: 2,
      photoUrl: null,
      createdAt: "x",
      updatedAt: "y",
      category: null,
    });

    render(<AssetDetailPage params={{ id: "a1" }} />);

    await screen.findByText("Kamera Sony");
    const qtyInput = screen.getByRole("spinbutton"); // input number

    fireEvent.change(qtyInput, { target: { value: "999" } });
    expect((qtyInput as HTMLInputElement).value).toBe("2"); // max = stock
  });

  test("tambah ke keranjang sukses: buka dialog -> confirm -> POST /cart -> Swal -> router.push(/sewa)", async () => {
    (fetchData as jest.Mock).mockImplementation((url: string, opt?: any) => {
      if (url === "/assets/a1" && opt?.method === "GET") {
        return Promise.resolve({
          id: "a1",
          categoryId: null,
          code: "AST-001",
          name: "Kamera Sony",
          specification: null,
          acquisitionDate: null,
          conditionNow: "BAIK",
          status: "TERSEDIA",
          dailyRate: "50000",
          stock: 3,
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

    render(<AssetDetailPage params={{ id: "a1" }} />);

    await screen.findByText("Kamera Sony");

    fireEvent.click(screen.getByRole("button", { name: /Tambah ke Keranjang/i }));
    expect(screen.getByTestId("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Tambah ke Keranjang\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ya, Tambahkan/i }));

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/cart", {
        method: "POST",
        data: { itemType: "ASET", assetId: "a1", qty: 1, price: 50000 },
      });
    });

    expect(Swal.fire).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/sewa");
  });

  test("jika POST /cart gagal: tampil toast destructive", async () => {
    (fetchData as jest.Mock).mockImplementation((url: string, opt?: any) => {
      if (url === "/assets/a1" && opt?.method === "GET") {
        return Promise.resolve({
          id: "a1",
          categoryId: null,
          code: "AST-001",
          name: "Kamera Sony",
          specification: null,
          acquisitionDate: null,
          conditionNow: "BAIK",
          status: "TERSEDIA",
          dailyRate: "50000",
          stock: 3,
          photoUrl: null,
          createdAt: "x",
          updatedAt: "y",
          category: null,
        });
      }
      if (url === "/cart" && opt?.method === "POST") {
        return Promise.reject({ response: { data: { message: "Stok tidak cukup" } } });
      }
      return Promise.resolve({});
    });

    render(<AssetDetailPage params={{ id: "a1" }} />);

    await screen.findByText("Kamera Sony");
    fireEvent.click(screen.getByRole("button", { name: /Tambah ke Keranjang/i }));
    fireEvent.click(screen.getByRole("button", { name: /Ya, Tambahkan/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Gagal",
          description: "Stok tidak cukup",
          variant: "destructive",
        })
      );
    });
  });
});
