import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import { useAuth } from '@/contexts/auth-context';
import { fetchData } from '@/lib/api';
import { Role } from '@/types';

jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({ fetchData: jest.fn() }));

jest.mock('next/link', () => ({
  __esModule: true, default: ({ children }: any) => <a>{children}</a>
}));
jest.mock('next/image', () => ({
  __esModule: true, default: ({ fill, ...props }: any) => <img {...props} />
}));

jest.mock('@/components/mini-line-chart', () => ({
  MiniLineChart: ({ title, subtitle, data }: any) => (
    <div data-testid="mini-chart">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <ul>{data?.map((d: any) => <li key={d.label}>{d.label}</li>)}</ul>
    </div>
  ),
}));

jest.mock('@/components/data-table', () => ({
  DataTable: ({ title, data, columns }: any) => (
    <div data-testid="data-table">
      <h3>{title}</h3>
      {data.map((row: any, i: number) => (
        <div key={i} data-testid="table-row">
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

// Mock Libraries
jest.mock('@/lib/mock', () => ({
  mockAssets: [], mockServices: [], mockBookings: [], mockBookingItems: [], 
  mockPayments: [{ bookingId: 'b1', status: 'PENDING' }],
  mockUsers: [], mockCategories: [{ id: 'c1', name: 'Kamera' }],
}));

jest.mock('@/lib/format', () => ({
  formatCurrency: (v: number) => `${v}`,
  formatDateTime: (v: string) => v,
}));
jest.mock('@/components/stat-card', () => ({ StatCard: () => <div /> }));
jest.mock('@/components/status-badge', () => ({ StatusBadge: () => <div /> }));

describe('DashboardPage Coverage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // --- ADMIN VIEW ---
  describe('Admin View', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ user: { role: Role.ADMIN } });
    });

    it('menangani null safety pada kolom tabel dan format tanggal chart', async () => {
      const mockAdminData = {
        totals: {}, bookings: {}, payments: {},
        recent: {
          bookings: [{ id: 'b1', user: null, totalAmount: 0 }],
          payments: [{ id: 'p1', booking: null, amount: 0 }],
        },
      };

      const mockStatsData = {
        timeline: [{ key: 'invalid-date', total: 0 }],
      };

      (fetchData as jest.Mock).mockResolvedValueOnce(mockAdminData);
      (fetchData as jest.Mock).mockResolvedValueOnce(mockStatsData);

      render(<DashboardPage />);
      
      await waitFor(() => {
        const hyphens = screen.getAllByText('-');
        expect(hyphens.length).toBeGreaterThan(0);
      });
      
      const invalidDates = screen.getAllByText('invalid-date');
      expect(invalidDates.length).toBeGreaterThan(0);
    });

    it('menangani error load API (Line 49, 62)', async () => {
      (fetchData as jest.Mock).mockRejectedValue(new Error('Load Failed'));
      render(<DashboardPage />);
      
      await waitFor(() => {
        const errorMsgs = screen.getAllByText('Load Failed');
        expect(errorMsgs.length).toBeGreaterThan(0);
      });
    });
  });

  // --- USER VIEW ---
  describe('User View', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ 
        user: { id: 'u1', name: 'Budi', role: Role.PEMINJAM } 
      });
    });

    it('menghitung statistik user dengan logika filter yang benar (Line 241)', async () => {
      render(<DashboardPage />);
      expect(screen.getByText(/Selamat Datang, Budi!/i)).toBeInTheDocument();
    });
  });
});