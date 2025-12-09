import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import NotificationsPage from './page';
import { fetchData } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { NotificationType } from '@/types';
import Swal from 'sweetalert2';

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

// Mock Formatters
jest.mock('@/lib/format', () => ({
  formatDateTime: (val: string) => val, 
}));

// Mock Icons
jest.mock('lucide-react', () => ({
  Bell: () => <span data-testid="icon-bell" />,
  Check: () => <span data-testid="icon-check" />,
  CheckCheck: () => <span data-testid="icon-check-all" />,
  Trash2: () => <span data-testid="icon-trash" />,
  ChevronsLeft: () => <span>&lt;&lt;</span>,
  ChevronLeft: () => <span>&lt;</span>,
  ChevronRight: () => <span>&gt;</span>,
  ChevronsRight: () => <span>&gt;&gt;</span>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const mockNotifications = [
  {
    id: 'n1',
    type: NotificationType.BOOKING,
    title: 'Booking Baru',
    body: 'Anda berhasil booking kamera',
    sentAt: '2025-01-02T10:00:00Z', 
    readAt: null, 
  },
  {
    id: 'n2',
    type: NotificationType.PAYMENT,
    title: 'Pembayaran Diterima',
    body: 'Pembayaran lunas',
    sentAt: '2025-01-01T10:00:00Z', 
    readAt: '2025-01-01T12:00:00Z', 
  }
];

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' } });
    
    // Default API Implementation
    (fetchData as jest.Mock).mockImplementation((url, opts) => {
      if (url === '/notifications' && opts.method === 'GET') {
        return Promise.resolve({ notifications: mockNotifications });
      }
      return Promise.resolve({});
    });
  });

  // --- SKENARIO 1: RENDER & LOAD ---

  it('merender daftar notifikasi dan menghitung unread count', async () => {
    render(<NotificationsPage />);

    // tunggu teks "Notifikasi" muncul
    await waitFor(() => {
        expect(screen.getByText('Notifikasi')).toBeInTheDocument();
    });
    
    // 2. Cek data muncul
    expect(screen.getByText('Booking Baru')).toBeInTheDocument();
    expect(screen.getByText('Pembayaran Diterima')).toBeInTheDocument();

    // 3. Cek Unread Count
    expect(screen.getByText('1 notifikasi belum dibaca')).toBeInTheDocument();

    // 4. Cek Tombol "Tandai Semua Dibaca"
    expect(screen.getByText('Tandai Semua Dibaca')).toBeInTheDocument();
  });

  it('menampilkan empty state jika tidak ada data', async () => {
    (fetchData as jest.Mock).mockResolvedValue({ notifications: [] });

    render(<NotificationsPage />);

    // Tunggu render selesai
    await waitFor(() => {
      expect(screen.getByText('Tidak ada notifikasi')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Semua notifikasi sudah dibaca')).toBeInTheDocument();
  });

  // --- SKENARIO 2: FILTER & SORT ---

  it('memfilter notifikasi berdasarkan tipe', async () => {
    render(<NotificationsPage />);
    await waitFor(() => screen.getByText('Booking Baru'));

    const selects = screen.getAllByTestId('mock-select');
    const typeFilter = selects[0]; 

    fireEvent.change(typeFilter, { target: { value: NotificationType.PAYMENT } });

    expect(screen.queryByText('Booking Baru')).not.toBeInTheDocument();
    expect(screen.getByText('Pembayaran Diterima')).toBeInTheDocument();
  });

  it('mengurutkan notifikasi berdasarkan tanggal (Desc/Asc)', async () => {
    render(<NotificationsPage />);
    await waitFor(() => screen.getByText('Booking Baru'));

    const selects = screen.getAllByTestId('mock-select');
    const sortFilter = selects[1]; 

    // Default: Desc (Terbaru n1 dulu)
    const titlesDefault = screen.getAllByRole('heading', { level: 3 });
    expect(titlesDefault[0]).toHaveTextContent('Booking Baru'); 

    // Ubah ke Asc
    fireEvent.change(sortFilter, { target: { value: 'asc' } });

    const titlesAsc = screen.getAllByRole('heading', { level: 3 });
    expect(titlesAsc[0]).toHaveTextContent('Pembayaran Diterima'); 
  });

  // --- SKENARIO 3: ACTIONS (MARK READ) ---

  it('menandai satu notifikasi sebagai dibaca', async () => {
    render(<NotificationsPage />);
    await waitFor(() => screen.getByText('Booking Baru'));

    const checkBtn = screen.getByTestId('icon-check').closest('button') as HTMLElement;
    
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith('/notifications/n1/read', { method: 'PATCH' });
    });

    expect(screen.getByText('Semua notifikasi sudah dibaca')).toBeInTheDocument();
  });

  it('menandai semua notifikasi sebagai dibaca', async () => {
    render(<NotificationsPage />);
    await waitFor(() => screen.getByText('Booking Baru'));

    const markAllBtn = screen.getByText('Tandai Semua Dibaca');
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith('/notifications/read', { method: 'PATCH' });
    });

    expect(screen.queryByText('Tandai Semua Dibaca')).not.toBeInTheDocument();
  });

  // --- SKENARIO 4: ERROR HANDLING ---

  it('menampilkan error jika gagal memuat data', async () => {
    (fetchData as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'error',
        title: 'Error'
      }));
    });
  });
});