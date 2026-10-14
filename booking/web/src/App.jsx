import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import CustomerLayout from './components/CustomerLayout.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Placeholder from './pages/Placeholder.jsx'
import Home from './pages/Home.jsx'
import Pricelist from './pages/Pricelist.jsx'
import Login from './pages/Login.jsx'
import Booking from './pages/Booking.jsx'
import Riwayat from './pages/Riwayat.jsx'
import RiwayatDetail from './pages/RiwayatDetail.jsx'
import Struk from './pages/Struk.jsx'
import Profil from './pages/Profil.jsx'
import LengkapiProfil from './pages/LengkapiProfil.jsx'
import LupaPassword from './pages/LupaPassword.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminBookings from './pages/admin/Bookings.jsx'
import AdminSlots from './pages/admin/Slots.jsx'
import AdminCustomers from './pages/admin/Customers.jsx'
import AdminPricelist from './pages/admin/Pricelist.jsx'
import AdminStruk from './pages/admin/Struk.jsx'
import AdminReports from './pages/admin/Reports.jsx'
import AdminLogs from './pages/admin/Logs.jsx'

/**
 * Daftar rute lengkap sesuai PRD Bab 13.
 * - Customer/publik dibungkus CustomerLayout (header tipis + footer).
 * - Login customer & admin full screen sendiri.
 * - Rute admin dijaga AdminRoute + AdminLayout (sidebar).
 */
export default function App() {
  return (
    <AuthProvider>
      {/* Basename buat deploy sub-path. Subdomain booking.indeepcleaningid.site: '/' */}
      <BrowserRouter basename={import.meta.env.VITE_BASENAME || '/'}>
        <Routes>
          {/* --- Publik & customer (ada layout) --- */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/pricelist" element={<Pricelist />} />
            <Route path="/lengkapi-profil" element={<LengkapiProfil />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/riwayat" element={<Riwayat />} />
            <Route path="/riwayat/:id" element={<RiwayatDetail />} />
            <Route path="/riwayat/:id/struk" element={<Struk />} />
            <Route path="/profil" element={<Profil />} />
          </Route>

          {/* --- Login (full screen) --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/lupa-password" element={<LupaPassword />} />

          {/* --- Admin --- */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin-bookings" element={<AdminBookings />} />
              <Route path="/admin-bookings/:id/struk" element={<AdminStruk />} />
              <Route path="/admin-slots" element={<AdminSlots />} />
              <Route path="/admin-customers" element={<AdminCustomers />} />
              <Route path="/admin-pricelist" element={<AdminPricelist />} />
              <Route path="/admin-reports" element={<AdminReports />} />
              <Route path="/admin-logs" element={<AdminLogs />} />
            </Route>
          </Route>

          {/* --- Rute tidak dikenal --- */}
          <Route
            path="*"
            element={<Placeholder title="Halaman Tidak Ditemukan" desc="Alamat yang kamu buka tidak ada. Kembali ke beranda." />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
