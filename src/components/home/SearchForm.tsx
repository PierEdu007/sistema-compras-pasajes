import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBus, FaCalendarAlt } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

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
  const [routeMap, setRouteMap] = useState<Record<string, { value: string; label: string }[]>>({
    CUSCO: [
      { value: 'QUILLABAMBA', label: 'Quillabamba' },
      { value: 'KITENI', label: 'Kiteni' }
    ],
    QUILLABAMBA: [
      { value: 'CUSCO', label: 'Cusco' },
      { value: 'KITENI', label: 'Kiteni' }
    ],
    KITENI: [
      { value: 'QUILLABAMBA', label: 'Quillabamba' },
      { value: 'CUSCO', label: 'Cusco' }
    ]
  });

  const [originList, setOriginList] = useState<{ value: string; label: string }[]>([
    { value: 'CUSCO', label: 'Cusco' },
    { value: 'QUILLABAMBA', label: 'Quillabamba' },
    { value: 'KITENI', label: 'Kiteni' }
  ]);

  // Cargar rutas activas desde Supabase de forma dinámica
  useEffect(() => {
    async function loadRoutes() {
      try {
        const { data, error } = (await supabase
          .from('rutas')
          .select('origen, destino')
          .eq('activa', true)) as { data: Array<{ origen: string; destino: string }> | null; error: any };

        if (!error && data && data.length > 0) {
          const map: Record<string, { value: string; label: string }[]> = {};
          const originsSet = new Set<string>();

          const formatLabel = (city: string) => {
            const lower = city.toLowerCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
          };

          data.forEach(r => {
            const o = r.origen.toUpperCase().trim();
            const d = r.destino.toUpperCase().trim();
            originsSet.add(o);

            if (!map[o]) map[o] = [];
            if (!map[o].some(item => item.value === d)) {
              map[o].push({ value: d, label: formatLabel(d) });
            }
          });

          // Siempre asegurar que Kiteni esté presente en Quillabamba y Cusco
          if (!map['QUILLABAMBA']) map['QUILLABAMBA'] = [];
          if (!map['QUILLABAMBA'].some(i => i.value === 'KITENI')) {
            map['QUILLABAMBA'].push({ value: 'KITENI', label: 'Kiteni' });
          }
          if (!map['CUSCO']) map['CUSCO'] = [];
          if (!map['CUSCO'].some(i => i.value === 'KITENI')) {
            map['CUSCO'].push({ value: 'KITENI', label: 'Kiteni' });
          }
          if (!map['KITENI']) {
            map['KITENI'] = [
              { value: 'QUILLABAMBA', label: 'Quillabamba' },
              { value: 'CUSCO', label: 'Cusco' }
            ];
          }

          setRouteMap(map);
          setOriginList(
            Array.from(new Set([...originsSet, 'CUSCO', 'QUILLABAMBA', 'KITENI'])).map(city => ({
              value: city,
              label: formatLabel(city)
            }))
          );
        }
      } catch (err) {
        console.warn('Error loading dynamic routes:', err);
      }
    }
    loadRoutes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origen || !destino || !fecha) return;
    
    if (origen === destino) {
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

  // Obtener destinos válidos según el origen seleccionado
  const destinosDisponibles = origen && routeMap[origen] 
    ? routeMap[origen] 
    : [];

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
              {originList.map(ruta => (
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
              {destinosDisponibles.map(ruta => (
                <option key={`dest-${ruta.value}`} value={ruta.value}>{ruta.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <FaCalendarAlt style={{ color: '#00AEEF', fontSize: '0.95rem' }} />
              <span>{t('search.date', 'Fecha de viaje')}</span>
            </label>
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
