import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import { fetchData } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Role } from '@/types';

jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(),
}));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Lucide Icons (Agar rendering lebih ringan)
jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="icon-calendar" />,
  CreditCard: () => <span data-testid="icon-card" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
  Clock: () => <span data-testid="icon-clock" />,
  Plus: () => <span data-testid="icon-plus" />,
  ArrowRight: () => <span data-testid="icon-arrow" />,
  MessageSquare: () => <span data-testid="icon-msg" />,
}));

const mockUser = {
  id: 'u1', name: 'John Doe', role: Role.PEMINJAM, email: 'john@example.com'
};

const mockDashboardData = {
  bookings: {
    waiting: 2,
    confirmed: 3,
    nextUpcoming: { id: 'b1', title: 'Booking Kamera' }
  },
  payments: {
    pending: 50000
  },
  notifications: {
    unread: 5
  },
  cart: {
    count: 2
  },
  feedback: {
    count: 10
  }
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('merender dashboard dengan data lengkap dan perhitungan yang benar', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (fetchData as jest.Mock).mockResolvedValue(mockDashboardData);

    render(<DashboardPage />);

    expect(screen.getByText('Beranda Peminjam')).toBeInTheDocument();
    expect(screen.getByText(/Halo, John Doe!/i)).toBeInTheDocument();

    await waitFor(() => {
      const fives = screen.getAllByText('5');
      expect(fives.length).toBeGreaterThanOrEqual(2); 
    });

    const bookingCard = screen.getByText('Booking Aktif').closest('div[data-slot="card"]');
    expect(bookingCard).toHaveTextContent('5');

    const notifCard = screen.getByText('Notifikasi Belum Dibaca').closest('div[data-slot="card"]');
    expect(notifCard).toHaveTextContent('5');

    // Cek Statistik Lainnya
    expect(screen.getByText('50000')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); 
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('menampilkan bagian "Jadwal Terdekat" jika data tersedia', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (fetchData as jest.Mock).mockResolvedValue(mockDashboardData);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Tersedia')).toBeInTheDocument();
    });

    expect(screen.getByText('Jadwal terdekat tersedia')).toBeInTheDocument();
    expect(screen.getByText('Kelola Pemesanan')).toBeInTheDocument();
  });

  it('menampilkan state kosong jika "Jadwal Terdekat" null', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (fetchData as jest.Mock).mockResolvedValue({
      ...mockDashboardData,
      bookings: { ...mockDashboardData.bookings, nextUpcoming: null }
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Tidak ada')).toBeInTheDocument();
    });

    expect(screen.getByText('Belum ada jadwal terdekat')).toBeInTheDocument();
    expect(screen.getByText('Mulai Pesan')).toBeInTheDocument();
  });

  it('menangani error API dengan graceful (menampilkan 0/default)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (fetchData as jest.Mock).mockRejectedValue(new Error('Network Error'));

    render(<DashboardPage />);

    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Beranda Peminjam')).toBeInTheDocument();
  });

  it('menyesuaikan judul berdasarkan Role User', async () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { ...mockUser, role: 'ADMIN' } 
    });
    (fetchData as jest.Mock).mockResolvedValue(mockDashboardData);

    render(<DashboardPage />);

    await waitFor(() => {
        expect(screen.getByText('Beranda')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Beranda Peminjam')).not.toBeInTheDocument();
  });
});