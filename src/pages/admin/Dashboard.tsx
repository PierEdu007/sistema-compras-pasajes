import { useTranslation } from 'react-i18next';
import '../../styles/components/admin/Dashboard.css';

function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="page-admin-dashboard">
      <h1>{t('admin.dashboard')}</h1>
    </div>
  );
}

export default AdminDashboard;
