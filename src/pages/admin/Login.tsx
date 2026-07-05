import { useTranslation } from 'react-i18next';
import '../../styles/components/admin/Login.css';

function AdminLogin() {
  const { t } = useTranslation();

  return (
    <div className="page-admin-login">
      <h1>{t('admin.login')}</h1>
    </div>
  );
}

export default AdminLogin;
