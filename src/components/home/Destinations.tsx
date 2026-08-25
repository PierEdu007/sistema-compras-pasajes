import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaBolt, FaCouch, FaSun, FaRoad, FaLeaf, FaTachometerAlt, 
  FaMapMarkedAlt, FaClock, FaTrain, FaStar, FaShieldAlt, FaArrowRight,
  FaTimes, FaCompass, FaMapPin, FaCloudSun, FaMountain, FaUtensils, FaInfoCircle, FaWhatsapp
} from 'react-icons/fa';
import '../../styles/components/Destinations.css';

// Import destination images
import machuPicchu from '../../assets/destinations/machu-picchu.png';
import quillabamba from '../../assets/destinations/quillabamba.png';
import quellouno from '../../assets/destinations/quellouno.png';
import calca from '../../assets/destinations/calca.png';
import ollantaytambo from '../../assets/destinations/ollantaytambo.png';
import lima from '../../assets/destinations/lima.png';
import abancay from '../../assets/destinations/abancay.png';

interface TouristInfo {
  placeName: string;
  subtitle: string;
  touristDescription: string;
  altitude: string;
  climate: string;
  duration: string;
  highlights: string[];
  gastronomy: string;
  tips: string;
}

interface Destination {
  id: number;
  image: string;
  priceTag: string;
  title: string;
  description: string;
  meta1Icon: ReactNode;
  meta1Text: string;
  meta2Icon: ReactNode;
  meta2Text: string;
  touristInfo: TouristInfo;
}

export default function Destinations() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const [activeModal, setActiveModal] = useState<Destination | null>(null);

  const destinations: Destination[] = [
    {
      id: 1, 
      image: machuPicchu,
      priceTag: 'Cusco - Hidroeléctrica · S/ 60',
      title: t('dest.1.title', 'Ruta a Machu Picchu'),
      description: t('dest.1.desc', 'Servicio directo y veloz para turistas y locales buscando puntualidad.'),
      meta1Icon: <FaBolt />, meta1Text: t('dest.express', 'Express'),
      meta2Icon: <FaCouch />, meta2Text: t('dest.comfort', 'Confort'),
      touristInfo: {
        placeName: isEn ? 'Machu Picchu (Hidroeléctrica / Santa Teresa)' : 'Machu Picchu (Ruta Hidroeléctrica / Santa Teresa)',
        subtitle: isEn ? 'The most scenic and popular alternative gateway to Machu Picchu' : 'La ruta alternativa y más económica hacia la Maravilla del Mundo',
        touristDescription: isEn
          ? 'From Hidroeléctrica, travelers enjoy a scenic and flat 2.5 to 3-hour walk following the railway through lush cloud forest and riverside flora straight into Aguas Calientes (Machu Picchu Pueblo).'
          : 'Desde Hidroeléctrica se realiza una hermosa caminata plana de 2.5 a 3 horas junto a las vías del tren, rodeado de ceja de selva, cascadas y abundante vegetación tropical hasta llegar a Aguas Calientes (Machu Picchu Pueblo).',
        altitude: '1,800 msnm',
        climate: isEn ? 'Warm & humid (18°C - 26°C)' : 'Cálido y húmedo (18°C - 26°C)',
        duration: isEn ? 'Approx. 5.5 hours' : 'Aprox. 5.5 horas',
        highlights: isEn
          ? ['Scenic Urubamba river walk', 'Cocalmayo thermal hot springs', 'Orchids & Andean Cock-of-the-rock', 'Stunning mountain viewpoints']
          : ['Caminata escénica junto al río Urubamba', 'Baños termales de Cocalmayo (Santa Teresa)', 'Flora tropical y Gallito de las Rocas', 'Vistas panorámicas de la ceja de selva'],
        gastronomy: isEn ? 'Fried fresh trout, organic jungle coffee, fresh tropical juices, and local fruits.' : 'Trucha frita de río, café orgánico de exportación, jugos de frutas tropicales frescas y comidas típicas.',
        tips: isEn 
          ? 'Bring insect repellent, comfortable trekking shoes, raincoat, plenty of water, and sunscreen. Start the hike before 3:00 PM.'
          : 'Llevar repelente de mosquitos, calzado cómodo de caminata, poncho de lluvia, agua y protector solar. Iniciar la caminata antes de las 3:00 PM.'
      }
    },
    {
      id: 2, 
      image: quillabamba,
      priceTag: 'Cusco - Quillabamba · S/ 50',
      title: t('dest.2.title', 'Ruta de la Convención'),
      description: t('dest.2.desc', 'Viajes diarios por la ruta Málaga con conductores expertos.'),
      meta1Icon: <FaSun />, meta1Text: t('dest.daily', 'Diario'),
      meta2Icon: <FaRoad />, meta2Text: 'Málaga',
      touristInfo: {
        placeName: isEn ? 'Quillabamba (City of Eternal Summer)' : 'Quillabamba (La Ciudad del Eterno Verano)',
        subtitle: isEn ? 'Capital of La Convención • Land of World-Class Coffee & Chuncho Cacao' : 'Capital de la provincia de La Convención • Cuna del Café y Cacao Chuncho',
        touristDescription: isEn
          ? 'Famous for its warm year-round weather, welcoming local culture, natural water parks, spectacular waterfalls, and the highest quality organic coffee and cacao production in Peru.'
          : 'Famosa por su clima cálido y veraniego durante todo el año, la alegría de su gente, sus balnearios naturales de aguas cristalinas y por ser el corazón de las mejores plantaciones de café y cacao del Perú.',
        altitude: '1,050 msnm',
        climate: isEn ? 'Tropical & sunny (20°C - 32°C)' : 'Tropical cálido (20°C - 32°C)',
        duration: isEn ? 'Approx. 4.5 hours' : 'Aprox. 4.5 horas',
        highlights: isEn
          ? ['Sambaray natural river resort', 'Yanay & Illapani waterfalls', 'Torrechayoc Canyon', 'Chuncho Cacao & Coffee tours']
          : ['Balneario recreacional de Sambaray', 'Cascadas de Yanay e Illapani', 'Cañón de Torrechayoc', 'Rutas de Café de Especialidad y Cacao'],
        gastronomy: isEn ? 'Unico Cacao Chuncho chocolate, specialty coffee, grilled river fish, caldo de gallina, and tropical citrus.' : 'Chocolate de Cacao Chuncho puro, café pasado tradicional, caldo de gallina de chacra, trucha y cítricos frescos.',
        tips: isEn 
          ? 'Pack light cotton clothing, swimwear for the rivers, sunglasses, and a light jacket for the high mountain pass (Abra Málaga at 4,316m) during transit.'
          : 'Llevar ropa ligera de algodón, ropa de baño para los balnearios, lentes de sol y una casaca para el paso del Abra Málaga (4,316 msnm) durante el viaje.'
      }
    },
    {
      id: 3, 
      image: quellouno,
      priceTag: 'Cusco - Quellouno · S/ 50',
      title: t('dest.3.title', 'Ruta Quellouno'),
      description: t('dest.3.desc', 'Conexión rápida y segura hacia el valle de Quellouno todos los días.'),
      meta1Icon: <FaLeaf />, meta1Text: t('dest.jungle', 'Selva'),
      meta2Icon: <FaTachometerAlt />, meta2Text: t('dest.fast', 'Rápido'),
      touristInfo: {
        placeName: isEn ? 'Quellouno (Tropical Agricultural Paradise)' : 'Quellouno (Valle Fértil de la Selva Cusqueña)',
        subtitle: isEn ? 'Untouched nature, crystal-clear rivers, and rich agriculture' : 'Naturaleza viva, ríos cristalinos y riqueza agrícola',
        touristDescription: isEn
          ? 'A lush and tranquil tropical valley renowned for its pristine jungle streams, peaceful rural tourism, exotic bird watching, and endless plantations of citrus, cacao, and bananas.'
          : 'Un paraíso escondido de selva alta cusqueña, ideal para el descanso, el turismo vivencial, el avistamiento de aves y el disfrute de arroyos cristalinos y abundante vegetación.',
        altitude: '800 msnm',
        climate: isEn ? 'Warm tropical (22°C - 34°C)' : 'Cálido tropical (22°C - 34°C)',
        duration: isEn ? 'Approx. 5.5 hours' : 'Aprox. 5.5 horas',
        highlights: isEn
          ? ['Pristine river bathing spots', 'Virgin waterfalls & trails', 'Exotic birdwatching', 'Agricultural farm tours']
          : ['Pozas y balnearios naturales', 'Cataratas vírgenes y senderismo', 'Avistamiento de aves de selva', 'Fincas agrícolas tradicionales'],
        gastronomy: isEn ? 'Fried plantains, fresh yuca, organic coffee, and tropical fruit gastronomy.' : 'Yuca frita, plátano asado, pescados de río, café fresco y frutas exóticas recién cosechadas.',
        tips: isEn 
          ? 'Bring insect repellent, comfortable light clothing, sandals, and a camera for exotic wildlife.'
          : 'Llevar repelente, ropa muy fresca, sandalias para el río y cámara para fotografiar aves exóticas.'
      }
    },
    {
      id: 4, 
      image: calca,
      priceTag: 'Cusco - Calca · S/ 20',
      title: t('dest.4.title', 'Ruta Valle Sagrado'),
      description: t('dest.4.desc', 'Transporte frecuente hacia el corazón de Calca en autos modernos.'),
      meta1Icon: <FaMapMarkedAlt />, meta1Text: t('dest.valley', 'Valle'),
      meta2Icon: <FaClock />, meta2Text: t('dest.frequent', 'Frecuente'),
      touristInfo: {
        placeName: isEn ? 'Calca (Heart of the Sacred Valley)' : 'Calca (El Corazón del Valle Sagrado)',
        subtitle: isEn ? 'Surrounded by Sacred Glaciers Pitusiray & Sawasiray' : 'Custodiada por los majestuosos nevados Pitusiray y Sawasiray',
        touristDescription: isEn
          ? 'Nestled in the prime climate of the Sacred Valley, Calca is famous for its natural hot springs, colorful local markets, and ancient Inca archaeological complexes like Huchuy Qosqo.'
          : 'Ubicada en el mejor clima del Valle Sagrado de los Incas, Calca destaca por sus reconocidas fuentes termomedicinales, ferias tradicionales y el imponente sitio inca de Huchuy Qosqo.',
        altitude: '2,928 msnm',
        climate: isEn ? 'Mild & sunny (12°C - 23°C)' : 'Templado andino (12°C - 23°C)',
        duration: isEn ? 'Approx. 50 minutes' : 'Aprox. 50 minutos',
        highlights: isEn
          ? ['Machacancha & Minas Moqo Hot Springs', 'Huchuy Qosqo Archaeological Site', 'Traditional Sunday Farmer Market', 'Inca trails & scenic valley walks']
          : ['Baños termales de Machacancha y Minas Moqo', 'Complejo Arqueológico Huchuy Qosqo', 'Mercado tradicional de productores', 'Senderos y miradores del Valle Sagrado'],
        gastronomy: isEn ? 'Baked guinea pig, fresh giant Sacred Valley corn with cheese, and artisanal chicha.' : 'Cuy al horno, choclo gigante del Valle Sagrado con queso, chairo andino y trucha.',
        tips: isEn 
          ? 'Great quick day trip from Cusco. Bring a towel and swimwear for the thermal baths.'
          : 'Excelente viaje rápido de día desde Cusco. Llevar toalla y ropa de baño para las aguas termales.'
      }
    },
    {
      id: 5, 
      image: ollantaytambo,
      priceTag: 'Cusco - Ollantaytambo · S/ 30',
      title: t('dest.5.title', 'Conexión Trenes'),
      description: t('dest.5.desc', 'Llega a tiempo para tu tren a Machu Picchu con nuestro servicio ejecutivo.'),
      meta1Icon: <FaTrain />, meta1Text: t('dest.train', 'Tren'),
      meta2Icon: <FaBolt />, meta2Text: t('dest.punctual', 'Puntual'),
      touristInfo: {
        placeName: isEn ? 'Ollantaytambo (The Living Inca Town)' : 'Ollantaytambo (La Ciudad Inca Viviente)',
        subtitle: isEn ? 'Epic Inca Fortress and Main Train Station to Machu Picchu' : 'Impresionante Fortaleza Inca y Estación Principal de Trenes',
        touristDescription: isEn
          ? 'The only living Inca town in Peru that preserves its original pre-Columbian urban layout. Its massive ceremonial fortress and bustling railway station make it a must-visit destination.'
          : 'El único pueblo incaico habitado que conserva intacto su trazado urbano original. Su monumental fortaleza ceremonial y su estación de trenes lo convierten en paso obligado para todo viajero.',
        altitude: '2,792 msnm',
        climate: isEn ? 'Mild & dry (11°C - 22°C)' : 'Templado seco (11°C - 22°C)',
        duration: isEn ? 'Approx. 1.5 hours' : 'Aprox. 1.5 horas',
        highlights: isEn
          ? ['Sun Temple & Ollantaytambo Fortress', 'Pinkuylluna Inca storehouses', 'Ancient cobblestone Inca streets', 'Scenic railway gateway to Machu Picchu']
          : ['Fortaleza y Templo del Sol de Ollantaytambo', 'Qollqas incas de Pinkuylluna', 'Calles empedradas prehispánicas', 'Estación de trenes hacia Aguas Calientes'],
        gastronomy: isEn ? 'Artisanal Sacred Valley craft beer, alpaca steaks, roasted corn, and organic coffee.' : 'Carne de alpaca en salsa andina, cerveza artesanal del valle, choclo con queso y postres locales.',
        tips: isEn 
          ? 'Book your transfer with at least 1.5 hours advance notice before your train departure time.'
          : 'Planificar el viaje con al menos 1.5 horas de anticipación a la hora de salida de su tren.'
      }
    },
    {
      id: 6, 
      image: lima,
      priceTag: 'Cusco - Lima · S/ 180',
      title: t('dest.6.title', 'Ruta Nacional'),
      description: t('dest.6.desc', 'Servicio especial hacia la capital con GPS y monitoreo 24/7.'),
      meta1Icon: <FaRoad />, meta1Text: t('dest.direct', 'Directo'),
      meta2Icon: <FaStar />, meta2Text: t('dest.executive', 'Ejecutivo'),
      touristInfo: {
        placeName: isEn ? 'Lima (City of the Kings & Gastronomic Capital)' : 'Lima (La Ciudad de los Reyes • Capital Gastronómica)',
        subtitle: isEn ? 'Direct executive connection connecting the Andes with the Pacific Coast' : 'Conexión ejecutiva y corporativa directa Andes - Costa del Pacífico',
        touristDescription: isEn
          ? 'The capital of Peru, world-renowned as the Gastronomic Capital of the Americas. Offers a rich blend of pre-Inca ruins, colonial architecture, cliffside ocean walks, and award-winning culinary scene.'
          : 'Capital del Perú y Capital Gastronómica de América. Una fascinante mezcla de historia colonial, centros arqueológicos milenarios, malecones frente al océano Pacífico y la mejor gastronomía marina del mundo.',
        altitude: '150 msnm',
        climate: isEn ? 'Mild coastal (16°C - 25°C)' : 'Templado costero (16°C - 25°C)',
        duration: isEn ? 'Direct Long-Distance Route' : 'Servicio Especial Larga Distancia',
        highlights: isEn
          ? ['UNESCO Historic Center & Plaza Mayor', 'Miraflores Malecon & Larcomar cliffs', 'Bohemian district of Barranco', 'World-famous Ceviche & Pisco Sour']
          : ['Centro Histórico y Plaza Mayor de Lima', 'Malecón de Miraflores y Larcomar', 'Distrito bohemio y cultural de Barranco', 'Circuito de la mejor gastronomía marina'],
        gastronomy: isEn ? 'Authentic Peruvian Ceviche, Lomo Saltado, Causa Rellena, Anticuchos, and Pisco Sour.' : 'Ceviche tradicional, lomo saltado, causa limeña, anticuchos y pisco sour.',
        tips: isEn 
          ? 'Direct executive charter service. Contact via WhatsApp to schedule tailored departure times and baggage arrangements.'
          : 'Servicio especial previa coordinación. Comunícate por WhatsApp para coordinar horarios y puntos de recojo.'
      }
    },
    {
      id: 7, 
      image: abancay,
      priceTag: 'Cusco - Abancay · S/ 50',
      title: t('dest.7.title', 'Ruta Interurbana'),
      description: t('dest.7.desc', 'La opción más veloz y segura para viajar hacia Abancay.'),
      meta1Icon: <FaTachometerAlt />, meta1Text: t('dest.veloz', 'Veloz'),
      meta2Icon: <FaShieldAlt />, meta2Text: t('dest.secure', 'Seguro'),
      touristInfo: {
        placeName: isEn ? 'Abancay (City of the Rising Sun • Apurímac)' : 'Abancay (Ciudad del Sol Naciente • Apurímac)',
        subtitle: isEn ? 'Gateway to the Ampay National Sanctuary and deep Andean canyons' : 'Puerta de entrada al Santuario Nacional de Ampay y valles cálidos',
        touristDescription: isEn
          ? 'Surrounded by stunning mountain ranges and deep canyons, Abancay enjoys a perpetual spring climate. Home to the Ampay Sanctuary with unique intimpa forests, glacier lakes, and colonial bridges.'
          : 'Hermosa ciudad interandina con clima primaveral constante, rodeada por el majestuoso nevado Ampay y cañones impresionantes. Es la puerta de entrada a los bosques de intimpa y lagunas glaciares.',
        altitude: '2,377 msnm',
        climate: isEn ? 'Spring-like & sunny (14°C - 26°C)' : 'Primaveral templado (14°C - 26°C)',
        duration: isEn ? 'Approx. 4 hours' : 'Aprox. 4 horas',
        highlights: isEn
          ? ['Ampay National Sanctuary & Glacial Lakes', 'Historic Colonial Pachachaca Bridge', 'Thermal baths of Cconoc', 'Scenic viewpoints over Apurimac River Canyon']
          : ['Santuario Nacional de Ampay y Laguna Chica/Grande', 'Puente colonial histórico de Pachachaca', 'Baños termales de Cconoc', 'Miradores del cañón del río Apurímac'],
        gastronomy: isEn ? 'Tallarines de casa con estofado de gallina, kapchi de habas, cuy chactado, and fresh cheeses.' : 'Tallarines de casa con estofado de gallina, kapchi de habas, cuy chactado y quesos frescos.',
        tips: isEn 
          ? 'Great gateway for adventure lovers and trekking to Ampay Sanctuary. Travel in lightweight clothing with a jacket for the evening.'
          : 'Excelente destino para los amantes del trekking y la naturaleza. Ropa cómoda de media estación.'
      }
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
              {/* Clickable Image with Tourist Badge */}
              <div 
                className="card-image card-clickable-area"
                onClick={() => setActiveModal(dest)}
                title={isEn ? "Click to view tourist guide" : "Haz clic para ver información turística"}
              >
                <div className="tourist-info-badge">
                  <FaInfoCircle /> {isEn ? 'Tourist Info' : 'Info Turística'}
                </div>
                <img src={dest.image} alt={dest.title} loading="lazy" />
                {dest.id === 1 && <div className="card-machupicchu-fog" />}
                <div className="price-tag">{dest.priceTag}</div>
              </div>

              <div className="card-content">
                {/* Clickable Title & Description */}
                <div 
                  className="card-clickable-area"
                  onClick={() => setActiveModal(dest)}
                  title={isEn ? "Click to view tourist guide" : "Haz clic para ver información turística"}
                >
                  <h3>{dest.title}</h3>
                  <p>{dest.description}</p>
                </div>

                <div className="card-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{dest.meta1Icon} {dest.meta1Text}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{dest.meta2Icon} {dest.meta2Text}</span>
                </div>

                <div className="card-actions">
                  {dest.id === 2 ? (
                    <a 
                      href="/viajes?origen=CUSCO&destino=QUILLABAMBA"
                      className="btn-text btn-book"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#742284', fontWeight: 'bold' }}
                    >
                      <span>{t('dest.bookNow', 'Comprar Pasaje')}</span>
                      <FaArrowRight />
                    </a>
                  ) : (
                    <a 
                      href={`https://wa.me/51997475405?text=Hola,%20quiero%20información%20sobre%20la%20ruta%20${encodeURIComponent(dest.title)}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-text"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>{t('dest.enquire', 'Consultar Ahora')}</span>
                      <FaArrowRight />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* === Tourist Information Modal === */}
      {activeModal && createPortal(
        <div 
          className="destination-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="destination-modal-box">
            {/* Close Button Pinned at Top */}
            <button 
              className="destination-modal-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Cerrar"
              title="Cerrar"
            >
              <FaTimes />
            </button>

            {/* Scrollable Container (Hero + Content) */}
            <div className="destination-modal-scroll-area">
              {/* Hero Image Banner */}
              <div className="destination-modal-hero">
                <img src={activeModal.image} alt={activeModal.title} />
                {activeModal.id === 1 && <div className="card-machupicchu-fog" />}
                <div className="destination-modal-hero-badge">
                  <FaCompass /> {isEn ? 'Tourist Guide' : 'Guía Turística'}
                </div>
              </div>

              {/* Title & Tourist Details */}
              <div className="destination-modal-content">
                <div className="destination-modal-title-box">
                  <span className="destination-modal-tag">
                    <FaMapPin /> {activeModal.priceTag.split('·')[0].trim()}
                  </span>
                  <h2 className="destination-modal-title">
                    {activeModal.touristInfo.placeName}
                  </h2>
                  <p className="destination-modal-subtitle">
                    {activeModal.touristInfo.subtitle}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="tourist-quick-info-grid">
                  <div className="tourist-info-chip">
                    <span className="tourist-info-chip-label"><FaMountain /> {isEn ? 'Altitude' : 'Altitud'}</span>
                    <span className="tourist-info-chip-val">{activeModal.touristInfo.altitude}</span>
                  </div>
                  <div className="tourist-info-chip">
                    <span className="tourist-info-chip-label"><FaCloudSun /> {isEn ? 'Climate' : 'Clima'}</span>
                    <span className="tourist-info-chip-val">{activeModal.touristInfo.climate}</span>
                  </div>
                  <div className="tourist-info-chip">
                    <span className="tourist-info-chip-label"><FaClock /> {isEn ? 'Travel Time' : 'Duración'}</span>
                    <span className="tourist-info-chip-val">{activeModal.touristInfo.duration}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="tourist-section-block">
                  <h4><FaCompass /> {isEn ? 'About this Destination' : 'Acerca de este Destino'}</h4>
                  <p>{activeModal.touristInfo.touristDescription}</p>
                </div>

                {/* Highlights */}
                <div className="tourist-section-block">
                  <h4><FaMapPin /> {isEn ? 'Key Tourist Attractions & Highlights' : 'Principales Atractivos Turísticos'}</h4>
                  <ul className="tourist-highlights-list">
                    {activeModal.touristInfo.highlights.map((item, idx) => (
                      <li key={idx}>
                        <span style={{ color: '#16a34a', marginRight: '4px' }}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gastronomy */}
                <div className="tourist-section-block">
                  <h4><FaUtensils /> {isEn ? 'Gastronomy & Local Delicacies' : 'Gastronomía y Sabores Locales'}</h4>
                  <p>{activeModal.touristInfo.gastronomy}</p>
                </div>

                {/* Tips */}
                <div className="tourist-tips-box">
                  <strong>💡 {isEn ? 'Traveler Tips:' : 'Consejos para el Viajero:'}</strong> {activeModal.touristInfo.tips}
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="destination-modal-footer">
              <div className="price-display">
                <small>{isEn ? 'Reference Fare' : 'Tarifa Referencial'}</small>
                {activeModal.priceTag}
              </div>

              <div>
                {activeModal.id === 2 ? (
                  <a 
                    href="/viajes?origen=CUSCO&destino=QUILLABAMBA"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', color: '#ffffff', backgroundColor: '#0284c7' }}
                    onClick={() => setActiveModal(null)}
                  >
                    <span style={{ color: '#ffffff' }}>{isEn ? 'Book Online Ticket' : 'Comprar Pasaje Online'}</span>
                    <FaArrowRight style={{ color: '#ffffff' }} />
                  </a>
                ) : (
                  <a 
                    href={`https://wa.me/51997475405?text=Hola,%20quiero%20información%20sobre%20el%20viaje%20a%20${encodeURIComponent(activeModal.title)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', background: '#25D366', borderColor: '#25D366', color: '#ffffff' }}
                  >
                    <FaWhatsapp style={{ fontSize: '1.2rem', color: '#ffffff' }} />
                    <span style={{ color: '#ffffff' }}>{isEn ? 'Inquire on WhatsApp' : 'Consultar por WhatsApp'}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
