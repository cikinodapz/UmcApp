// app/(main)/denda/page.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import FinesPage from './page';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/types';

// --- 1. MOCK DATA & LIBRARIES ---

// Mock Auth
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock Toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock Formatters
jest.mock('@/lib/format', () => ({
  formatCurrency: (val: number) => `Rp ${val}`,
  formatDateTime: (val: string) => val,
}));

// --- 2. MOCK DATA SOURCE (@/lib/mock) ---
jest.mock('@/lib/mock', () => ({
  mockUsers: [
    { id: 'u1', name: 'User Satu', email: 'u1@test.com' },
    { id: 'u2', name: 'User Dua', email: 'u2@test.com' },
  ],
  mockBookings: [
    { id: 'b1', userId: 'u1' },
    { id: 'b2', userId: 'u2' },
  ],
  mockFines: [
    // Denda 1: Milik User 1 (UNPAID)
    { id: 'f1', bookingId: 'b1', amount: 50000, type: 'TELAT', isPaid: false, notes: 'Telat 1 hari' },
    // Denda 2: Milik User 2 (UNPAID)
    { id: 'f2', bookingId: 'b2', amount: 20000, type: 'KERUSAKAN', isPaid: false },
    // Denda 3: Milik User 1 (PAID)
    { id: 'f3', bookingId: 'b1', amount: 10000, type: 'LAINNYA', isPaid: true, paidAt: '2023-01-01' },
  ]
}));

// --- 3. MOCK UI COMPONENTS ---

// Mock DataTable: Render secara selektif agar tidak duplikat
jest.mock('@/components/data-table', () => ({
  DataTable: ({ data, columns }: any) => (
    <div data-testid="mock-table">
      {data.map((row: any, i: number) => (
        <div key={row.id || i} data-testid="table-row">
          {/* Render kolom nama user untuk verifikasi filter */}
          {/* Pastikan hanya dirender SEKALI */}
          <span data-testid="row-user">{row.userName}</span>
          <span data-testid="row-status">{row.isPaid ? 'Lunas' : 'Belum Lunas'}</span>
          
          {/* Render kolom aksi (tombol bayar) */}
          <div data-testid="row-actions">
             {columns.find((c: any) => c.key === 'actions')?.render(null, row)}
          </div>
        </div>
      ))}
    </div>
  ),
}));

// Mock Select (PERBAIKAN: Jangan render div children di dalam select)
jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select 
      data-testid="status-filter" 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
    >
      {/* Filter children untuk hanya mengambil <option> jika perlu, 
          atau biarkan children render tapi pastikan SelectItem render <option> */}
      {children}
    </select>
  ),
  SelectTrigger: () => null, // JANGAN RENDER TRIGGER (DIV) DI SINI
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

// Mock Dialog
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock StatusBadge
jest.mock('@/components/status-badge', () => ({
  StatusBadge: ({ status }: any) => <span>{status}</span>
}));


describe('FinesPage', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  // --- SKENARIO 1: ADMIN VIEW ---
  describe('Admin View', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'admin1', role: Role.ADMIN, name: 'Admin' }
      });
    });

    it('merender semua denda dan statistik dengan benar', () => {
      render(<FinesPage />);

      expect(screen.getByText('Denda')).toBeInTheDocument();
      
      // Cek Summary Cards
      expect(screen.getByText('Rp 70000')).toBeInTheDocument(); 
      expect(screen.getByText('Rp 10000')).toBeInTheDocument();
      
      // Total rows = 3 (f1, f2, f3)
      // Karena teks "3" bisa muncul di summary card ATAU di pagination mock, 
      // kita cek keberadaan spesifik di card summary.
      // Cara aman: cek jumlah row di tabel.
      const rows = screen.getAllByTestId('table-row');
      expect(rows.length).toBe(3);

      // Cek User Satu ada (f1, f3) - gunakan getAllByText karena muncul 2x
      const userSatuRows = screen.getAllByText('User Satu');
      expect(userSatuRows.length).toBeGreaterThan(0);

      // Cek User Dua ada (f2)
      expect(screen.getByText('User Dua')).toBeInTheDocument();
    });

    it('dapat memfilter denda berdasarkan status', async () => {
      render(<FinesPage />);

      const select = screen.getByTestId('status-filter');

      // 1. Filter: Belum Lunas (UNPAID)
      fireEvent.change(select, { target: { value: 'UNPAID' } });
      
      const rowsUnpaid = screen.getAllByTestId('table-row');
      expect(rowsUnpaid.length).toBe(2);
      expect(screen.queryByText('Lunas')).not.toBeInTheDocument();

      // 2. Filter: Sudah Lunas (PAID)
      fireEvent.change(select, { target: { value: 'PAID' } });
      
      const rowsPaid = screen.getAllByTestId('table-row');
      expect(rowsPaid.length).toBe(1);
      expect(screen.getByText('Lunas')).toBeInTheDocument();
    });

    it('membuka dialog konfirmasi dan menandai denda lunas', async () => {
      render(<FinesPage />);

      // Cari tombol bayar. Tombol ini ada di dalam row UNPAID.
      // Kita ambil semua tombol "Tandai Lunas".
      const payButtons = screen.getAllByText('Tandai Lunas');
      const targetButton = payButtons[0]; 

      fireEvent.click(targetButton);

      expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
      expect(screen.getByText('Konfirmasi Pembayaran Denda')).toBeInTheDocument();
      expect(screen.getByText('Telat 1 hari')).toBeInTheDocument(); 

      // Klik Konfirmasi di dalam dialog. 
      // Karena tombol pemicu dan tombol konfirmasi punya teks sama "Tandai Lunas",
      // kita harus scope pencarian ke dalam dialog.
      const dialog = screen.getByTestId('mock-dialog');
      const confirmButton = within(dialog).getByText('Tandai Lunas');
      
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Berhasil',
          description: 'Denda berhasil ditandai sebagai lunas'
        }));
        expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
      });
    });
  });

  // --- SKENARIO 2: USER VIEW ---
  describe('Regular User View', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'u1', role: Role.PEMINJAM, name: 'User Satu' }
      });
    });

    it('hanya menampilkan denda milik user yang login', () => {
      render(<FinesPage />);

      expect(screen.getByText('Lihat status denda Anda')).toBeInTheDocument();

      // Cek Tabel: User Dua (f2) TIDAK BOLEH MUNCUL
      expect(screen.queryByText('User Dua')).not.toBeInTheDocument();
      
      const rows = screen.getAllByTestId('table-row');
      expect(rows.length).toBe(2); // f1 dan f3 milik User Satu

      // Cek Summary Card
      expect(screen.getByText('Rp 50000')).toBeInTheDocument(); 
      expect(screen.queryByText('Rp 70000')).not.toBeInTheDocument();
    });
  });
});