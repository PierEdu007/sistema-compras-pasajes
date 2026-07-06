import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaCouch, FaStopwatch } from 'react-icons/fa';

export default function Benefits() {
  const { t } = useTranslation();

  const benefitsList = [
    {
      id: 'security',
      icon: <FaShieldAlt />,
      title: t('benefits.security.title', 'SEGURIDAD:'),
      desc: t('benefits.security.desc', 'Nuestras unidades cuentan con sistemas de última generación: sistema de frenos neumático y retardador electromagnético, dirección asistida, monitoreo de ubicación y velocidad mediante sistema GPS.')
    },
    {
      id: 'comfort',
      icon: <FaCouch />,
      title: t('benefits.comfort.title', 'COMODIDAD:'),
      desc: t('benefits.comfort.desc', 'Nuestros vehículos cuentan con sillones ergonómicos, aire acondicionado, calefacción, cargadores USB, equipos de audio y video, sistema de renovación de aire continuo.')
    },
    {
      id: 'punctuality',
      icon: <FaStopwatch />,
      title: t('benefits.punctuality.title', 'PUNTUALIDAD:'),
      desc: t('benefits.punctuality.desc', 'La puntualidad como valor fundamental. Inversiones K\'intu S.R.L. garantiza el cumplimiento de los horarios establecidos para la prestación de los servicios ofertados.')
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
