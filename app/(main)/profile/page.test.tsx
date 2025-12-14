import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ProfilePage from "./page"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock("sweetalert2", () => ({
  fire: jest.fn().mockResolvedValue({}),
}))

jest.mock("@/lib/api", () => ({
  fetchData: jest.fn(),
}))

import { fetchData } from "@/lib/api"

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetchData as jest.Mock).mockResolvedValue({
      user: {
        id: "1",
        name: "Nabila",
        email: "nabila@mail.com",
        phone: "08123456789",
      },
    })
  })

  it("render halaman profil", async () => {
    render(<ProfilePage />)

    expect(
      await screen.findByText("Profil")
    ).toBeInTheDocument()
  })

  it("memuat dan menampilkan data user", async () => {
    render(<ProfilePage />)

    // tunggu sampai loading selesai & user ter-set
    await waitFor(() => {
      expect(screen.getByText("Nabila")).toBeInTheDocument()
    })

    expect(
      screen.getByText("nabila@mail.com")
    ).toBeInTheDocument()
  })

  it("menampilkan section ubah password", async () => {
    render(<ProfilePage />)

    expect(
      await screen.findByText("Ubah Password")
    ).toBeInTheDocument()
  })
})
