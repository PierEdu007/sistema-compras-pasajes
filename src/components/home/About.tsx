import { useTranslation } from 'react-i18next';
import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa';

export default function About() {
  const { t } = useTranslation();

  return (
    <section className="about-section py-5">
      <div className="container">
        <div className="about-content text-center">
          <div className="quote-icon"><FaQuoteLeft /></div>
          <h2>
            {t('about.title', 'Inversiones Tunki Chasky')}
          </h2>
          <p className="about-desc mt-4">
            {t('about.description', 'Inversiones Tunki Chasky S.R.L. es una empresa líder en transporte terrestre interurbano y logística de encomiendas en la región Cusco. Con autos modernos de 4 y 6 pasajeros, ofrecemos un servicio Formal, Seguro, Confiable y Puntual para satisfacer las necesidades de nuestros usuarios.')}
          </p>
          <div className="quote-icon right"><FaQuoteRight /></div>
        </div>
      </div>
    </section>
  );
}
