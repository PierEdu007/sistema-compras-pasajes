import { useTranslation } from 'react-i18next';
import '../../styles/components/MapSection.css';

export default function MapSection() {
  const { t } = useTranslation();

  return (
    <section id="ubicanos" className="map-section py-5">
      <div className="container">
        <div className="section-header text-center">
          <span className="subtitle">{t('map.subtitle', 'Visítanos')}</span>
          <h2>{t('map.title', 'Encuéntranos en')}</h2>
          <div className="divider"></div>
        </div>

        <div className="map-wrapper">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3879.151227563739!2d-71.9859922!3d-13.5263093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDMxJzM0LjciUyA3McKwNTknMDkuNiJX!5e0!3m2!1ses!2spe!4v1769108608166!5m2!1ses!2spe"
            allowFullScreen
            loading="lazy"
            title="Ubicación Tunki Chasky"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
