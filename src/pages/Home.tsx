import { useTranslation } from 'react-i18next';
import SearchForm from '../components/home/SearchForm';
import Benefits from '../components/home/Benefits';
import About from '../components/home/About';
import '../styles/components/Home.css';

// Import the generated hero landscape image
import heroImage from '../assets/hero-landscape.png';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="page-home fade-in">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <img src={heroImage} alt="Landscape Cusco to Quillabamba" />
          <div className="hero-overlay"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-text slide-up">
              <h1 className="hero-title">{t('hero.title', 'Viaja seguro de Cusco a Quillabamba')}</h1>
              <p className="hero-subtitle">{t('hero.subtitle', 'Seguridad y confort a tu servicio')}</p>
            </div>
            
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <Benefits />

      {/* About Us Section */}
      <About />
      
    </div>
  );
}
