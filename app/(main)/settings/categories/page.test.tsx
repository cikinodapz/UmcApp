import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import CategoriesPage from "./page"
import { Role } from "@/types"

const useAuthMock = jest.fn()
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => useAuthMock(),
}))

const toastMock = jest.fn()
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

jest.mock("@/components/data-table", () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">Total kategori: {data.length}</div>
  ),
}))

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}))

describe("CategoriesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("menolak akses jika user bukan admin", () => {
    useAuthMock.mockReturnValue({
      user: { role: Role.PEMINJAM },
    })

    render(<CategoriesPage />)

    expect(
      screen.getByText("Akses ditolak. Halaman ini hanya untuk admin.")
    ).toBeInTheDocument()
  })

  it("render halaman kelola kategori untuk admin", () => {
    useAuthMock.mockReturnValue({
      user: { role: Role.ADMIN },
    })

    render(<CategoriesPage />)

    expect(screen.getByText("Kelola Kategori")).toBeInTheDocument()
  })

  it("menampilkan tabel kategori", () => {
    useAuthMock.mockReturnValue({
      user: { role: Role.ADMIN },
    })

    render(<CategoriesPage />)

    expect(screen.getByTestId("data-table")).toBeInTheDocument()
  })

  it("menampilkan form tambah kategori", () => {
    useAuthMock.mockReturnValue({
      user: { role: Role.ADMIN },
    })

    render(<CategoriesPage />)

    expect(screen.getByLabelText("Nama Kategori")).toBeInTheDocument()
    expect(screen.getByLabelText("Deskripsi")).toBeInTheDocument()
  })

  it("submit tambah kategori menampilkan toast sukses", () => {
    useAuthMock.mockReturnValue({
      user: { role: Role.ADMIN },
    })

    render(<CategoriesPage />)

    fireEvent.change(screen.getByLabelText("Nama Kategori"), {
      target: { value: "Kategori Baru" },
    })

    // klik tombol submit (index ke-1)
    fireEvent.click(screen.getAllByText("Tambah Kategori")[1])

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Berhasil",
      })
    )
  })
})
