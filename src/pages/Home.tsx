import { useTranslation } from 'react-i18next';
import InteractiveHeroBackground from '../components/home/InteractiveHeroBackground';
import HeroForegroundBirds from '../components/home/HeroForegroundBirds';
import SearchForm from '../components/home/SearchForm';
import TrustBar from '../components/home/TrustBar';
import Benefits from '../components/home/Benefits';
import About from '../components/home/About';
import Destinations from '../components/home/Destinations';
import TravelGuideSEO from '../components/home/TravelGuideSEO';
import Testimonials from '../components/home/Testimonials';
import MapSection from '../components/home/MapSection';
import ComunicadoModal from '../components/home/ComunicadoModal';
import { SEO } from '../components/common/SEO';
import '../styles/components/Home.css';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="page-home fade-in">
      <SEO
        title="Tunky Chasky | Pasajes Cusco a Quillabamba Online"
        description="Compra pasajes Cusco a Quillabamba online al instante. Autos y minivans modernas, salidas diarias, pago fácil con Yape y boleta SUNAT. ¡Viaja seguro!"
        canonical="https://turismotunkychasky.com.pe/"
        keywords="pasajes cusco quillabamba, pasajes cusco quillabamba autos, colectivos quillabamba cusco, transporte tunky chasky, pasajes hidroelectrica machu picchu"
      />
      <ComunicadoModal />
      
      {/* Hero Section with 3D Interactive Landscape, Cinemagraph & Foreground Birds */}
      <section className="hero-section">
        <InteractiveHeroBackground />
        <HeroForegroundBirds />
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-text slide-up">
              <h1 className="hero-title">{t('hero.title', 'Llegamos Más Rápido a tu Destino')}</h1>
              <p className="hero-subtitle">{t('hero.subtitle', 'Seguridad · Rapidez · Confort')}</p>
            </div>
            
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Trust & Guarantees Bar */}
      <TrustBar />

      {/* Benefits Section */}
      <Benefits />

      {/* About Us Section */}
      <About />

      {/* Map Section */}
      <MapSection />

      {/* Destinations Section */}
      <Destinations />

      {/* Guía de Viaje Cusco - Quillabamba & Preguntas Frecuentes (SEO) */}
      <TravelGuideSEO />

      {/* Testimonials Section */}
      <Testimonials />
      
    </div>
  );
}
