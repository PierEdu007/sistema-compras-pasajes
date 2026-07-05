import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import '../styles/components/Confirmation.css';

function Confirmation() {
  const { t } = useTranslation();
  const { ventaId } = useParams<{ ventaId: string }>();

  return (
    <div className="page-confirmation">
      <h1>{t('confirmation.title')}</h1>
      <p>{t('confirmation.subtitle')}</p>
      <p>Venta ID: {ventaId}</p>
      <p>{t('confirmation.thankYou')}</p>
    </div>
  );
}

export default Confirmation;
