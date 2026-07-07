import { useTranslation } from 'react-i18next';
import SearchForm from '../components/home/SearchForm';
import Benefits from '../components/home/Benefits';
import About from '../components/home/About';
import Destinations from '../components/home/Destinations';
import Testimonials from '../components/home/Testimonials';
import MapSection from '../components/home/MapSection';
import '../styles/components/Home.css';

// Import the Tunki Chasky hero image
import heroImage from '../assets/hero-landscape.png';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="page-home fade-in">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <img src={heroImage} alt="Transporte Tunki Chasky" />
          <div className="hero-overlay"></div>
        </div>
        
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

      {/* Benefits Section */}
      <Benefits />

      {/* About Us Section */}
      <About />

      {/* Destinations Section */}
      <Destinations />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Map Section */}
      <MapSection />
      
    </div>
  );
}
