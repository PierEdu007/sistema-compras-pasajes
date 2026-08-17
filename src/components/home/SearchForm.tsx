import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBus } from 'react-icons/fa';

export default function SearchForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Obtener fecha actual en zona horaria oficial de Perú (America/Lima)
  const getTodayLima = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Lima', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).format(new Date());
    } catch (_e) {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    }
  };
  const today = getTodayLima();

  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState(today); // Fecha por defecto: hoy

  const ALLOWED_CITIES = ['CUSCO', 'QUILLABAMBA', 'KITENI'];

  const rutas = [
    { value: 'CUSCO', label: 'Cusco' },
    { value: 'QUILLABAMBA', label: 'Quillabamba' },
    { value: 'KITENI', label: 'Kiteni' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origen || !destino || !fecha) return;
    
    // Validar que origen y destino pertenezcan a la lista permitida
    if (!ALLOWED_CITIES.includes(origen) || !ALLOWED_CITIES.includes(destino) || origen === destino) {
      return;
    }

    // Validar formato de fecha seguro (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return;
    }

    // Redirigir a la página de resultados con los parámetros sanitizados
    const cleanOrigen = encodeURIComponent(origen.trim());
    const cleanDestino = encodeURIComponent(destino.trim());
    const cleanFecha = encodeURIComponent(fecha.trim());
    navigate(`/viajes?origen=${cleanOrigen}&destino=${cleanDestino}&fecha=${cleanFecha}`);
  };

  // Prevenir seleccionar el mismo origen como destino
  const destinosFiltrados = rutas.filter(r => r.value !== origen);

  return (
    <div className="search-form-container glass">
      <h2>{t('hero.buyTicket', 'Compra tu pasaje')}</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('search.origin', 'Origen')}</label>
            <select 
              className="form-control" 
              value={origen} 
              onChange={(e) => {
                setOrigen(e.target.value);
                if (e.target.value === destino) setDestino('');
              }}
              required
            >
              <option value="" disabled>{t('search.selectOrigin', 'Select origin')}</option>
              {rutas.map(ruta => (
                <option key={`orig-${ruta.value}`} value={ruta.value}>{ruta.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('search.destination', 'Destino')}</label>
            <select 
              className="form-control" 
              value={destino} 
              onChange={(e) => setDestino(e.target.value)}
              required
              disabled={!origen}
            >
              <option value="" disabled>{t('search.selectDestination', 'Select destination')}</option>
              {destinosFiltrados.map(ruta => (
                <option key={`dest-${ruta.value}`} value={ruta.value}>{ruta.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('search.date', 'Fecha de viaje')}</label>
            <input 
              type="date" 
              className="form-control" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              min={today}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-search" disabled={!origen || !destino || !fecha}>
          {t('hero.searchBtn', 'Buscar Viajes')} <FaBus />
        </button>
      </form>
    </div>
  );
}
