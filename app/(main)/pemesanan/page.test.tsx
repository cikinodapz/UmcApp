import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BookingsPage from "./page";

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Admin",
      role: "ADMIN",
    },
  }),
}));

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

import { fetchData } from "@/lib/api";

describe("BookingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("menampilkan halaman booking", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce([]);

    render(<BookingsPage />);

    // Page shows "Kelola Pemesanan" for admin, not "Kelola Booking"
    expect(
      await screen.findByText("Kelola Pemesanan")
    ).toBeInTheDocument();
  });

  it("menampilkan data booking (row tabel muncul)", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce([
      {
        id: "booking-9999",
        status: "MENUNGGU",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        items: [],
        totalAmount: 100000,
      },
    ]);

    render(<BookingsPage />);

    // Wait for loading to complete and table to render
    await waitFor(() => {
      expect(screen.getByText("Kelola Pemesanan")).toBeInTheDocument();
    });

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      // 1 header + 1 data
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  it("membuka dialog detail saat tombol detail diklik", async () => {
    (fetchData as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: "booking-9999",
          status: "MENUNGGU",
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          items: [],
          totalAmount: 100000,
        },
      ])
      .mockResolvedValueOnce({
        id: "booking-9999",
        status: "MENUNGGU",
        totalAmount: 100000,
        items: [],
      });

    render(<BookingsPage />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText("Kelola Pemesanan")).toBeInTheDocument();
    });

    // Wait for buttons to appear
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByRole("button");
    // Find the Eye button for detail view (first action button in the actions column area)
    const eyeButton = buttons.find(btn => btn.closest('.flex.items-center.gap-2'));
    if (eyeButton) {
      fireEvent.click(eyeButton);
    } else {
      fireEvent.click(buttons[0]);
    }

    await waitFor(() =>
      expect(screen.getByText("Detail Booking")).toBeInTheDocument()
    );
  });
});
