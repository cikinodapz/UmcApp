import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PeminjamanAktifPage from './page';
import { useToast } from '@/hooks/use-toast';

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: any) => <img {...props} alt={props.alt || 'img'} />
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/lib/format', () => ({
  formatCurrency: (val: number) => `Rp ${val}`,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select 
      data-testid="select-status"
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ value, onValueChange, children }: any) => (
    <div data-testid="tabs-container">
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { activeValue: value, onChange: onValueChange })
      )}
    </div>
  ),
  TabsList: ({ children, activeValue, onChange }: any) => (
    <div>
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { activeValue, onChange })
      )}
    </div>
  ),
  TabsTrigger: ({ value, children, activeValue, onChange }: any) => (
    <button 
      data-testid={`tab-${value}`}
      onClick={() => onChange(value)}
      style={{ fontWeight: activeValue === value ? 'bold' : 'normal' }}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/lib/mock', () => {
  const futureDate = new Date(); 
  futureDate.setDate(futureDate.getDate() + 7); 

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7); 

  return {
    mockAssets: [
      { id: 'a1', code: 'A001', name: 'Kamera Sony', photoUrl: '/cam.jpg' },
      { id: 'a2', code: 'A002', name: 'Lensa Canon', photoUrl: '/lens.jpg' },
    ],
    mockServices: [
      { id: 's1', code: 'S001', name: 'Jasa Editor', isActive: true },
    ],
    mockBookings: [
      { id: 'b1', startDatetime: new Date().toISOString(), endDatetime: futureDate.toISOString(), notes: 'Liputan' },
      { id: 'b2', startDatetime: pastDate.toISOString(), endDatetime: pastDate.toISOString(), notes: 'Lupa balik' },
      { id: 'b3', startDatetime: pastDate.toISOString(), endDatetime: futureDate.toISOString() },
    ],
    mockBookingItems: [
      { id: 'bi1', bookingId: 'b1', assetId: 'a1', qty: 1, price: 100000 },
      { id: 'bi2', bookingId: 'b2', assetId: 'a2', qty: 1, price: 50000 },
      { id: 'bi3', bookingId: 'b3', serviceId: 's1', qty: 1, price: 200000 },
    ],
    mockReturns: [
      { id: 'r1', bookingItemId: 'bi3', returnedAt: new Date().toISOString() }
    ]
  };
});

describe('PeminjamanAktifPage', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it('merender halaman dan memuat data awal (Seeding)', async () => {
    render(<PeminjamanAktifPage />);

    expect(screen.getByText('Sedang Dipinjam')).toBeInTheDocument();

    const ongoingStatuses = screen.getAllByText('Berjalan');
    expect(ongoingStatuses.length).toBeGreaterThan(0);
    expect(screen.getByText('Kamera Sony')).toBeInTheDocument();
    expect(screen.getByText('Lensa Canon')).toBeInTheDocument();
    const overdueStatuses = screen.getAllByText('Terlambat');
    expect(overdueStatuses.length).toBeGreaterThan(0);
    expect(screen.getByText('Jasa Editor')).toBeInTheDocument();
    const returnedStatuses = screen.getAllByText('Dikembalikan');
    expect(returnedStatuses.length).toBeGreaterThan(0);
  });

  it('dapat melakukan filter pencarian (Search)', async () => {
    render(<PeminjamanAktifPage />);
    const searchInput = screen.getByPlaceholderText(/Cari nama, kode/i);
    
    fireEvent.change(searchInput, { target: { value: 'Sony' } });
    
    expect(screen.getByText('Kamera Sony')).toBeInTheDocument();
    expect(screen.queryByText('Lensa Canon')).not.toBeInTheDocument();
  });

  it('dapat melakukan filter berdasarkan Tab (Jenis)', async () => {
    render(<PeminjamanAktifPage />);
    const tabJasa = screen.getByTestId('tab-jasa');
    fireEvent.click(tabJasa);

    expect(screen.queryByText('Kamera Sony')).not.toBeInTheDocument();
    expect(screen.getByText('Jasa Editor')).toBeInTheDocument();
  });

  it('dapat melakukan filter berdasarkan Status', async () => {
    render(<PeminjamanAktifPage />);
    const select = screen.getByTestId('select-status');
    
    fireEvent.change(select, { target: { value: 'OVERDUE' } });

    expect(screen.queryByText('Kamera Sony')).not.toBeInTheDocument();
    expect(screen.getByText('Lensa Canon')).toBeInTheDocument();
  });

  it('dapat menampilkan detail item saat tombol Detail diklik', async () => {
    render(<PeminjamanAktifPage />);
    const row = screen.getByText('Kamera Sony').closest('.border') as HTMLElement;
    const btnDetail = within(row).getByText('Detail');

    fireEvent.click(btnDetail);

    expect(within(row).getByText('Kode:')).toBeInTheDocument();
    expect(within(row).getByText('A001')).toBeInTheDocument();
  });

  it('dapat memperpanjang durasi peminjaman', async () => {
    render(<PeminjamanAktifPage />);
    const row = screen.getByText('Kamera Sony').closest('.border') as HTMLElement;

    const btnExtend = within(row).getByText(/Perpanjang \+1 hari/i);
    fireEvent.click(btnExtend);

    await waitFor(() => {
      const stored = JSON.parse(localStorageMock.getItem('loans-state-v1') || '[]');
      const item = stored.find((i: any) => i.name === 'Kamera Sony');
      expect(item).toBeDefined();
    });
  });

  it('dapat mengembalikan item (Return)', async () => {
    render(<PeminjamanAktifPage />);

    const row = screen.getByText('Kamera Sony').closest('.border') as HTMLElement;

    expect(within(row).getAllByText('Berjalan').length).toBeGreaterThan(0);

    const btnReturn = within(row).getByText('Kembalikan');
    fireEvent.click(btnReturn);

    await waitFor(() => {
        expect(within(row).getAllByText('Dikembalikan').length).toBeGreaterThan(0);
        expect(within(row).queryByText('Kembalikan')).not.toBeInTheDocument();
    });
  });

  it('menghitung ringkasan biaya (Summary) dengan benar', async () => {
    render(<PeminjamanAktifPage />);
    const summaryCard = screen.getByText('Ringkasan').closest('.rounded-2xl') as HTMLElement;
    
    expect(within(summaryCard).getByText('2 item')).toBeInTheDocument();
    expect(within(summaryCard).getByText('Rp 150000')).toBeInTheDocument();
  });

  it('dapat mereset data dummy', async () => {
    render(<PeminjamanAktifPage />);
    
    const btnReset = screen.getByText('Muat Ulang Data Dummy');
    fireEvent.click(btnReset);

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Data dummy di-reset dari mock.ts"
    }));
    expect(screen.getByText('Kamera Sony')).toBeInTheDocument();
  });
});