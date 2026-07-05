import { useTranslation } from 'react-i18next';
import '../styles/components/Terms.css';

function Terms() {
  const { t } = useTranslation();

  return (
    <div className="page-terms">
      <h1>{t('nav.terms')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}

export default Terms;
