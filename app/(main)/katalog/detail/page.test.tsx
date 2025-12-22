import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import ServiceDetailPage from "./page";
import { fetchData } from "@/lib/api";

const pushMock = jest.fn();
const toastMock = jest.fn();

// ✅ penting: router object harus STABIL (tidak bikin object baru tiap render)
const routerMock = { push: pushMock };

// mock useSearchParams agar bisa atur query param `id`
let searchId: string | null = "s1";

jest.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({
    get: (key: string) => (key === "id" ? searchId : null),
  }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // buang props khusus next/image biar gak warning DOM
    const { src, alt, fill, priority, ...rest } = props;
    const resolved = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolved} alt={alt} {...rest} />;
  },
}));

jest.mock("lucide-react", () => ({
  ArrowLeft: () => <span />,
  Package: () => <span />,
  Image: () => <span />,
  ShoppingCart: () => <span />,
  CheckCircle2: () => <span />,
  Calendar: () => <span />,
  Clock: () => <span />,
  User: () => <span />,
}));

// UI minimal mocks
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock("@/lib/format", () => ({
  formatCurrency: (n: number) => `Rp${n}`,
}));

describe("Katalog Detail Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchId = "s1";
  });

  test("kalau id null -> toast error dan redirect ke /katalog", async () => {
    searchId = null;

    await act(async () => {
      render(<ServiceDetailPage />);
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/katalog");
    });
  });

  test("render detail + Pesan Sekarang buka dialog + Tambah ke Keranjang", async () => {
    (fetchData as jest.Mock).mockImplementation((url: string) => {
      if (url === "/services/s1") {
        return Promise.resolve({
          id: "s1",
          name: "Jasa Foto",
          description: "Foto event",
          unitRate: "10000",
          isActive: true,
          photoUrl: "",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-02T00:00:00.000Z",
          category: { id: "c1", name: "Fotografi" },
          Package: [
            {
              id: "p1",
              name: "Paket Basic",
              description: "Basic",
              unitRate: "15000",
              features: ["2 jam"],
              createdAt: "",
              updatedAt: "",
            },
          ],
        });
      }

      if (url === "/cart") {
        return Promise.resolve({ message: "OK" });
      }

      return Promise.resolve({});
    });

    await act(async () => {
      render(<ServiceDetailPage />);
    });

    // tunggu detail load
    expect(await screen.findByText("Jasa Foto")).toBeInTheDocument();
    expect(screen.getByText("Fotografi")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Pesan Sekarang/i }));
    });

    expect(await screen.findByText(/Konfirmasi Pesanan/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tambah ke Keranjang/i }));
    });

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/cart", expect.anything());
      expect(toastMock).toHaveBeenCalled();
    });
  });
});
