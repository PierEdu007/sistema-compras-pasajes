import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaClock, FaCar, FaTicketAlt, FaSuitcase, 
  FaChevronDown, FaArrowRight, FaWhatsapp, FaQuestionCircle 
} from 'react-icons/fa';
import '../../styles/components/TravelGuideSEO.css';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function TravelGuideSEO() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [openFaq, setOpenFaq] = useState<number | null>(1);

  const toggleFaq = (id: number) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: isEn 
        ? 'How much is the ticket from Cusco to Quillabamba?' 
        : '¿Cuánto cuesta el pasaje de Cusco a Quillabamba?',
      answer: isEn
        ? 'The ticket from Cusco to Quillabamba costs from S/ 50.00 in modern 4-passenger cars and executive 6-passenger minivans. Fares include assigned seating, luggage allowance, and SOAT insurance.'
        : 'El pasaje de Cusco a Quillabamba cuesta desde S/ 50.00 en autos modernos de 4 pasajeros y minivans ejecutivas de 6 pasajeros. La tarifa incluye asiento asignado, equipaje y seguro contra accidentes SOAT.'
    },
    {
      id: 2,
      question: isEn 
        ? 'What are the departure times for trips to Quillabamba?' 
        : '¿Cuáles son los horarios de salida para viajar a Quillabamba?',
      answer: isEn
        ? 'We operate daily departures from 5:00 AM to 8:00 PM, with units leaving approximately every hour. You can check all real-time departures and available seats directly on our online platform.'
        : 'Tenemos salidas diarias continuas desde las 5:00 AM hasta las 8:00 PM con frecuencias aproximadas cada hora. Puedes consultar todos los horarios en tiempo real y la disponibilidad de asientos directamente en nuestra plataforma online.'
    },
    {
      id: 3,
      question: isEn 
        ? 'Where are the terminals / boarding offices located in Cusco and Quillabamba?' 
        : '¿Dónde se toman los autos o minivans en Cusco y en Quillabamba?',
      answer: isEn
        ? 'In Cusco, our main office and boarding terminal is located at Av. Antonio Lorena 318, Santiago. In Quillabamba, we are located in the central transport area. You can also contact us on WhatsApp at +51 997 475 405.'
        : 'En Cusco, nuestra oficina y terminal de embarque se encuentra en Av. Antonio Lorena 318, Santiago. En Quillabamba atendemos en la zona céntrica de transporte. También puedes consultar cualquier duda al WhatsApp +51 997 475 405.'
    },
    {
      id: 4,
      question: isEn 
        ? 'How can I buy my ticket online with instant confirmation?' 
        : '¿Cómo compro mi pasaje por internet con confirmación inmediata?',
      answer: isEn
        ? 'Select your route, travel date, choose your preferred seat on the interactive seat map, enter passenger details, and pay securely using Yape, Plin, or credit/debit card. Your travel ticket and official electronic receipt are generated immediately.'
        : 'Solo debes seleccionar tu fecha, elegir tu asiento favorito en el mapa interactivo, ingresar tus datos de pasajero y pagar al instante con Yape, Plin o tarjeta bancaria. Tu boleto de viaje y comprobante electrónico SUNAT se emiten de inmediato.'
    },
    {
      id: 5,
      question: isEn 
        ? 'Do you provide parcel delivery and money transfer services?' 
        : '¿Realizan servicio de encomiendas y giros entre Cusco y Quillabamba?',
      answer: isEn
        ? 'Yes, we provide same-day urgent parcel, package, and money transfer services between Cusco and Quillabamba with high security, GPS tracking, and delivery receipts.'
        : 'Sí, brindamos servicio express de encomiendas, paquetería y giros con entrega el mismo día entre Cusco y Quillabamba, con total seguridad, monitoreo y cargo de recepción.'
    },
    {
      id: 6,
      question: isEn 
        ? 'How is the route and what should I wear for the trip?' 
        : '¿Cómo es la ruta y qué ropa se recomienda llevar para el viaje?',
      answer: isEn
        ? 'The journey takes about 4.5 hours via the paved highway passing Ollantaytambo and the high Abra Málaga pass (4,316m) before descending into the warm tropical valley of Quillabamba (1,050m). We recommend bringing light clothing for Quillabamba and a jacket for the mountain pass.'
        : 'El viaje dura aproximadamente 4 horas y media por la carretera asfaltada que cruza Ollantaytambo y el Abra Málaga (4,316 msnm) para luego descender al valle cálido de Quillabamba (1,050 msnm). Se recomienda llevar ropa ligera para el calor de la selva y una casaca para el paso de altura.'
    }
  ];

  return (
    <section className="travel-guide-section" id="guia-viaje">
      <div className="container">
        {/* Header SEO */}
        <div className="travel-guide-header">
          <span className="travel-guide-subtitle">
            {isEn ? 'Travel Guide & Transport Info' : 'Guía de Viaje y Transporte Oficial'}
          </span>
          <h2 className="travel-guide-title">
            {isEn 
              ? 'Complete Guide for Your Trip from Cusco to Quillabamba' 
              : 'Guía Completa para tu Viaje de Cusco a Quillabamba'}
          </h2>
          <p className="travel-guide-desc">
            {isEn
              ? 'Everything you need to know about schedules, fares, modern vehicles, routes, and tips for traveling safely to La Convención.'
              : 'Todo lo que necesitas saber sobre horarios, precios, vehículos modernos, rutas y consejos para viajar seguro a la provincia de La Convención.'}
          </p>
        </div>

        {/* 4 Feature Highlights Grid */}
        <div className="travel-guide-grid">
          <div className="travel-guide-card">
            <div className="travel-guide-icon-wrap">
              <FaClock />
            </div>
            <h3>{isEn ? '4.5 Hours Direct Route' : '4.5 Horas · Ruta Directa'}</h3>
            <p>
              {isEn
                ? 'Daily journeys via the paved highway through Ollantaytambo, Abra Málaga, and Santa María with professional experienced drivers.'
                : 'Viajes diarios por carretera 100% asfaltada pasando por Ollantaytambo, Abra Málaga y Santa María con conductores profesionales.'}
            </p>
          </div>

          <div className="travel-guide-card">
            <div className="travel-guide-icon-wrap">
              <FaCar />
            </div>
            <h3>{isEn ? 'Modern 4p & 6p Vehicles' : 'Autos 4p y Minivans 6p'}</h3>
            <p>
              {isEn
                ? 'Travel in comfort with modern sedans and executive 3-row minivans equipped with 24/7 GPS tracking, air conditioning, and full SOAT insurance.'
                : 'Viaja con comodidad en autos compactos y minivans de 3 filas con GPS en tiempo real, aire acondicionado y SOAT vigente.'}
            </p>
          </div>

          <div className="travel-guide-card">
            <div className="travel-guide-icon-wrap">
              <FaTicketAlt />
            </div>
            <h3>{isEn ? 'Online Booking from S/ 50' : 'Pasajes desde S/ 50.00'}</h3>
            <p>
              {isEn
                ? 'Select your seat online, lock it in real-time, and pay easily with Yape, Plin, or bank cards with official SUNAT electronic invoicing.'
                : 'Elige tu asiento online, resérvalo en tiempo real y paga al instante con Yape, Plin o tarjeta con boleta electrónica SUNAT.'}
            </p>
          </div>

          <div className="travel-guide-card">
            <div className="travel-guide-icon-wrap">
              <FaSuitcase />
            </div>
            <h3>{isEn ? 'Luggage & Daily Departures' : 'Equipaje y Salidas Diarias'}</h3>
            <p>
              {isEn
                ? 'Continuous departures every day from 5:00 AM to 8:00 PM. Luggage allowance included at no extra cost.'
                : 'Salidas continuas todos los días de 5:00 AM a 8:00 PM desde el terminal de Cusco. Equipaje de mano y bodega incluido.'}
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="faq-container">
          <h3 className="faq-header-title">
            <FaQuestionCircle style={{ color: '#00AEEF', marginRight: '8px' }} />
            {isEn ? 'Frequently Asked Questions (FAQ)' : 'Preguntas Frecuentes sobre el Viaje'}
          </h3>

          <div className="faq-list">
            {faqItems.map((item) => {
              const isOpen = openFaq === item.id;
              return (
                <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button 
                    className="faq-question-btn"
                    onClick={() => toggleFaq(item.id)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <FaChevronDown className="faq-toggle-icon" />
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="travel-guide-cta">
            <a 
              href="/viajes?origen=CUSCO&destino=QUILLABAMBA" 
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontWeight: 'bold', borderRadius: '10px' }}
            >
              <span>{isEn ? 'Buy Cusco - Quillabamba Ticket' : 'Comprar Pasaje Cusco - Quillabamba'}</span>
              <FaArrowRight style={{ marginLeft: '6px' }} />
            </a>

            <a 
              href="https://wa.me/51997475405?text=Hola,%20solicito%20información%20sobre%20los%20viajes%20a%20Quillabamba."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '12px 24px', fontWeight: 'bold', borderRadius: '10px', background: '#25D366', color: '#ffffff', borderColor: '#25D366' }}
            >
              <FaWhatsapp style={{ marginRight: '6px', fontSize: '1.2rem' }} />
              <span>{isEn ? 'Consult on WhatsApp' : 'Consultar al WhatsApp 997475405'}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
