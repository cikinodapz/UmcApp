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

    expect(
      await screen.findByText("Kelola Booking")
    ).toBeInTheDocument();
  });

  it("menampilkan data booking (row tabel muncul)", async () => {
    (fetchData as jest.Mock).mockResolvedValueOnce([
      {
        id: "booking-9999",
        status: "PENDING",
        startDate: new Date().toISOString(),
      },
    ]);

    render(<BookingsPage />);

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
          status: "PENDING",
          startDate: new Date().toISOString(),
        },
      ])
      .mockResolvedValueOnce({
        id: "booking-9999",
        status: "PENDING",
        totalAmount: 100000,
      });

    render(<BookingsPage />);

    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    await waitFor(() =>
      expect(screen.getByText("Detail Booking")).toBeInTheDocument()
    );
  });
});
