import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import CategoriesPage from "./page";
import { useAuth } from "@/contexts/auth-context";
import { fetchData } from "@/lib/api";
import { Role } from "@/types";

jest.mock("@/contexts/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api", () => ({ fetchData: jest.fn() }));

jest.mock("sweetalert2", () => ({
  fire: jest.fn().mockResolvedValue({}),
}));

jest.mock("lucide-react", () => ({
  Plus: () => <span />,
  Search: () => <span />,
  Edit: () => <span />,
  Trash2: () => <span />,
  Loader2: () => <span />,
  Tag: () => <span />,
  ChevronsLeft: () => <span />,
  ChevronLeft: () => <span />,
  ChevronRight: () => <span />,
  ChevronsRight: () => <span />,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
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

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <div data-value={value}>{children}</div>,
}));

describe("Inventory Categories Page", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "u1", name: "Admin", role: Role.ADMIN, email: "a@a.com" },
    });

    // response server paging (object)
    (fetchData as jest.Mock).mockResolvedValue({
      items: [{ id: "c1", name: "Elektronik", description: "Barang", type: "ASET" }],
      total: 1,
      page: 1,
      pageSize: 10,
    });
  });

  test("load kategori dan menampilkan item", async () => {
    jest.useFakeTimers();

    render(<CategoriesPage />);

    expect(screen.getByText("Kategori")).toBeInTheDocument();

    // jalankan debounce 400ms (biar tidak ada warning timer)
    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
    });

    expect(await screen.findByText("Elektronik")).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("klik Tambah Kategori membuka dialog", async () => {
    render(<CategoriesPage />);

    const btn = await screen.findByRole("button", { name: /Tambah Kategori/i });
    fireEvent.click(btn);

    // judul dialog
    expect(await screen.findByRole("heading", { name: /Tambah Kategori/i })).toBeInTheDocument();
  });
});
