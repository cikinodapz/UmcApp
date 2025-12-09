// app/(main)/payments/page.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PaymentsPage from './page';
import { fetchData } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Role, PaymentStatus, PaymentMethod } from '@/types';
import Swal from 'sweetalert2';

// --- 1. MOCK DEPENDENCIES ---

jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(),
}));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

jest.mock('@/lib/format', () => ({
  formatCurrency: (val: number) => `Rp ${val}`,
  formatDateTime: (val: string) => val,
}));

// Mock Icons
jest.mock('lucide-react', () => ({
  CreditCard: () => <span data-testid="icon-card" />,
  Eye: () => <span data-testid="icon-eye" />,
  ChevronsLeft: () => <span>&lt;&lt;</span>,
  ChevronLeft: () => <span>&lt;</span>,
  ChevronRight: () => <span>&gt;</span>,
  ChevronsRight: () => <span>&gt;&gt;</span>,
}));

// --- 2. MOCK UI COMPONENTS ---

jest.mock('@/components/data-table', () => ({
  DataTable: ({ data, columns }: any) => (
    <div data-testid="mock-table">
      {data.map((row: any, i: number) => (
        <div key={row.id || i} data-testid="table-row">
          <span data-testid="row-booking">{row.bookingCode}</span>
          <span data-testid="row-amount">{row.amount}</span>
          <span data-testid="row-status">{row.status}</span>
          <div data-testid="row-actions">
             {columns.find((c: any) => c.key === 'actions')?.render(null, row)}
          </div>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select 
      data-testid="status-filter" 
      value={value} 
      onChange={e => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null, 
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/status-badge', () => ({
  StatusBadge: ({ status }: any) => <span>{status}</span>
}));

// --- 3. DUMMY DATA ---

const mockPayments = [
  {
    id: 'p1', bookingId: 'b1', amount: 50000, method: PaymentMethod.TRANSFER, status: PaymentStatus.PAID, paidAt: '2025-01-01',
    booking: { id: 'booking-1', userId: 'u1', status: 'DIKONFIRMASI', user: { name: 'User Satu', email: 'u1@test.com' } }
  },
  {
    id: 'p2', bookingId: 'b2', amount: 75000, method: PaymentMethod.QRIS, status: PaymentStatus.PENDING, paidAt: null,
    booking: { id: 'booking-2', userId: 'u1', status: 'MENUNGGU', user: { name: 'User Satu' } }
  }
];

const mockDetail = {
  booking: {
    id: 'b1',
    user: { name: 'User Satu', email: 'u1@test.com' },
    startDate: '2025-01-01', endDate: '2025-01-02',
    totalAmount: 50000,
    items: [
      { id: 'i1', type: 'JASA', service: { name: 'Foto' }, quantity: 1, unitPrice: 50000 }
    ]
  },
  summary: { totalAmount: 50000, latestPaymentStatus: 'PAID' },
  latestPayment: { proofUrl: 'http://proof.url' }
};

describe('PaymentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1', role: Role.PEMINJAM } }); // Default User
    
    // Default API Mocks
    (fetchData as jest.Mock).mockImplementation((url) => {
      if (url === '/payments') return Promise.resolve(mockPayments);
      if (url.includes('/payments/admin/by-booking')) return Promise.resolve(mockDetail);
      return Promise.resolve([]);
    });
  });

  // --- SKENARIO 1: LOAD & RENDER ---

  it('merender daftar pembayaran', async () => {
    render(<PaymentsPage />);

    // 1. Cek Header
    expect(screen.getByText('Pembayaran')).toBeInTheDocument();

    // 2. Tunggu data
    await waitFor(() => {
      // Cek Booking Code (slice -8 logic di page)
      expect(screen.getByText('ooking-1')).toBeInTheDocument(); 
      expect(screen.getByText('ooking-2')).toBeInTheDocument();
    });

    // 3. Cek Status Badge
    expect(screen.getByText('PAID')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  // --- SKENARIO 2: FILTER ---

  it('memfilter pembayaran berdasarkan status', async () => {
    render(<PaymentsPage />);
    await waitFor(() => screen.getByText('ooking-1'));

    const select = screen.getByTestId('status-filter');

    // Filter: Pending
    fireEvent.change(select, { target: { value: PaymentStatus.PENDING } });

    // p1 (PAID) hilang, p2 (PENDING) ada
    expect(screen.queryByText('ooking-1')).not.toBeInTheDocument();
    expect(screen.getByText('ooking-2')).toBeInTheDocument();
  });

  // --- SKENARIO 3: VIEW DETAIL ---

  it('membuka dialog detail pembayaran saat tombol view diklik', async () => {
    render(<PaymentsPage />);
    await waitFor(() => screen.getByText('ooking-1'));

    // Klik tombol view (Eye icon) di baris pertama
    const viewBtns = screen.getAllByTestId('icon-eye');
    const viewBtn = viewBtns[0].closest('button') as HTMLElement;
    fireEvent.click(viewBtn);

    // Cek Dialog Muncul
    expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByText('Detail Pembayaran')).toBeInTheDocument();

    // Cek Loading state detail (opsional)
    // expect(screen.getByText('Memuat detail…')).toBeInTheDocument();

    // Tunggu Detail Loaded
    await waitFor(() => {
      // API call detail
      expect(fetchData).toHaveBeenCalledWith('/payments/admin/by-booking/b1');
      // Konten detail muncul
      expect(screen.getByText('Bukti Pembayaran')).toBeInTheDocument();
      expect(screen.getByText('Foto')).toBeInTheDocument(); // Nama item
    });
  });

  // --- SKENARIO 4: COMPLETE BOOKING (ADMIN ONLY) ---

  it('Admin dapat menyelesaikan booking yang sudah lunas', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'admin1', role: Role.ADMIN } });
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    // Mock patch response
    (fetchData as jest.Mock).mockImplementation((url, opts) => {
        if (url === '/payments') return Promise.resolve(mockPayments);
        if (url.includes('/complete') && opts.method === 'PATCH') return Promise.resolve({});
        return Promise.resolve({});
    });

    render(<PaymentsPage />);
    await waitFor(() => screen.getByText('ooking-1'));

    // Cari tombol "Tandai Selesai"
    // Tombol ini hanya muncul jika status PAID dan booking belum SELESAI.
    // p1 memenuhi syarat (PAID, DIKONFIRMASI).
    const completeBtn = screen.getByText('Tandai Selesai');
    fireEvent.click(completeBtn);

    // Cek Konfirmasi Swal
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Tandai selesai?',
        icon: 'question'
    }));

    // Cek API Call
    await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith('/bookings/b1/complete', { method: 'PATCH' });
    });

    // Cek Swal Sukses
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Berhasil',
        icon: 'success'
    }));
  });

  // --- SKENARIO 5: ERROR HANDLING ---

  it('menangani error saat load data gagal', async () => {
    (fetchData as jest.Mock).mockRejectedValue(new Error('Load Failed'));

    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Load Failed')).toBeInTheDocument();
    });
  });
});