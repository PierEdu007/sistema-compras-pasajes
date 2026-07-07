import { useTranslation } from 'react-i18next';
import { FaShippingFast, FaClock, FaUserShield } from 'react-icons/fa';

export default function Benefits() {
  const { t } = useTranslation();

  const benefitsList = [
    {
      id: 'cargo',
      icon: <FaShippingFast />,
      title: t('benefits.cargo.title', 'ENCOMIENDAS Y GIROS:'),
      desc: t('benefits.cargo.desc', 'Envío de sobres, paquetes y giros de dinero con la mayor seguridad y rapidez del mercado.')
    },
    {
      id: 'departures',
      icon: <FaClock />,
      title: t('benefits.departures.title', 'SALIDAS DIARIAS:'),
      desc: t('benefits.departures.desc', 'Programación constante hacia Hidroeléctrica, Quillabamba, Lima y más destinos estratégicos.')
    },
    {
      id: 'drivers',
      icon: <FaUserShield />,
      title: t('benefits.drivers.title', 'CONDUCTORES EXPERTOS:'),
      desc: t('benefits.drivers.desc', 'Conductores profesionales con amplia experiencia en rutas altoandinas y de selva.')
    }
  ];

  return (
    <section className="benefits-section py-5">
      <div className="container">
        <div className="benefits-grid">
          {benefitsList.map(benefit => (
            <div key={benefit.id} className="benefit-card slide-up">
              <div className="benefit-icon">{benefit.icon}</div>
              <div className="benefit-content">
                <h3>{benefit.title}</h3>
                <p>{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
