import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <section className="about-section py-5">
      <div className="container">
        <div className="about-content text-center">
          <div className="quote-icon">❝</div>
          <h2>
            {t('about.title', 'Inversiones Tunki Chasky')}
          </h2>
          <p className="about-desc mt-4">
            {t('about.description', 'Inversiones Tunki Chasky S.R.L. es una empresa líder en transporte terrestre interurbano y logística de encomiendas en la región Cusco. Con camionetas modernas de 3 filas, ofrecemos un servicio Formal, Seguro, Confiable y Puntual para satisfacer las necesidades de nuestros usuarios.')}
          </p>
          <div className="quote-icon right">❞</div>
        </div>
      </div>
    </section>
  );
}
