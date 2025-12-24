import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import ProfilePage from "./page"

// ================== MOCKS ==================

const toastMock = jest.fn()

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Nabila Dzakira",
      email: "nabila@mail.com",
      phone: "08123456789",
      role: "ADMIN",
    },
  }),
}))

// ================== TESTS ==================

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("render halaman profil", () => {
    render(<ProfilePage />)

    expect(screen.getByText("Profil")).toBeInTheDocument()
    expect(
      screen.getByText("Kelola informasi profil dan keamanan akun Anda")
    ).toBeInTheDocument()
  })

  it("menampilkan data user", () => {
    render(<ProfilePage />)

    expect(screen.getByText("Nabila Dzakira")).toBeInTheDocument()
    expect(screen.getByText("ADMIN")).toBeInTheDocument()
  })

  it("mengaktifkan mode edit saat tombol Edit diklik", () => {
    render(<ProfilePage />)

    fireEvent.click(
      screen.getByRole("button", { name: "Edit" })
    )

    expect(
      screen.getByText("Simpan Perubahan")
    ).toBeInTheDocument()
  })

  it("menyimpan perubahan profil dan menampilkan toast sukses", () => {
    render(<ProfilePage />)

    fireEvent.click(
      screen.getByRole("button", { name: "Edit" })
    )

    fireEvent.change(screen.getByDisplayValue("Nabila Dzakira"), {
      target: { value: "Nabila R. Dzakira" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Simpan Perubahan" })
    )

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      })
    )
  })

  it("gagal mengubah password jika konfirmasi tidak cocok", () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText("Password Baru"), {
      target: { value: "password123" },
    })

    fireEvent.change(screen.getByLabelText("Konfirmasi Password Baru"), {
      target: { value: "password456" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Ubah Password" })
    )

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
      })
    )
  })

  it("berhasil mengubah password jika data valid", () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByLabelText("Password Baru"), {
      target: { value: "password123" },
    })

    fireEvent.change(screen.getByLabelText("Konfirmasi Password Baru"), {
      target: { value: "password123" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Ubah Password" })
    )

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Berhasil",
        description: "Password berhasil diubah",
      })
    )
  })
})
