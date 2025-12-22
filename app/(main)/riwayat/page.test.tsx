import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import RiwayatPembayaranPage from "./page";
import { fetchData } from "@/lib/api";
import Swal from "sweetalert2";

jest.mock("@/lib/api", () => ({ fetchData: jest.fn() }));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

// mock toast
const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

// mock formatters (dipakai di table & dialog)
jest.mock("@/lib/format", () => ({
  formatCurrency: (n: number) => `Rp${n}`,
  formatDateTime: (s: string) => `DT:${s}`,
}));

// next/image biar ga error di jest
jest.mock("next/image", () => (props: any) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={props.alt || "img"} {...props} />;
});

// lucide icons
jest.mock("lucide-react", () => ({
  CreditCard: () => <span data-testid="icon-credit" />,
  ExternalLink: () => <span data-testid="icon-external" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
  Eye: () => <span data-testid="icon-eye" />,
  Star: (props: any) => <span data-testid="icon-star" {...props} />,
}));

// UI mocks
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));
jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));
jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: any) => <div data-testid="skeleton" {...props} />,
}));
jest.mock("@/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

// StatusBadge (yang dipakai di table & dialog)
jest.mock("@/components/status-badge", () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}));

/**
 * Select: di file kamu Select dipakai hanya untuk filter status (di renderHeader DataTable).
 * Kita buat jadi <select> native supaya gampang dites.
 */
jest.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange }: any) => (
    <select
      data-testid="status-filter"
      value={value ?? "all"}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="all">Semua Status</option>
      <option value="PENDING">Pending</option>
      <option value="PAID">Lunas</option>
      <option value="FAILED">Gagal</option>
      <option value="REFUNDED">Dikembalikan</option>
    </select>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}));

/**
 * Dialog: file kamu pakai Dialog + DialogContent + Header/Footer.
 * Kita render kalau open=true.
 */
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div data-testid="dialog-root">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

/**
 * DataTable: supaya tes bisa akses row & tombol action.
 * Kita juga panggil renderHeader() biar filter status muncul.
 */
jest.mock("@/components/data-table", () => ({
  DataTable: ({ data, columns, renderHeader }: any) => {
    const React = require("react");
    const [searchQuery, setSearchQuery] = React.useState("");

    // search sederhana (optional, tapi aman)
    const filtered =
      !searchQuery
        ? data
        : data.filter((r: any) => JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div data-testid="mock-table">
        <div data-testid="table-header">
          {renderHeader ? renderHeader({ searchQuery, setSearchQuery }) : null}
        </div>

        <div data-testid="table-body">
          {filtered.map((row: any) => (
            <div key={row.id} data-testid={`table-row-${row.id}`}>
              {columns.map((c: any) => (
                <div key={c.key} data-testid={`cell-${c.key}-${row.id}`}>
                  {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "")}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  },
}));

describe("RiwayatPembayaranPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });

    // window.open dipakai ketika klik "Bayar" / "Buka Tautan"
    Object.defineProperty(window, "open", {
      value: jest.fn(),
      writable: true,
    });
  });

  test("Empty state: tampil 'Belum ada riwayat pembayaran.' jika /payments kosong", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce([]); // /payments

    render(<RiwayatPembayaranPage />);

    expect(await screen.findByText(/Belum ada riwayat pembayaran/i)).toBeInTheDocument();
    expect(fetchData).toHaveBeenCalledWith("/payments");
  });

  test("Render table + filter status bekerja", async () => {
    const payments = [
      {
        id: "pay1",
        bookingId: "book-12345678",
        amount: "5000",
        method: "BANK_TRANSFER",
        status: "PENDING",
        paidAt: null,
        referenceNo: null,
        proofUrl: "https://pay.link",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        booking: {
          id: "book-12345678",
          userId: "u1",
          startDate: "2025-01-02T10:00:00Z",
          endDate: "2025-01-02T12:00:00Z",
          status: "MENUNGGU",
          user: { id: "u1", name: "Budi", email: "budi@mail.com" },
        },
      },
      {
        id: "pay2",
        bookingId: "book-87654321",
        amount: "10000",
        method: "CASH",
        status: "PAID",
        paidAt: "2025-01-03T10:00:00Z",
        referenceNo: "REF-1",
        proofUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        booking: {
          id: "book-87654321",
          userId: "u2",
          startDate: "2025-01-02T10:00:00Z",
          endDate: "2025-01-02T12:00:00Z",
          status: "MENUNGGU",
          user: { id: "u2", name: "Sari", email: "sari@mail.com" },
        },
      },
    ];

    (fetchData as jest.Mock).mockResolvedValueOnce(payments); // /payments

    render(<RiwayatPembayaranPage />);

    // bookingCode berasal dari slice(-8)
    expect(await screen.findByText("12345678")).toBeInTheDocument();
    expect(await screen.findByText("87654321")).toBeInTheDocument();

    // status badge dari payment status
    expect(screen.getAllByTestId("status-badge").map((x) => x.textContent)).toEqual(
      expect.arrayContaining(["PENDING", "PAID"])
    );

    // filter jadi PAID
    fireEvent.change(screen.getByTestId("status-filter"), { target: { value: "PAID" } });

    await waitFor(() => {
      expect(screen.queryByText("12345678")).not.toBeInTheDocument();
      expect(screen.getByText("87654321")).toBeInTheDocument();
    });
  });

  test("Cek Status: klik tombol -> panggil /payments/:id/status -> update status + toast", async () => {
    const payments = [
      {
        id: "pay1",
        bookingId: "book-12345678",
        amount: "5000",
        method: "BANK_TRANSFER",
        status: "PENDING",
        paidAt: null,
        referenceNo: null,
        proofUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        booking: {
          id: "book-12345678",
          userId: "u1",
          startDate: "2025-01-02T10:00:00Z",
          endDate: "2025-01-02T12:00:00Z",
          status: "MENUNGGU",
          user: { id: "u1", name: "Budi", email: "budi@mail.com" },
        },
      },
    ];

    (fetchData as jest.Mock).mockImplementation((url: string) => {
      if (url === "/payments") return Promise.resolve(payments);
      if (url === "/payments/pay1/status")
        return Promise.resolve({ paymentStatus: "PAID", midtransStatus: "settlement" });
      return Promise.resolve({});
    });

    render(<RiwayatPembayaranPage />);

    const row = await screen.findByTestId("table-row-pay1");
    const btn = within(row).getByRole("button", { name: /Cek Status/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/payments/pay1/status");
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Status diperbarui" })
      );
    });

    // status di table berubah jadi PAID
    expect(await screen.findByText("PAID")).toBeInTheDocument();
  });

  test("Open Detail: klik icon Eye -> fetch /payments/:id -> dialog tampil + item booking", async () => {
    const list = [
      {
        id: "pay1",
        bookingId: "book-12345678",
        amount: "5000",
        method: "BANK_TRANSFER",
        status: "PENDING",
        paidAt: null,
        referenceNo: null,
        proofUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        booking: {
          id: "book-12345678",
          userId: "u1",
          startDate: "2025-01-02T10:00:00Z",
          endDate: "2025-01-02T12:00:00Z",
          status: "MENUNGGU",
          user: { id: "u1", name: "Budi", email: "budi@mail.com" },
        },
      },
    ];

    const detail = {
      ...list[0],
      booking: {
        ...list[0].booking,
        items: [
          {
            id: "it1",
            service: { name: "Service A", photoUrl: null },
            package: { name: "Paket 1", features: ["F1", "F2"] },
            quantity: 1,
            unitPrice: 5000,
            subtotal: 5000,
          },
        ],
      },
    };

    (fetchData as jest.Mock).mockImplementation((url: string, opt?: any) => {
      if (url === "/payments") return Promise.resolve(list);
      if (url === "/payments/pay1" && opt?.method === "GET") return Promise.resolve(detail);
      if (url === "/feedbacks/my/by-booking/book-12345678" && opt?.method === "GET")
        return Promise.resolve({ feedback: null });
      return Promise.resolve({});
    });

    render(<RiwayatPembayaranPage />);

    const row = await screen.findByTestId("table-row-pay1");

    // klik tombol Eye (icon)
    const eyeIcon = within(row).getByTestId("icon-eye");
    fireEvent.click(eyeIcon.closest("button")!);

    expect(await screen.findByText(/Detail Pembayaran/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/payments/pay1", { method: "GET" });
    });

    // pastikan item booking muncul
    expect(await screen.findByText("Service A")).toBeInTheDocument();
    expect(screen.getByText(/Paket 1/i)).toBeInTheDocument();
  });

  test("Feedback: booking SELESAI -> tombol Feedback muncul -> submit POST /feedbacks", async () => {
    const list = [
      {
        id: "pay3",
        bookingId: "book-99990000",
        amount: "15000",
        method: "BANK_TRANSFER",
        status: "PAID",
        paidAt: "2025-01-03T10:00:00Z",
        referenceNo: "REF-99",
        proofUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        booking: {
          id: "book-99990000",
          userId: "u9",
          startDate: "2025-01-02T10:00:00Z",
          endDate: "2025-01-02T12:00:00Z",
          status: "SELESAI",
          user: { id: "u9", name: "Andi", email: "andi@mail.com" },
        },
      },
    ];

    (fetchData as jest.Mock).mockImplementation((url: string, opt?: any) => {
      if (url === "/payments") return Promise.resolve(list);

      // prefetch effect + openFeedbackForm sama-sama nembak ini
      if (url === "/feedbacks/my/by-booking/book-99990000" && opt?.method === "GET")
        return Promise.resolve({ feedback: null });

      if (url === "/feedbacks" && opt?.method === "POST") return Promise.resolve({ ok: true });

      return Promise.resolve({});
    });

    render(<RiwayatPembayaranPage />);

    const row = await screen.findByTestId("table-row-pay3");

    // tombol Feedback muncul karena booking.status === 'SELESAI' dan feedbackMap belum true
    const btnFeedback = within(row).getByRole("button", { name: /Feedback/i });
    fireEvent.click(btnFeedback);

    expect(await screen.findByText(/Beri Feedback/i)).toBeInTheDocument();

    // pilih rating 4
    fireEvent.click(screen.getByRole("button", { name: "Rating 4" }));

    // isi komentar
    fireEvent.change(screen.getByPlaceholderText(/Tulis pengalaman kamu/i), {
      target: { value: "Mantap, pelayanannya oke!" },
    });

    // kirim
    fireEvent.click(screen.getByRole("button", { name: /Kirim Feedback/i }));

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/feedbacks", {
        method: "POST",
        data: {
          bookingId: "book-99990000",
          rating: 4,
          comment: "Mantap, pelayanannya oke!",
        },
      });
    });

    // Swal success harus terpanggil minimal sekali
    expect(Swal.fire).toHaveBeenCalled();
  });
});
