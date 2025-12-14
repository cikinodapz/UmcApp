import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import ReturnsPage from "@/app/(main)/returns/page"

// ===== MOCKS =====

// mock auth
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      role: "ADMIN",
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

// mock DataTable (penting supaya test simpel)
jest.mock("@/components/data-table", () => ({
  DataTable: ({ data, columns }: any) => (
    <table>
      <tbody>
        {data.map((row: any, i: number) => (
          <tr key={i}>
            {columns.map((col: any, j: number) => (
              <td key={j}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}))

describe("ReturnsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders page title", () => {
    render(<ReturnsPage />)

    expect(
      screen.getByText("Pengembalian Aset")
    ).toBeInTheDocument()
  })

  it("shows return items table", () => {
    render(<ReturnsPage />)

    expect(
      screen.getByText("Proses Kembali")
    ).toBeInTheDocument()
  })

  it("opens return dialog when clicking Proses Kembali", () => {
    render(<ReturnsPage />)

    fireEvent.click(screen.getByText("Proses Kembali"))

    expect(
      screen.getByText("Proses Pengembalian Aset")
    ).toBeInTheDocument()
  })

  it("processes return and shows toast", () => {
    render(<ReturnsPage />)

    fireEvent.click(screen.getByText("Proses Kembali"))
    fireEvent.click(screen.getByText("Proses Pengembalian"))

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Berhasil",
      })
    )
  })
})
