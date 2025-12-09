import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingPage from './page';
import { fetchData } from '@/lib/api';
import Swal from 'sweetalert2';

jest.mock('@/lib/api', () => ({ fetchData: jest.fn() }));
jest.mock('sweetalert2', () => ({ fire: jest.fn() }));
jest.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: any) => <img {...props} alt={props.alt || 'img'} />,
}));

jest.mock('@/lib/format', () => ({
  formatCurrency: (val: number) => `Rp ${val}`,
  formatDate: (date: string) => date,
  getStatusColor: () => 'bg-red-500', 
  getStatusText: (s: string) => s,
}));

const mockOpen = jest.fn();
Object.defineProperty(window, 'open', { value: mockOpen });

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockBookings = [
  // Kasus 1: Menunggu (Untuk Test Cancel)
  {
    id: 'b1', userId: 'u1', type: 'Layanan', status: 'MENUNGGU',
    startDate: '2025-01-01', endDate: '2025-01-02', totalAmount: '100000',
    items: [], user: { name: 'User Satu', email: 'u1@test.com' }
  },
  // Kasus 2: Dikonfirmasi (Untuk Test Pay)
  {
    id: 'b2', userId: 'u1', type: 'Paket', status: 'DIKONFIRMASI',
    startDate: '2025-02-01', endDate: '2025-02-02', totalAmount: '200000',
    items: [], user: { name: 'User Dua' }
  },
  // Kasus 3: Ditolak & Punya Item (Untuk Cover UI Line 260-286)
  {
    id: 'b3', userId: 'u1', type: 'Campur', status: 'DITOLAK',
    startDate: '2025-03-01', endDate: '2025-03-02', totalAmount: '300000',
    notes: 'Alasan ditolak: Stok habis', 
    items: [
      {
        id: 'i1', type: 'service', quantity: 2, unitPrice: '50000', subtotal: '100000',
        service: { name: 'Cuci Aset', photoUrl: 'https://img.com/1.jpg' }, 
        package: { name: 'Paket Kilat', features: ['Cepat', 'Bersih', 'Wangi', 'Murah'] } 
      },
      {
        id: 'i2', type: 'asset', quantity: 1, unitPrice: '50000', subtotal: '50000',
        service: { name: 'Sewa Kamera', photoUrl: '/uploads/cam.jpg' } 
      }
    ],
    user: { name: 'User Tiga' }
  }
];

describe('BookingPage Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpen.mockClear();
    localStorageMock.clear();
  });

  it('merender loading, list booking, detail item, dan status ditolak (Happy Path UI)', async () => {
    (fetchData as jest.Mock).mockResolvedValue(mockBookings);
    
    render(<BookingPage />);
    expect(screen.getByText(/Memuat data/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.queryByText(/Memuat data/i)).not.toBeInTheDocument();
    });

    // Cek User
    expect(screen.getByText('User Satu')).toBeInTheDocument();
    
    // Cek Logic DITOLAK
    expect(screen.getByText('Alasan Ditolak')).toBeInTheDocument();
    expect(screen.getByText('Stok habis')).toBeInTheDocument(); 

    // Cek Logic Item Detail & Features 
    expect(screen.getByText('Cuci Aset')).toBeInTheDocument();
    expect(screen.getByText('Paket Kilat')).toBeInTheDocument();
    expect(screen.getByText('Cepat')).toBeInTheDocument(); 
    expect(screen.getByText('+1 lagi')).toBeInTheDocument(); 
  });

  it('menangani error saat load data (Line 48-52)', async () => {
    (fetchData as jest.Mock).mockRejectedValue(new Error('Gagal Load'));
    render(<BookingPage />);
    await waitFor(() => expect(screen.getByText('Gagal Load')).toBeInTheDocument());
  });

  it('menangani error saat cancel booking (Line 89-91)', async () => {
    (fetchData as jest.Mock).mockResolvedValue([mockBookings[0]]); 
    render(<BookingPage />);
    await waitFor(() => screen.getByText('User Satu'));

    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    (fetchData as jest.Mock).mockImplementation((url, opt) => {
        if (opt?.method === 'DELETE') return Promise.reject(new Error('Delete Error'));
        return Promise.resolve([mockBookings[0]]);
    });

    fireEvent.click(screen.getByText('Batalkan'));

    await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Gagal', text: 'Delete Error'
        }));
    });
  });

  it('menangani error saat create payment (Line 154)', async () => {
    (fetchData as jest.Mock).mockResolvedValue([mockBookings[1]]);
    render(<BookingPage />);
    await waitFor(() => screen.getByText('User Dua'));

    (fetchData as jest.Mock).mockImplementation((url, opt) => {
        if (opt?.method === 'POST') return Promise.reject(new Error('Pay Error'));
        return Promise.resolve([mockBookings[1]]);
    });

    fireEvent.click(screen.getByText('Bayar'));

    await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Gagal membuat pembayaran', text: 'Pay Error'
        }));
    });
  });

  it('menghandle popup blocked (Line 111-117)', async () => {
    (fetchData as jest.Mock).mockResolvedValue([mockBookings[1]]);
    render(<BookingPage />);
    await waitFor(() => screen.getByText('User Dua'));

    (fetchData as jest.Mock).mockImplementation((url, opt) => {
        if (opt?.method === 'POST') return Promise.resolve({ paymentUrl: 'http://link.com' });
        return Promise.resolve([mockBookings[1]]);
    });
    mockOpen.mockReturnValue(null); 

    fireEvent.click(screen.getByText('Bayar'));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Popup diblokir' })));
  });

  it('menggunakan localStorage untuk menyembunyikan tombol bayar (Line 73)', async () => {
    localStorageMock.setItem('hasPaymentMap', JSON.stringify({ 'b2': true }));
    (fetchData as jest.Mock).mockResolvedValue([mockBookings[1]]);
    
    render(<BookingPage />);
    await waitFor(() => screen.getByText('User Dua'));

    expect(screen.queryByText('Bayar')).not.toBeInTheDocument();
  });
});