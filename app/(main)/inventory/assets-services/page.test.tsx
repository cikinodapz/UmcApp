import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import InventoryPage from "./page";
import { useAuth } from "@/contexts/auth-context";
import { fetchData } from "@/lib/api";
import { Role } from "@/types";

jest.mock("@/contexts/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api", () => ({ fetchData: jest.fn() }));

jest.mock("sweetalert2", () => ({
  fire: jest.fn().mockResolvedValue({}),
}));

jest.mock("next/image", () => (props: any) => {
  const { src, alt, ...rest } = props;
  const resolvedSrc = typeof src === "string" ? src : src?.src ?? "";
  return <img src={resolvedSrc} alt={alt} {...rest} />;
});

jest.mock("lucide-react", () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Search: () => <span data-testid="icon-search" />,
  Edit: () => <span data-testid="icon-edit" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Eye: () => <span data-testid="icon-eye" />,
  Package: () => <span data-testid="icon-package" />,
  Loader2: () => <span data-testid="icon-loader" />,
  ChevronsLeft: () => <span data-testid="icon-cl" />,
  ChevronLeft: () => <span data-testid="icon-l" />,
  ChevronRight: () => <span data-testid="icon-r" />,
  ChevronsRight: () => <span data-testid="icon-cr" />,
}));

// UI mocks (biar test tidak ribet dengan Radix/shadcn)
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <button data-testid={`tab-${value}`}>{children}</button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`content-${value}`}>{children}</div>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <div data-value={value}>{children}</div>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// DataTable mock: render list sederhana + render kolom actions kalau ada
jest.mock("@/components/data-table", () => ({
  DataTable: ({ data, columns }: any) => (
    <div data-testid="mock-table">
      {data.map((row: any, i: number) => (
        <div key={row.id || i} data-testid="table-row">
          <span>{row.code}</span>
          <span>{row.name}</span>
          <div data-testid="row-actions">
            {columns?.find((c: any) => c.key === "actions")?.render?.(null, row)}
          </div>
        </div>
      ))}
    </div>
  ),
}));

describe("Inventory Assets & Services Page", () => {
  const adminUser = { id: "u1", name: "Admin", role: Role.ADMIN, email: "a@a.com" };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: adminUser });

    (fetchData as jest.Mock).mockImplementation((url: string) => {
      if (url === "/assets") {
        return Promise.resolve([
          { id: "a1", code: "A001", name: "Kamera Sony", categoryId: "cat1", status: "TERSEDIA", dailyRate: 50000, stock: 1, photoUrl: "" },
        ]);
      }
      if (url === "/services") {
        return Promise.resolve([
          { id: "s1", code: "S001", name: "Jasa Edit", categoryId: "cat2", isActive: true, unitRate: 100000, description: "Edit video", photoUrl: "" },
        ]);
      }
      if (url === "/categories/type/aset") return Promise.resolve([{ id: "cat1", name: "Elektronik" }]);
      if (url === "/categories/type/jasa") return Promise.resolve([{ id: "cat2", name: "Multimedia" }]);
      return Promise.resolve([]);
    });
  });

  test("memanggil API dan menampilkan data", async () => {
  await act(async () => {
    render(<InventoryPage />);
  });

  // tunggu sampai data muncul (ini berarti loading sudah selesai)
  expect(await screen.findByText("Kamera Sony")).toBeInTheDocument();
  expect(await screen.findByText("Jasa Edit")).toBeInTheDocument();

  // setelah loading selesai, baru aman cek heading/tombol
  expect(screen.getByText(/Inventaris/i)).toBeInTheDocument();

  expect(fetchData).toHaveBeenCalledWith("/assets", { method: "GET" });
  expect(fetchData).toHaveBeenCalledWith("/services", { method: "GET" });

  expect(screen.getByRole("button", { name: /Tambah Aset/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Tambah Jasa/i })).toBeInTheDocument();
});


  test("klik Tambah Aset membuka dialog", async () => {
  await act(async () => {
    render(<InventoryPage />);
  });

  const btn = await screen.findByRole("button", { name: /Tambah Aset/i });

  await act(async () => {
    fireEvent.click(btn);
  });

  expect(await screen.findByText(/Tambah Aset Baru/i)).toBeInTheDocument();
});
});

