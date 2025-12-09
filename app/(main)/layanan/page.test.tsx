// app/(main)/layanan/page.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ServicesPage from './page';
import { fetchData } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Role } from '@/types';
import Swal from 'sweetalert2';

// --- 1. MOCK DEPENDENCIES ---

jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(),
}));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: any) => <img {...props} alt={props.alt} />,
}));

// Mock Icons
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Search: () => <span data-testid="icon-search" />,
  Edit: () => <span data-testid="icon-edit" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Package: () => <span data-testid="icon-package" />,
  Loader2: () => <span data-testid="icon-loader" />,
  X: () => <span data-testid="icon-x" />,
  List: () => <span data-testid="icon-list" />,
  ChevronsLeft: () => <span>&lt;&lt;</span>,
  ChevronLeft: () => <span>&lt;</span>,
  ChevronRight: () => <span>&gt;</span>,
  ChevronsRight: () => <span>&gt;&gt;</span>,
}));

// --- 2. MOCK UI COMPONENTS ---

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select 
      data-testid="mock-select" 
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
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }: any) => open ? <div data-testid="mock-alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ onClick, children }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ onClick, children }: any) => <button onClick={onClick}>{children}</button>,
}));

// --- 3. DUMMY DATA ---

const mockCategories = [
  { id: 'cat1', name: 'Fotografi' },
  { id: 'cat2', name: 'Videografi' },
];

const mockServices = [
  { 
    id: 's1', 
    name: 'Jasa Foto Prewedding', 
    description: 'Foto outdoor', 
    unitRate: '1500000', 
    isActive: true, 
    categoryId: 'cat1',
    category: { name: 'Fotografi' },
    photoUrl: '/img1.jpg',
    Package: [
      { id: 'p1', name: 'Paket Basic', unitRate: '1000000', features: ['2 Jam', '10 Foto'] }
    ]
  },
  { 
    id: 's2', 
    name: 'Jasa Video Profil', 
    description: 'Video company profile', 
    unitRate: '3000000', 
    isActive: false, 
    categoryId: 'cat2',
    category: { name: 'Videografi' },
    photoUrl: '/img2.jpg',
    Package: []
  },
];

describe('ServicesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API Implementation yang LEBIH PINTAR
    // Membedakan method GET vs POST/DELETE
    (fetchData as jest.Mock).mockImplementation((url, options) => {
      const method = options?.method || 'GET';

      if (url === '/categories') return Promise.resolve(mockCategories);
      
      // Handle Services Endpoint
      if (url.startsWith('/services')) {
        if (method === 'GET') {
          return Promise.resolve(mockServices);
        }
        if (method === 'POST') {
          return Promise.resolve({ message: 'Created', service: { id: 's3' } });
        }
        if (method === 'DELETE') {
          return Promise.resolve({ message: 'Deleted' });
        }
      }
      return Promise.resolve([]);
    });
  });

  // --- SKENARIO 1: LOAD & RENDER ---

  it('merender daftar layanan dan melakukan filter pencarian', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Role.ADMIN } });

    render(<ServicesPage />);

    // 1. Cek Header
    expect(screen.getByText('Layanan / Jasa')).toBeInTheDocument();

    // 2. Tunggu data load
    await waitFor(() => {
      expect(screen.getByText('Jasa Foto Prewedding')).toBeInTheDocument();
      expect(screen.getByText('Jasa Video Profil')).toBeInTheDocument();
    });

    // 3. Cek detail item
    expect(screen.getByText('Fotografi')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();

    // 4. Tes Search Filter (Client Side Mock)
    const searchInput = screen.getByPlaceholderText(/Cari nama layanan/i);
    fireEvent.change(searchInput, { target: { value: 'Video' } });

    // Tunggu debounce timeout
    await waitFor(() => {
        expect(screen.queryByText('Jasa Foto Prewedding')).not.toBeInTheDocument();
        expect(screen.getByText('Jasa Video Profil')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  // --- SKENARIO 2: ADMIN CRUD (CREATE) ---

  it('Admin dapat membuka dialog tambah layanan, mengisi form nested package, dan menyimpan', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Role.ADMIN } });
    
    // Kita biarkan implementasi default mock yang sudah kita define di beforeEach
    // (GET returns array, POST returns success object)

    render(<ServicesPage />);
    await waitFor(() => screen.getByText('Jasa Foto Prewedding'));

    // 1. Klik Tambah Layanan
    fireEvent.click(screen.getByText('Tambah Layanan'));

    // 2. Dialog Muncul
    const dialog = screen.getByTestId('mock-dialog');
    expect(within(dialog).getByText('Tambah Layanan')).toBeInTheDocument();

    // 3. Isi Main Form
    fireEvent.change(screen.getByPlaceholderText('Contoh: Jasa Fotografi'), { target: { value: 'Jasa Drone' } });
    fireEvent.change(screen.getByPlaceholderText('Deskripsi singkat'), { target: { value: 'Sewa drone harian' } });
    fireEvent.change(screen.getByPlaceholderText('Contoh: 50000'), { target: { value: '500000' } });

    // Select Category (mock-select pertama)
    const selects = within(dialog).getAllByTestId('mock-select');
    fireEvent.change(selects[0], { target: { value: 'cat2' } });

    // 4. Tambah Paket (Nested Form)
    fireEvent.click(screen.getByText('Tambah Paket'));
    
    // Cek form paket muncul
    expect(screen.getByText('Paket 1')).toBeInTheDocument();
    
    // Isi Form Paket
    fireEvent.change(screen.getByPlaceholderText('Nama paket (Contoh: Paket Basic)'), { target: { value: 'Paket Terbang' } });
    fireEvent.change(screen.getByPlaceholderText('Tarif paket'), { target: { value: '750000' } });

    // 5. Tambah Fitur ke Paket (Nested in Nested)
    fireEvent.click(screen.getByText('Tambah Fitur'));
    
    // Isi Fitur
    fireEvent.change(screen.getByPlaceholderText('Fitur 1'), { target: { value: '4K Resolution' } });

    // 6. Submit
    const saveBtn = within(dialog).getByText('Buat Layanan');
    fireEvent.click(saveBtn);

    // 7. Validasi API Call (FormData)
    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith('/services', expect.objectContaining({
        method: 'POST',
        data: expect.any(FormData)
      }));
    });

    // Validasi Swal
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Layanan dibuat',
        icon: 'success'
    }));
  });

  // --- SKENARIO 3: DELETE ---

  it('Admin dapat menghapus layanan', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Role.ADMIN } });
    
    render(<ServicesPage />);
    await waitFor(() => screen.getByText('Jasa Foto Prewedding'));

    // 1. Klik Delete pada item pertama
    // Icon Trash2 -> cari parent button
    const trashIcons = screen.getAllByTestId('icon-trash');
    const deleteBtn = trashIcons[0].closest('button') as HTMLElement;
    fireEvent.click(deleteBtn);

    // 2. Alert Dialog Muncul
    const alertDialog = screen.getByTestId('mock-alert-dialog');
    expect(within(alertDialog).getByText(/Yakin ingin menghapus layanan/i)).toBeInTheDocument();

    // 3. Konfirmasi Hapus
    fireEvent.click(within(alertDialog).getByText('Hapus'));

    // 4. Validasi API
    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith('/services/s1', { method: 'DELETE' });
    });
  });

  // --- SKENARIO 4: USER VIEW ---

  it('User biasa hanya melihat daftar tanpa tombol aksi admin', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Role.PEMINJAM } });

    render(<ServicesPage />);
    await waitFor(() => screen.getByText('Jasa Foto Prewedding'));

    // 1. Tombol Tambah TIDAK ADA
    expect(screen.queryByText('Tambah Layanan')).not.toBeInTheDocument();

    // 2. Tombol Edit/Hapus TIDAK ADA di row
    expect(screen.queryByTestId('icon-edit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-trash')).not.toBeInTheDocument();
  });

  // --- SKENARIO 5: VALIDASI FORM ---

  it('menampilkan error jika form tidak valid saat submit', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Role.ADMIN } });
    
    render(<ServicesPage />);
    await waitFor(() => screen.getByText('Jasa Foto Prewedding'));

    // Buka form
    fireEvent.click(screen.getByText('Tambah Layanan'));
    const dialog = screen.getByTestId('mock-dialog');

    // Submit kosong
    fireEvent.click(within(dialog).getByText('Buat Layanan'));

    // Cek Swal Warning (Nama wajib diisi)
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'warning',
        title: 'Nama wajib diisi'
    }));

    // API POST TIDAK dipanggil
    expect(fetchData).not.toHaveBeenCalledWith('/services', expect.objectContaining({ method: 'POST' }));
  });
});