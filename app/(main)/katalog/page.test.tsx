import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ServicesPage from "./page";
import { fetchData } from "@/lib/api";

// --- MOCKS ---
const pushMock = jest.fn();
const toastMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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
    const { src, alt, priority, fill, ...rest } = props;
    const resolved = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolved} alt={alt} {...rest} />;
  },
}));

jest.mock("lucide-react", () => ({
  Search: () => <span />,
  Package: () => <span />,
  Image: () => <span />,
  Info: () => <span />,
  ShoppingCart: () => <span />,
  CheckCircle2: () => <span />,
  Loader2: () => <span />,
}));

// UI minimal mocks (biar nggak ribet Radix/shadcn)
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, onClick, ...props }: any) => (
    <div data-testid="card" onClick={onClick} {...props}>
      {children}
    </div>
  ),
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

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
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

describe("Katalog Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // karena halaman pakai setInterval untuk hero
  });

  afterEach(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("load layanan: hanya yang aktif tampil, dan bisa search", async () => {
    (fetchData as jest.Mock).mockResolvedValue([
      {
        id: "s1",
        name: "Jasa Foto",
        description: "Foto event",
        unitRate: "10000",
        isActive: true,
        photoUrl: "",
        category: { id: "c1", name: "Fotografi" },
        Package: [],
      },
      {
        id: "s2",
        name: "Jasa Video",
        description: "Video company",
        unitRate: "20000",
        isActive: false, // harus tidak tampil
        photoUrl: "",
        category: { id: "c2", name: "Videografi" },
        Package: [],
      },
    ]);

    await act(async () => {
      render(<ServicesPage />);
    });

    // hanya s1 tampil
    expect(await screen.findByText("Jasa Foto")).toBeInTheDocument();
    expect(screen.queryByText("Jasa Video")).not.toBeInTheDocument();

    // search "foto" masih ada
    const searchInput = screen.getByPlaceholderText(/Cari layanan/i);
    fireEvent.change(searchInput, { target: { value: "foto" } });
    expect(screen.getByText("Jasa Foto")).toBeInTheDocument();

    // search "video" -> tidak ada hasil
    fireEvent.change(searchInput, { target: { value: "video" } });
    await waitFor(() => {
      expect(screen.queryByText("Jasa Foto")).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Tidak ada layanan ditemukan/i)).toBeInTheDocument();
  });

  test('klik tombol "Detail" memanggil router.push ke /katalog/detail?id=...', async () => {
    (fetchData as jest.Mock).mockResolvedValue([
      {
        id: "s1",
        name: "Jasa Foto",
        description: "Foto event",
        unitRate: "10000",
        isActive: true,
        photoUrl: "",
        category: { id: "c1", name: "Fotografi" },
        Package: [],
      },
    ]);

    await act(async () => {
      render(<ServicesPage />);
    });

    expect(await screen.findByText("Jasa Foto")).toBeInTheDocument();

    // tombol "Detail" ada di card
    fireEvent.click(screen.getByRole("button", { name: /Detail/i }));
    expect(pushMock).toHaveBeenCalledWith("/katalog/detail?id=s1");
  });
});
