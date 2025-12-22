
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PemesananPage from "./page";

// =====================
// Mocks (Next + deps)
// =====================
jest.mock("next/link", () => {
  return ({ href, children }: any) => <a href={href}>{children}</a>;
});

// Mock next/image biar tidak lempar props fill/priority ke DOM (<img>)
jest.mock("next/image", () => {
  return function MockNextImage(props: any) {
    const { src, alt } = props;
    const resolved = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolved} alt={alt} />;
  };
});

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(async () => ({ isConfirmed: true })),
  },
}));

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}));
import { fetchData } from "@/lib/api";
const mockFetchData = fetchData as jest.Mock;

// =====================
// In-memory stores
// =====================
type Category = { id: string; name: string; type: "ASET" | "JASA" };
type AssetAPI = {
  id: string;
  code: string;
  name: string;
  photoUrl?: string | null;
  dailyRate: string | number;
  stock: number;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};
type ServiceAPI = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  unitRate: string | number;
  isActive: boolean;
  photoUrl?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};
type CartAPI = {
  id: string;
  userId: string;
  itemType: "ASET" | "JASA";
  assetId: string | null;
  serviceId: string | null;
  qty: number;
  price: string | number;
  createdAt: string;
  updatedAt: string;
  asset?: { code: string; name: string; photoUrl?: string | null } | null;
  service?: { code: string; name: string; photoUrl?: string | null } | null;
};
type BookingItem = {
  id: string;
  bookingId: string;
  itemType: "ASET" | "JASA";
  assetId: string | null;
  serviceId: string | null;
  qty: number;
  price: string;
  asset?: { name: string; code: string } | null;
  service?: { name: string; code: string } | null;
};
type Booking = {
  id: string;
  userId: string;
  type: "ASET" | "JASA";
  startDatetime: string;
  endDatetime: string;
  status: "MENUNGGU" | string;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: BookingItem[];
};

let categoriesStore: Category[] = [];
let assetsStore: AssetAPI[] = [];
let servicesStore: ServiceAPI[] = [];
let cartStore: CartAPI[] = [];
let bookingsStore: Booking[] = [];

const nowISO = () => new Date().toISOString();

function installFetchMock() {
  mockFetchData.mockImplementation(async (url: string, opts?: any) => {
    const method = (opts?.method || "GET").toUpperCase();
    const data = opts?.data;

    // katalog
    if (url === "/categories" && method === "GET") return categoriesStore;
    if (url === "/assets" && method === "GET") return assetsStore;
    if (url === "/services" && method === "GET") return servicesStore;

    // cart
    if (url === "/cart" && method === "GET") return cartStore;

    if (url === "/cart" && method === "POST") {
      const id = `c${cartStore.length + 1}`;
      const isAset = data?.itemType === "ASET";
      const assetId = isAset ? data.assetId : null;
      const serviceId = !isAset ? data.serviceId : null;

      const asset = isAset ? assetsStore.find((a) => a.id === assetId) : undefined;
      const service = !isAset ? servicesStore.find((s) => s.id === serviceId) : undefined;

      cartStore.push({
        id,
        userId: "u1",
        itemType: data.itemType,
        assetId,
        serviceId,
        qty: Number(data.qty || 1),
        price: data.price,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        asset: asset ? { code: asset.code, name: asset.name, photoUrl: asset.photoUrl ?? null } : null,
        service: service ? { code: service.code, name: service.name, photoUrl: service.photoUrl ?? null } : null,
      });

      return { message: "ok" };
    }

    if (url.startsWith("/cart/") && method === "PATCH") {
      const id = url.replace("/cart/", "");
      const idx = cartStore.findIndex((c) => c.id === id);
      if (idx >= 0) {
        cartStore[idx] = { ...cartStore[idx], qty: Number(data?.qty ?? cartStore[idx].qty), updatedAt: nowISO() };
      }
      return { message: "ok" };
    }

    if (url.startsWith("/cart/") && method === "DELETE") {
      const id = url.replace("/cart/", "");
      cartStore = cartStore.filter((c) => c.id !== id);
      return { message: "ok" };
    }

    if (url === "/cart" && method === "DELETE") {
      cartStore = [];
      return { message: "ok" };
    }

    // bookings
    if (url === "/bookings" && method === "GET") return { bookings: bookingsStore };

    if (url === "/bookings/checkout" && method === "POST") {
      const bookingId = `b${bookingsStore.length + 1}`;
      const items: BookingItem[] = cartStore.map((c, i) => ({
        id: `bi${i + 1}`,
        bookingId,
        itemType: c.itemType,
        assetId: c.assetId,
        serviceId: c.serviceId,
        qty: c.qty,
        price: String(c.price),
        asset: c.asset ? { name: c.asset.name, code: c.asset.code } : null,
        service: c.service ? { name: c.service.name, code: c.service.code } : null,
      }));

      bookingsStore.push({
        id: bookingId,
        userId: "u1",
        type: "ASET",
        startDatetime: data.startDatetime,
        endDatetime: data.endDatetime,
        status: "MENUNGGU",
        approvedBy: null,
        approvedAt: null,
        notes: data.notes ?? "",
        createdAt: nowISO(),
        updatedAt: nowISO(),
        items,
      });

      cartStore = [];
      return { message: "Booking berhasil dibuat." };
    }

    const cancelMatch = url.match(/^\/bookings\/(.+)\/cancel$/);
    if (cancelMatch && method === "PATCH") {
      const id = cancelMatch[1];
      bookingsStore = bookingsStore.map((b) =>
        b.id === id ? { ...b, status: "DIBATALKAN", updatedAt: nowISO() } : b
      );
      return { message: "Booking berhasil dibatalkan." };
    }

    throw new Error(`Unhandled fetchData: ${method} ${url}`);
  });
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:9999";
});

beforeEach(() => {
  jest.clearAllMocks();

  categoriesStore = [
    { id: "catA", name: "Kategori Aset", type: "ASET" },
    { id: "catJ", name: "Kategori Jasa", type: "JASA" },
  ];

  assetsStore = [
    {
      id: "a1",
      code: "CAM-01",
      name: "Kamera Sony",
      photoUrl: null,
      dailyRate: "10000",
      stock: 5,
      categoryId: "catA",
      category: { id: "catA", name: "Kategori Aset" },
    },
  ];

  servicesStore = [
    {
      id: "s1",
      code: "SRV-01",
      name: "Jasa Fotografi",
      description: "Foto event",
      unitRate: "20000",
      isActive: true,
      photoUrl: null,
      categoryId: "catJ",
      category: { id: "catJ", name: "Kategori Jasa" },
    },
  ];

  cartStore = [];
  bookingsStore = [];

  installFetchMock();
});

test("load awal memanggil endpoint katalog + cart + bookings", async () => {
  render(<PemesananPage />);
  expect(await screen.findByText(/Pemesanan Aset & Jasa/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(mockFetchData).toHaveBeenCalledWith("/categories", expect.objectContaining({ method: "GET" }));
    expect(mockFetchData).toHaveBeenCalledWith("/assets", expect.objectContaining({ method: "GET" }));
    expect(mockFetchData).toHaveBeenCalledWith("/services", expect.objectContaining({ method: "GET" }));
    expect(mockFetchData).toHaveBeenCalledWith("/cart", expect.objectContaining({ method: "GET" }));
    expect(mockFetchData).toHaveBeenCalledWith("/bookings", expect.objectContaining({ method: "GET" }));
  });
});

test("klik Keranjang pada item aset => POST /cart dan pindah ke tab Keranjang", async () => {
  render(<PemesananPage />);

  expect(await screen.findByText("Kamera Sony")).toBeInTheDocument();

  // tombol Keranjang pada card item
  fireEvent.click(screen.getByRole("button", { name: /^Keranjang$/i }));

  await waitFor(() => {
    expect(mockFetchData).toHaveBeenCalledWith(
      "/cart",
      expect.objectContaining({
        method: "POST",
        data: expect.objectContaining({
          itemType: "ASET",
          assetId: "a1",
          qty: 1,
          price: 10000,
        }),
      })
    );
  });

  // otomatis setTab("keranjang")
  expect(await screen.findByText(/Ringkasan Keranjang/i)).toBeInTheDocument();
});

test("checkout flow (tanpa klik tab Radix): add -> checkout -> pindah Booking", async () => {
  render(<PemesananPage />);

  // add ke cart (ini otomatis pindah tab ke keranjang)
  expect(await screen.findByText("Kamera Sony")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^Keranjang$/i }));

  // pastikan sudah di keranjang
  expect(await screen.findByText(/Ringkasan Keranjang/i)).toBeInTheDocument();

  // buka dialog checkout
  fireEvent.click(screen.getByRole("button", { name: /^Checkout$/i }));

  fireEvent.change(screen.getByLabelText(/Mulai/i), { target: { value: "2025-12-14T10:00" } });
  fireEvent.change(screen.getByLabelText(/Selesai/i), { target: { value: "2025-12-14T12:00" } });
  fireEvent.change(screen.getByLabelText(/Catatan/i), { target: { value: "Test booking" } });

  fireEvent.click(screen.getByRole("button", { name: /Buat Booking/i }));

  await waitFor(() => {
    expect(mockFetchData).toHaveBeenCalledWith(
      "/bookings/checkout",
      expect.objectContaining({
        method: "POST",
        data: expect.objectContaining({
          startDatetime: expect.any(String),
          endDatetime: expect.any(String),
          notes: "Test booking",
        }),
      })
    );
  });

  // setelah sukses, otomatis setTab("booking")
  expect(await screen.findByText(/Daftar Booking/i)).toBeInTheDocument();
});

test("cancel booking flow (tanpa klik tab Radix): checkout -> klik Batalkan Booking", async () => {
  render(<PemesananPage />);

  // buat booking dulu lewat checkout (otomatis pindah ke Booking)
  expect(await screen.findByText("Kamera Sony")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^Keranjang$/i }));
  expect(await screen.findByText(/Ringkasan Keranjang/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /^Checkout$/i }));
  fireEvent.change(screen.getByLabelText(/Mulai/i), { target: { value: "2025-12-14T10:00" } });
  fireEvent.change(screen.getByLabelText(/Selesai/i), { target: { value: "2025-12-14T12:00" } });
  fireEvent.change(screen.getByLabelText(/Catatan/i), { target: { value: "Test booking" } });
  fireEvent.click(screen.getByRole("button", { name: /Buat Booking/i }));

  expect(await screen.findByText(/Daftar Booking/i)).toBeInTheDocument();

  // cancel booking yang baru terbentuk (b1)
  const cancelBtn = await screen.findByRole("button", { name: /Batalkan Booking/i });
  fireEvent.click(cancelBtn);

  await waitFor(() => {
    expect(mockFetchData).toHaveBeenCalledWith(
      "/bookings/b1/cancel",
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
