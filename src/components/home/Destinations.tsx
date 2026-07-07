import { useTranslation } from 'react-i18next';
import '../../styles/components/Destinations.css';

// Import destination images
import machuPicchu from '../../assets/destinations/machu-picchu.png';
import quillabamba from '../../assets/destinations/quillabamba.png';
import quellouno from '../../assets/destinations/quellouno.png';
import calca from '../../assets/destinations/calca.png';
import ollantaytambo from '../../assets/destinations/ollantaytambo.png';
import lima from '../../assets/destinations/lima.png';
import abancay from '../../assets/destinations/abancay.png';

interface Destination {
  id: number;
  image: string;
  priceTag: string;
  title: string;
  description: string;
  meta1Icon: string;
  meta1Text: string;
  meta2Icon: string;
  meta2Text: string;
}

export default function Destinations() {
  const { t } = useTranslation();

  const destinations: Destination[] = [
    {
      id: 1, image: machuPicchu,
      priceTag: 'Cusco - Hidroeléctrica · S/ 60',
      title: t('dest.1.title', 'Ruta a Machu Picchu'),
      description: t('dest.1.desc', 'Servicio directo y veloz para turistas y locales buscando puntualidad.'),
      meta1Icon: '⚡', meta1Text: t('dest.express', 'Express'),
      meta2Icon: '🛋️', meta2Text: t('dest.comfort', 'Confort'),
    },
    {
      id: 2, image: quillabamba,
      priceTag: 'Cusco - Quillabamba · S/ 50',
      title: t('dest.2.title', 'Ruta de la Convención'),
      description: t('dest.2.desc', 'Viajes diarios por la ruta Málaga con conductores expertos.'),
      meta1Icon: '☀️', meta1Text: t('dest.daily', 'Diario'),
      meta2Icon: '🛤️', meta2Text: 'Málaga',
    },
    {
      id: 3, image: quellouno,
      priceTag: 'Cusco - Quellouno · S/ 50',
      title: t('dest.3.title', 'Ruta Quellouno'),
      description: t('dest.3.desc', 'Conexión rápida y segura hacia el valle de Quellouno todos los días.'),
      meta1Icon: '🌿', meta1Text: t('dest.jungle', 'Selva'),
      meta2Icon: '🏎️', meta2Text: t('dest.fast', 'Rápido'),
    },
    {
      id: 4, image: calca,
      priceTag: 'Cusco - Calca · S/ 20',
      title: t('dest.4.title', 'Ruta Valle Sagrado'),
      description: t('dest.4.desc', 'Transporte frecuente hacia el corazón de Calca en camionetas modernas.'),
      meta1Icon: '🗺️', meta1Text: t('dest.valley', 'Valle'),
      meta2Icon: '🕐', meta2Text: t('dest.frequent', 'Frecuente'),
    },
    {
      id: 5, image: ollantaytambo,
      priceTag: 'Cusco - Ollantaytambo · S/ 30',
      title: t('dest.5.title', 'Conexión Trenes'),
      description: t('dest.5.desc', 'Llega a tiempo para tu tren a Machu Picchu con nuestro servicio ejecutivo.'),
      meta1Icon: '🚂', meta1Text: t('dest.train', 'Tren'),
      meta2Icon: '⚡', meta2Text: t('dest.punctual', 'Puntual'),
    },
    {
      id: 6, image: lima,
      priceTag: 'Cusco - Lima · S/ 180',
      title: t('dest.6.title', 'Ruta Nacional'),
      description: t('dest.6.desc', 'Servicio especial hacia la capital con GPS y monitoreo 24/7.'),
      meta1Icon: '🛣️', meta1Text: t('dest.direct', 'Directo'),
      meta2Icon: '⭐', meta2Text: t('dest.executive', 'Ejecutivo'),
    },
    {
      id: 7, image: abancay,
      priceTag: 'Cusco - Abancay · S/ 50',
      title: t('dest.7.title', 'Ruta Interurbana'),
      description: t('dest.7.desc', 'La opción más veloz y segura para viajar hacia Abancay.'),
      meta1Icon: '🏎️', meta1Text: t('dest.veloz', 'Veloz'),
      meta2Icon: '🛡️', meta2Text: t('dest.secure', 'Seguro'),
    },
  ];

  return (
    <section id="rutas" className="destinations-section py-5">
      <div className="container">
        <div className="section-header text-center">
          <span className="subtitle">{t('dest.subtitle', 'Transporte de Pasajeros')}</span>
          <h2>{t('dest.title', 'Rutas y Destinos')}</h2>
          <div className="divider"></div>
        </div>

        <div className="destinations-grid">
          {destinations.map(dest => (
            <article key={dest.id} className="destination-card fade-in">
              <div className="card-image">
                <img src={dest.image} alt={dest.title} loading="lazy" />
                <div className="price-tag">{dest.priceTag}</div>
              </div>
              <div className="card-content">
                <h3>{dest.title}</h3>
                <p>{dest.description}</p>
                <div className="card-meta">
                  <span>{dest.meta1Icon} {dest.meta1Text}</span>
                  <span>{dest.meta2Icon} {dest.meta2Text}</span>
                </div>
                <div className="card-actions">
                  <a 
                    href={`https://wa.me/51997475405?text=Hola,%20quiero%20información%20sobre%20la%20ruta%20${encodeURIComponent(dest.title)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-text"
                  >
                    {t('dest.enquire', 'Consultar Ahora')} →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
