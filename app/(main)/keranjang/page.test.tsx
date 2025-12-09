// app/(main)/cart/page.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CartPage from './page';
import { fetchData } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useToast } from '@/hooks/use-toast';

// --- 1. MOCK DEPENDENCIES ---
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

// PERBAIKAN: Destructure props untuk menghindari warning 'received true for non-boolean attribute'
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: any) => <img {...props} alt={props.alt} />,
}));

jest.mock('lucide-react', () => ({
  Image: () => <span data-testid="icon-image" />,
  Package: () => <span data-testid="icon-package" />,
  ShoppingCart: () => <span data-testid="icon-cart" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Save: () => <span data-testid="icon-save" />,
  Minus: () => <span data-testid="icon-minus" />,
  Plus: () => <span data-testid="icon-plus" />,
}));

jest.mock('@/lib/format', () => ({
  formatCurrency: (val: number) => `Rp ${val}`,
}));

// --- 2. DUMMY DATA ---
const mockItems = [
  {
    id: 'cart1',
    userId: 'u1',
    serviceId: 's1',
    quantity: 2,
    notes: 'Catatan Awal',
    service: { id: 's1', name: 'Cuci Mobil', unitRate: '50000', photoUrl: 'img.jpg' },
    package: null,
  },
  {
    id: 'cart2',
    userId: 'u1',
    serviceId: 's2',
    quantity: 1,
    service: { id: 's2', name: 'Foto Studio', unitRate: '100000', photoUrl: null },
    package: { id: 'p1', name: 'Paket Keluarga', unitRate: '200000' },
  },
];

describe('CartPage', () => {
  const mockRouterPush = jest.fn();
  const mockToastFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToastFn });
  });

  // --- SKENARIO 1: LOAD & RENDER ---
  it('merender loading state awalnya', () => {
    (fetchData as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<CartPage />);
    expect(screen.queryByText('Keranjang kosong')).not.toBeInTheDocument();
  });

  it('merender empty state jika keranjang kosong', async () => {
    (fetchData as jest.Mock).mockResolvedValue([]);
    render(<CartPage />);
    await waitFor(() => {
      expect(screen.getByText('Keranjang kosong')).toBeInTheDocument();
    });
  });

  it('merender daftar item dan ringkasan dengan benar', async () => {
    (fetchData as jest.Mock).mockResolvedValue(mockItems);
    render(<CartPage />);
    await waitFor(() => {
      expect(screen.getByText('Cuci Mobil')).toBeInTheDocument();
      expect(screen.getByText('Paket Keluarga')).toBeInTheDocument();
    });
    // Cek Harga & Subtotal
    expect(screen.getAllByText('Rp 50000').length).toBeGreaterThan(0);
    expect(screen.getByText('Rp 300000')).toBeInTheDocument(); // (50k*2) + 200k
  });

  // --- SKENARIO 2: EDIT QUANTITY ---
  it('mengubah quantity secara lokal dan menyimpan perubahan (PATCH)', async () => {
    (fetchData as jest.Mock).mockResolvedValue(mockItems);
    (fetchData as jest.Mock).mockImplementation((url, opts) => {
        if (url === '/cart' && opts.method === 'GET') return Promise.resolve(mockItems);
        if (url === '/cart/cart1' && opts.method === 'PATCH') {
            return Promise.resolve({ message: 'Updated', cartItem: { ...mockItems[0], quantity: 3 } });
        }
        return Promise.resolve({});
    });

    render(<CartPage />);
    await screen.findByText('Cuci Mobil');

    // Cari Input Qty: value="2"
    const qtyInput = screen.getByDisplayValue('2');
    fireEvent.change(qtyInput, { target: { value: '3' } });
    expect(qtyInput).toHaveValue(3);

    // Klik Simpan
    const saveBtns = screen.getAllByText('Simpan Perubahan');
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith('/cart/cart1', expect.objectContaining({
            method: 'PATCH',
            data: expect.objectContaining({ quantity: 3 })
        }));
    });
    expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated' }));
  });

  // --- SKENARIO 3: DELETE ---
  it('menghapus item dari keranjang', async () => {
    (fetchData as jest.Mock).mockResolvedValue(mockItems);
    (fetchData as jest.Mock).mockImplementation((url, opts) => {
        if (url === '/cart') return Promise.resolve(mockItems);
        if (url === '/cart/cart1' && opts.method === 'DELETE') return Promise.resolve({ message: 'Deleted' });
        return Promise.resolve({});
    });

    render(<CartPage />);
    await screen.findByText('Cuci Mobil');

    const deleteBtns = screen.getAllByText('Hapus');
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith('/cart/cart1', { method: 'DELETE' });
    });
    expect(screen.queryByText('Cuci Mobil')).not.toBeInTheDocument();
  });

  // --- SKENARIO 4: CLEAR CART ---
  it('mengosongkan seluruh keranjang', async () => {
    (fetchData as jest.Mock).mockResolvedValue(mockItems);
    render(<CartPage />);
    await screen.findByText('Cuci Mobil');

    fireEvent.click(screen.getByText('Kosongkan Keranjang'));

    await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith('/cart', { method: 'DELETE' });
    });
    expect(screen.getByText('Keranjang kosong')).toBeInTheDocument();
  });

  // --- SKENARIO 5: CHECKOUT ---
  it('melakukan checkout sukses jika data lengkap', async () => {
    (fetchData as jest.Mock).mockResolvedValue(mockItems);
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    (fetchData as jest.Mock).mockImplementation((url, opts) => {
        if (url === '/cart') return Promise.resolve(mockItems);
        if (url === '/bookings/checkout') return Promise.resolve({ message: 'Booking Created' });
        return Promise.resolve({});
    });

    render(<CartPage />);
    await screen.findByText('Cuci Mobil');

    // PERBAIKAN SELEKSI INPUT TANGGAL
    // Karena label tidak terasosiasi, kita cari elemen label dulu, lalu ambil sibling-nya (input)
    // Atau gunakan placeholder/test-id jika ada.
    // Di sini kita gunakan trik: Cari label text, lalu parent div, lalu input di dalamnya.
    
    // 1. Tanggal Mulai
    // Struktur: <div> <label>Tanggal Mulai</label> <input /> </div>
    // Kita cari teks "Tanggal Mulai", ambil parent, lalu cari input.
    const startLabel = screen.getByText('Tanggal Mulai');
    // Ambil parent div (container)
    const startContainer = startLabel.parentElement as HTMLElement;
    // Cari input di dalam container tersebut
    // Input type date tidak punya role 'textbox', jadi kita query selector 'input'
    const startDateInput = startContainer.querySelector('input') as HTMLInputElement;
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });

    // 2. Tanggal Selesai
    const endLabel = screen.getByText('Tanggal Selesai');
    const endContainer = endLabel.parentElement as HTMLElement;
    const endDateInput = endContainer.querySelector('input') as HTMLInputElement;
    
    fireEvent.change(endDateInput, { target: { value: '2025-01-03' } });

    // 3. Catatan
    const notesInput = screen.getByPlaceholderText('Notes keseluruhan booking');
    fireEvent.change(notesInput, { target: { value: 'Acara Kantor' } });

    // 4. Checkout
    fireEvent.click(screen.getByText('Lanjutkan Pemesanan'));

    // Verifikasi API Call
    await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith('/bookings/checkout', expect.objectContaining({
            method: 'POST',
            data: {
                startDate: '2025-01-01',
                endDate: '2025-01-03',
                notes: 'Acara Kantor'
            }
        }));
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/booking');
  });

  it('menampilkan validasi jika tanggal kosong', async () => {
    (fetchData as jest.Mock).mockResolvedValue(mockItems);
    render(<CartPage />);
    await screen.findByText('Cuci Mobil');

    fireEvent.click(screen.getByText('Lanjutkan Pemesanan'));

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Data belum lengkap',
        icon: 'warning'
    }));
  });
});