import { useTranslation } from 'react-i18next';
import '../../styles/components/Testimonials.css';

import authorCarlos from '../../assets/testimonials/author-carlos.png';
import authorElena from '../../assets/testimonials/author-elena.png';
import authorJorge from '../../assets/testimonials/author-jorge.png';

export default function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      id: 1,
      text: t('test.1.text', '"Excelente servicio, muy rápido y las camionetas son muy cómodas. Recomendado al 100%."'),
      name: 'Carlos M.',
      role: t('test.1.role', 'Pasajero Frecuente'),
      image: authorCarlos,
    },
    {
      id: 2,
      text: t('test.2.text', '"La mejor opción para enviar encomiendas a Quillabamba. Muy confiables y puntuales."'),
      name: 'Elena R.',
      role: t('test.2.role', 'Comerciante'),
      image: authorElena,
    },
    {
      id: 3,
      text: t('test.3.text', '"Conductores profesionales y muy amables. La forma más segura de viajar por la ruta."'),
      name: 'Jorge L.',
      role: t('test.3.role', 'Viajero Ejecutivo'),
      image: authorJorge,
    },
  ];

  return (
    <section className="testimonials-section py-5">
      <div className="container">
        <div className="section-header text-center">
          <span className="subtitle">{t('test.subtitle', 'Testimonios')}</span>
          <h2>{t('test.title', 'Lo que dicen nuestros pasajeros')}</h2>
          <div className="divider"></div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map(test => (
            <div key={test.id} className="testimonial-card fade-in">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">{test.text}</p>
              <div className="testimonial-author">
                <img src={test.image} alt={test.name} className="author-img" loading="lazy" />
                <div className="author-info">
                  <h4>{test.name}</h4>
                  <span>{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
