import { useDevice } from '../../hooks/useDevice'
import AdminDashboardMobile from './AdminDashboard.mobile'
import AdminDashboardWeb from './AdminDashboard.web'

function AdminDashboard() {
  const isMobile = useDevice()

  if (isMobile) {
    return <AdminDashboardMobile />
  }

  return <AdminDashboardWeb />
}

export default AdminDashboard
