import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaSatelliteDish, FaFileInvoiceDollar, FaHeadset } from 'react-icons/fa';
import '../../styles/components/TrustBar.css';

const TrustBar: React.FC = () => {
  const { t } = useTranslation();

  const trustItems = [
    {
      id: 'security',
      icon: <FaShieldAlt />,
      iconClass: 'trust-icon-security',
      title: t('trust.security.title', 'Compra 100% Segura'),
      desc: t('trust.security.desc', 'Cifrado SSL 256 bits y pagos protegidos'),
    },
    {
      id: 'gps',
      icon: <FaSatelliteDish />,
      iconClass: 'trust-icon-gps',
      title: t('trust.gps.title', 'Monitoreo GPS 24/7'),
      desc: t('trust.gps.desc', 'Flota moderna fiscalizada y SOAT vigente'),
    },
    {
      id: 'sunat',
      icon: <FaFileInvoiceDollar />,
      iconClass: 'trust-icon-sunat',
      title: t('trust.sunat.title', 'Comprobante SUNAT'),
      desc: t('trust.sunat.desc', 'Boleta o Factura electrónica al instante'),
    },
    {
      id: 'support',
      icon: <FaHeadset />,
      iconClass: 'trust-icon-support',
      title: t('trust.support.title', 'Soporte y Asistencia'),
      desc: t('trust.support.desc', 'Atención personalizada antes y durante tu viaje'),
    },
  ];

  return (
    <section className="trust-bar-section">
      <div className="container">
        <div className="trust-bar-grid">
          {trustItems.map((item) => (
            <div key={item.id} className="trust-bar-item">
              <div className={`trust-bar-icon-box ${item.iconClass}`}>
                {item.icon}
              </div>
              <div className="trust-bar-text">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
