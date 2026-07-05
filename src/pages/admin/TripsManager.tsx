import { useTranslation } from 'react-i18next';
import '../../styles/components/admin/TripsManager.css';

function AdminTripsManager() {
  const { t } = useTranslation();

  return (
    <div className="page-admin-trips">
      <h1>{t('admin.trips')}</h1>
    </div>
  );
}

export default AdminTripsManager;
