import { render, screen, fireEvent } from "@testing-library/react"
import ReturnsPage from "./page"
import { Role, Condition } from "@/types"

// ================== MOCKS ==================

// mock auth
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Admin Test",
      role: Role.ADMIN,
    },
  }),
}))

// mock toast
const toastMock = jest.fn()
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

// mock DataTable 
jest.mock("@/components/data-table", () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">Total rows: {data.length}</div>
  ),
}))

// mock Dialog & Select
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <div />,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}))

// ================== TESTS ==================

describe("ReturnsPage", () => {
  it("render halaman pengembalian aset", () => {
    render(<ReturnsPage />)

    expect(screen.getByText("Pengembalian Aset")).toBeInTheDocument()
    expect(
      screen.getByText("Proses pengembalian aset dari pengguna")
    ).toBeInTheDocument()
  })

  it("menampilkan summary cards", () => {
    render(<ReturnsPage />)

    expect(screen.getByText("Total Belum Kembali")).toBeInTheDocument()
    expect(screen.getByText("Terlambat")).toBeInTheDocument()
    expect(screen.getByText("Sudah Dikembalikan")).toBeInTheDocument()
  })

  it("menampilkan tabel pengembalian", () => {
    render(<ReturnsPage />)

    expect(screen.getByTestId("data-table")).toBeInTheDocument()
  })

  it("render dialog pengembalian (static content)", () => {
  render(<ReturnsPage />)

  expect(
    screen.getByText("Proses Pengembalian Aset")
  ).toBeInTheDocument()

  expect(
    screen.getByText("Periksa kondisi aset dan catat pengembalian")
  ).toBeInTheDocument()
})


  
  
})
