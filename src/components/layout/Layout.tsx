import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

export default function Layout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content" style={{ minHeight: 'calc(100vh - 110px - 300px)', paddingTop: '110px' }}>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
