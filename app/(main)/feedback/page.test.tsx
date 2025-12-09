import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import FeedbackPage from './page';
import { fetchData } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Role } from '@/types';

jest.mock('@/lib/api', () => ({ fetchData: jest.fn() }));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/lib/format', () => ({
  formatCurrency: (val: number) => `Rp ${val}`,
  formatDateTime: (val: string) => val,
}));

jest.mock('@/components/data-table', () => ({
  DataTable: ({ data, columns }: any) => (
    <div data-testid="mock-table">
      {data.map((row: any, i: number) => (
        <div key={row.id || i} data-testid="table-row">
          {columns.map((col: any) => (
            <div key={col.key}>
              {col.render ? col.render(row[col.key], row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/select', () => {
  return {
    Select: ({ value, onValueChange, children }: any) => (
      <select 
        data-testid="rating-filter" 
        value={value} 
        onChange={e => onValueChange(e.target.value)}
      >
        {/* Render children secara selektif atau render opsi manual jika mock complex */}
        {/* Cara termudah: Biarkan children render, tapi SelectItem harus render <option> */}
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => null, 
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    SelectValue: () => null,
  };
});

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

const mockFeedbacks = [
  {
    id: 'f1', bookingId: 'b1', userId: 'u1', rating: 5, comment: 'Sangat bagus',
    createdAt: '2025-01-01', user: { name: 'Alice', email: 'alice@test.com' },
    booking: { id: 'BOOK-001' }
  },
  {
    id: 'f2', bookingId: 'b2', userId: 'u2', rating: 3, comment: 'Biasa aja',
    createdAt: '2025-01-02', user: { name: 'Bob', email: 'bob@test.com' },
    booking: { id: 'BOOK-002' }
  },
  {
    id: 'f3', bookingId: 'b3', userId: 'u3', rating: 1, comment: 'Buruk',
    createdAt: '2025-01-03', user: { name: 'Charlie', email: 'charlie@test.com' },
    booking: { id: 'BOOK-003' }
  },
];

const mockBookingDetail = {
  booking: {
    totalAmount: 50000,
    items: [
      { id: 'i1', type: 'asset', quantity: 1, unitPrice: 50000, subtotal: 50000, asset: { name: 'Kamera' } }
    ]
  }
};

describe('FeedbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: Admin User
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', role: Role.ADMIN, name: 'Admin' }
    });

    // Default API Implementation
    (fetchData as jest.Mock).mockImplementation((url) => {
      if (url === '/feedbacks/admin/all') return Promise.resolve(mockFeedbacks);
      if (url.includes('/feedbacks/by-booking/')) return Promise.resolve([mockBookingDetail]);
      return Promise.resolve([]);
    });
  });

  it('merender halaman, memuat data, dan menghitung rata-rata rating', async () => {
    render(<FeedbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    expect(screen.getByText('Feedback')).toBeInTheDocument();

    const threes = screen.getAllByText('3');
    expect(threes.length).toBeGreaterThan(0);
  });

  it('dapat melakukan filter pencarian (Search)', async () => {
    render(<FeedbackPage />);
    await waitFor(() => screen.getByText('Alice'));

    const searchInput = screen.getByPlaceholderText(/Cari komentar, user/i);
    fireEvent.change(searchInput, { target: { value: 'Biasa' } });

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('dapat melakukan filter berdasarkan Rating', async () => {
    render(<FeedbackPage />);
    await waitFor(() => screen.getByText('Alice'));

    const select = screen.getByTestId('rating-filter');
    fireEvent.change(select, { target: { value: '5' } });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('membuka dialog detail saat tombol view diklik', async () => {
    render(<FeedbackPage />);
    await waitFor(() => screen.getByText('Alice'));

    const aliceRow = screen.getByText('Alice').closest('[data-testid="table-row"]') as HTMLElement;
    const buttons = within(aliceRow).getAllByRole('button');
    const viewButton = buttons[buttons.length - 1]; 
    
    fireEvent.click(viewButton);

    expect(screen.getByText(/Memuat detail pesanan/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith('/feedbacks/by-booking/b1', expect.anything());
      expect(screen.getByText('Detail Pesanan')).toBeInTheDocument();
    });

    expect(screen.getByText('Kamera')).toBeInTheDocument();
  });

  it('menangani error saat fetch data gagal', async () => {
    (fetchData as jest.Mock).mockRejectedValue(new Error('Network Error'));
    render(<FeedbackPage />);
    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });

  it('menangani pagination (Simulasi Manual)', async () => {
    const manyFeedbacks = Array.from({ length: 15 }).map((_, i) => ({
      id: `f${i}`, bookingId: `b${i}`, userId: `u${i}`, rating: 5, createdAt: '2025-01-01',
      user: { name: `User ${i}`, email: 'test@test.com' }, booking: { id: `B${i}` }
    }));
    
    (fetchData as jest.Mock).mockResolvedValue(manyFeedbacks);

    render(<FeedbackPage />);
    await waitFor(() => screen.getByText('User 0'));

    const rows = screen.getAllByTestId('table-row');
    expect(rows.length).toBe(10);

    const nextButton = screen.getByText('›');
    fireEvent.click(nextButton);

    const rowsPage2 = screen.getAllByTestId('table-row');
    expect(rowsPage2.length).toBe(5);
  });
});