import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <section className="about-section py-5">
      <div className="container">
        <div className="about-content text-center">
          <div className="quote-icon">❝</div>
          <h2>
            {t('about.title', 'Inversiones K\'intu')}
          </h2>
          <p className="about-desc mt-4">
            {t('about.description', 'Inversiones K\'intu es una empresa de capitales 100% Cusqueños identificados con el desarrollo de nuestra región. Una empresa Formal, Segura, Confiable y Puntual en busca de brindarle un servicio de Calidad para satisfacer las necesidades de nuestros usuarios.')}
          </p>
          <div className="quote-icon right">❞</div>
        </div>
      </div>
    </section>
  );
}
