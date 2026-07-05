import { useTranslation } from 'react-i18next';
import '../../styles/components/admin/Sales.css';

function AdminSales() {
  const { t } = useTranslation();

  return (
    <div className="page-admin-sales">
      <h1>{t('admin.sales')}</h1>
      <p>{t('admin.pendingInvoices')}</p>
    </div>
  );
}

export default AdminSales;
