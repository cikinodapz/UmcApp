import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import ProfilePage from "./page"

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

jest.mock("sweetalert2", () => ({
  fire: jest.fn().mockResolvedValue({}),
}))

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}))

import { fetchData } from "@/lib/api"
import Swal from "sweetalert2"

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
      ; (fetchData as jest.Mock).mockResolvedValue({
        user: {
          id: "1",
          name: "Nabila Putri",
          email: "nabila@mail.com",
          phone: "08123456789",
          photoUrl: null,
        },
      })
  })

  it("render halaman profil", async () => {
    render(<ProfilePage />)

    expect(await screen.findByText("Profil")).toBeInTheDocument()
  })

  it("memuat dan menampilkan data user", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    expect(screen.getByText("nabila@mail.com")).toBeInTheDocument()
  })

  it("menampilkan section ubah password", async () => {
    render(<ProfilePage />)

    expect(await screen.findByText("Ubah Password")).toBeInTheDocument()
  })

  // NEW TEST: Error saat load profil (line 40)
  it("tampilkan toast error jika gagal memuat profil", async () => {
    ; (fetchData as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Gagal memuat profil",
          variant: "destructive",
        })
      )
    })
  })

  // NEW TEST: Display initials when no photo (line 48-54, 155-157)
  it("tampilkan inisial jika tidak ada foto", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("NP")).toBeInTheDocument() // "Nabila Putri" -> "NP"
    })
  })

  // NEW TEST: Display photo when available (line 148-153)
  it("tampilkan foto jika photoUrl tersedia", async () => {
    ; (fetchData as jest.Mock).mockResolvedValueOnce({
      user: {
        id: "1",
        name: "Nabila",
        email: "nabila@mail.com",
        photoUrl: "https://example.com/photo.jpg",
      },
    })

    render(<ProfilePage />)

    await waitFor(() => {
      const img = screen.getByAltText("Foto Profil")
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute("src", "https://example.com/photo.jpg")
    })
  })

  // NEW TEST: Pick photo button click (line 56, 161-172)
  it("klik tombol ubah foto membuka file picker", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    const editPhotoBtn = screen.getByLabelText("Ubah foto")
    expect(editPhotoBtn).toBeInTheDocument()

    // Simulate click
    fireEvent.click(editPhotoBtn)
  })

  // NEW TEST: Upload photo success (line 58-67)
  it("upload foto berhasil memperbarui photoUrl", async () => {
    ; (fetchData as jest.Mock)
      .mockResolvedValueOnce({
        user: { id: "1", name: "Nabila", email: "nabila@mail.com" },
      })
      .mockResolvedValueOnce({
        user: { photoUrl: "https://example.com/new-photo.jpg" },
      })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila")).toBeInTheDocument()
    })

    // Find hidden file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const file = new File(["photo"], "photo.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/auth/photo", expect.objectContaining({
        method: "PATCH",
      }))
    })
  })

  // NEW TEST: Upload photo failed (line 68-70)
  it("tampilkan toast error jika upload foto gagal", async () => {
    ; (fetchData as jest.Mock)
      .mockResolvedValueOnce({
        user: { id: "1", name: "Nabila", email: "nabila@mail.com" },
      })
      .mockRejectedValueOnce(new Error("File too large"))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila")).toBeInTheDocument()
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["photo"], "photo.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Gagal unggah foto",
          variant: "destructive",
        })
      )
    })
  })

  // NEW TEST: Upload photo with no file (line 59)
  it("tidak melakukan apapun jika tidak ada file", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [] } })

    // fetchData should only be called once (for loading profile)
    expect(fetchData).toHaveBeenCalledTimes(1)
  })

  // NEW TEST: Change password - current password empty (line 77-80)
  it("validasi: password saat ini wajib diisi", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    // Click change password button without filling anything
    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          text: "Password saat ini wajib diisi.",
        })
      )
    })
  })

  // NEW TEST: Change password - new password empty (line 81-84)
  it("validasi: password baru wajib diisi", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    // Fill only current password
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: "oldpass123" } })

    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          text: "Password baru wajib diisi.",
        })
      )
    })
  })

  // NEW TEST: Change password - new password too short (line 85-88)
  it("validasi: password baru minimal 6 karakter", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: "oldpass123" } })
    fireEvent.change(inputs[1], { target: { value: "12345" } }) // Only 5 chars

    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          text: "Password baru minimal 6 karakter.",
        })
      )
    })
  })

  // NEW TEST: Change password - same as current (line 89-92)
  it("validasi: password baru tidak boleh sama dengan password saat ini", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: "samepass123" } })
    fireEvent.change(inputs[1], { target: { value: "samepass123" } })

    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          text: "Password baru tidak boleh sama dengan password saat ini.",
        })
      )
    })
  })

  // NEW TEST: Change password - confirm mismatch (line 93-96)
  it("validasi: konfirmasi password tidak cocok", async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila Putri")).toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: "oldpass123" } })
    fireEvent.change(inputs[1], { target: { value: "newpass123" } })
    fireEvent.change(inputs[2], { target: { value: "differentpass" } })

    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          text: "Konfirmasi password tidak cocok.",
        })
      )
    })
  })

  // NEW TEST: Change password - success (line 97-114)
  it("ubah password berhasil dan redirect ke login", async () => {
    ; (fetchData as jest.Mock)
      .mockResolvedValueOnce({
        user: { id: "1", name: "Nabila", email: "nabila@mail.com" },
      })
      .mockResolvedValueOnce({ message: "Password changed" })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila")).toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: "oldpass123" } })
    fireEvent.change(inputs[1], { target: { value: "newpass123" } })
    fireEvent.change(inputs[2], { target: { value: "newpass123" } })

    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith("/auth/change-password", expect.objectContaining({
        method: "PATCH",
        data: { oldPassword: "oldpass123", newPassword: "newpass123" },
      }))
    })

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "success",
          title: "Berhasil",
        })
      )
    })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login")
    })
  })

  // NEW TEST: Change password - API error (line 115-118)
  it("tampilkan error jika API change password gagal", async () => {
    ; (fetchData as jest.Mock)
      .mockResolvedValueOnce({
        user: { id: "1", name: "Nabila", email: "nabila@mail.com" },
      })
      .mockRejectedValueOnce(new Error("Old password incorrect"))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila")).toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: "wrongold" } })
    fireEvent.change(inputs[1], { target: { value: "newpass123" } })
    fireEvent.change(inputs[2], { target: { value: "newpass123" } })

    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "error",
          title: "Gagal mengubah password",
        })
      )
    })
  })

  // NEW TEST: Loading state displays correctly (line 175)
  it("tampilkan 'Memuat...' saat loading", async () => {
    ; (fetchData as jest.Mock).mockImplementation(
      () => new Promise(() => { }) // Never resolves
    )

    render(<ProfilePage />)

    // Should show loading state
    expect(screen.getByText("Memuat...")).toBeInTheDocument()
  })

  // NEW TEST: Button shows "Memproses..." when loading (line 220)
  it("tombol ubah password tampilkan 'Memproses...' saat loading", async () => {
    ; (fetchData as jest.Mock)
      .mockResolvedValueOnce({
        user: { id: "1", name: "Nabila", email: "nabila@mail.com" },
      })
      .mockImplementation(() => new Promise(() => { })) // Never resolves

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Nabila")).toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: "oldpass123" } })
    fireEvent.change(inputs[1], { target: { value: "newpass123" } })
    fireEvent.change(inputs[2], { target: { value: "newpass123" } })

    const changeBtn = screen.getByText("Ubah Password", { selector: "button" })
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(screen.getByText("Memproses...")).toBeInTheDocument()
    })
  })

  // NEW TEST: Handle user response without wrapper (line 38)
  it("handle API response tanpa wrapper user", async () => {
    ; (fetchData as jest.Mock).mockResolvedValueOnce({
      id: "1",
      name: "Direct User",
      email: "direct@mail.com",
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText("Direct User")).toBeInTheDocument()
    })
  })
})
