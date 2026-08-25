import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaTicketAlt,
  FaSuitcase,
  FaChild,
  FaBus,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaBox,
  FaShieldAlt,
  FaBook,
  FaSearch,
  FaPrint,
  FaWhatsapp,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBan,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaBalanceScale,
  FaStar,
  FaSyncAlt,
  FaTimes
} from 'react-icons/fa';
import '../styles/components/Terms.css';

interface TermItem {
  id: string;
  tag: 'OBLIGATORIO' | 'BENEFICIO' | 'CONDICION' | 'PROHIBICION';
  textEs: string;
  textEn: string;
}

interface TermSection {
  id: string;
  category: string;
  icon: React.ReactNode;
  titleEs: string;
  titleEn: string;
  badgeEs: string;
  badgeEn: string;
  items: TermItem[];
}

export default function Terms() {
  const { t: _t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'boletos': true,
    'equipaje': true,
    'menores': true,
    'abordaje': true,
    'postergaciones': true,
    'reservas': true,
    'encomiendas': true,
    'seguridad': true,
    'reclamaciones': true,
  });

  const categories = [
    { id: 'ALL', icon: <FaStar />, labelEs: 'Todos los Términos', labelEn: 'All Terms' },
    { id: 'boletos', icon: <FaTicketAlt />, labelEs: 'Boletos y Comprobantes', labelEn: 'Tickets & Invoices' },
    { id: 'equipaje', icon: <FaSuitcase />, labelEs: 'Equipaje y Carga', labelEn: 'Luggage & Baggage' },
    { id: 'menores', icon: <FaChild />, labelEs: 'Menores de Edad', labelEn: 'Traveling Minors' },
    { id: 'abordaje', icon: <FaBus />, labelEs: 'Abordaje y Conducta', labelEn: 'Boarding & Rules' },
    { id: 'postergaciones', icon: <FaSyncAlt />, labelEs: 'Postergaciones y Cambios', labelEn: 'Rescheduling' },
    { id: 'reservas', icon: <FaClock />, labelEs: 'Reservas y Pagos', labelEn: 'Booking & Payments' },
    { id: 'encomiendas', icon: <FaBox />, labelEs: 'Encomiendas y Giros', labelEn: 'Parcel Services' },
    { id: 'seguridad', icon: <FaShieldAlt />, labelEs: 'Seguridad y SOAT', labelEn: 'Insurance & Safety' },
    { id: 'reclamaciones', icon: <FaBalanceScale />, labelEs: 'Libro de Reclamaciones', labelEn: 'Complaints Book' },
  ];

  const sections: TermSection[] = [
    {
      id: 'boletos',
      category: 'boletos',
      icon: <FaTicketAlt className="term-sec-icon" />,
      titleEs: '1. De la Compra de Boletos y Facturación Electrónica SUNAT',
      titleEn: '1. Ticket Purchases and SUNAT Electronic Invoicing',
      badgeEs: 'Comprobantes Oficiales',
      badgeEn: 'Official Receipts',
      items: [
        {
          id: 'b-1',
          tag: 'OBLIGATORIO',
          textEs: 'El pasajero está en la obligación de proporcionar sus datos de identificación personal válidos (DNI, Carnet de Extranjería, Pasaporte o RUC/Razón Social en caso de requerir Factura Electrónica).',
          textEn: 'Passengers are required to provide valid personal identification details (DNI, Foreigner ID, Passport or Tax ID / Company Name if requesting an Electronic Invoice).'
        },
        {
          id: 'b-2',
          tag: 'CONDICION',
          textEs: 'Una vez emitido el comprobante de pago electrónico (Boleta o Factura autorizada por SUNAT a través de NubeFact), NO SE ADMITEN RECTIFICACIONES DE RAZÓN SOCIAL, ANULACIONES O DEVOLUCIONES DE DINERO.',
          textEn: 'Once the electronic receipt is issued (SUNAT authorized receipt or invoice via NubeFact), COMPANY NAME RECTIFICATIONS, CANCELLATIONS OR CASH REFUNDS ARE NOT PERMITTED.'
        },
        {
          id: 'b-3',
          tag: 'OBLIGATORIO',
          textEs: 'Es responsabilidad exclusiva del pasajero verificar que los datos impresos en su boleto (origen, destino, fecha, hora y nombres) coincidan exactamente con su solicitud antes de retirarse de ventanilla o confirmar en línea.',
          textEn: 'It is the passenger’s sole responsibility to verify that the information on their ticket (origin, destination, date, time and name) matches their request before leaving the counter or finalizing online.'
        },
        {
          id: 'b-4',
          tag: 'CONDICION',
          textEs: 'El boleto de viaje es personal e intransferible. Es válido únicamente para la fecha, hora, ruta y asiento consignado en el sistema.',
          textEn: 'The travel ticket is strictly personal and non-transferable. It is valid only for the date, time, route, and seat assigned in the system.'
        },
        {
          id: 'b-5',
          tag: 'CONDICION',
          textEs: 'Las tarifas publicadas son referenciales y pueden variar sin previo aviso de acuerdo a la temporada (alta/baja), feriados nacionales o festividades locales.',
          textEn: 'Published rates are reference prices and may vary without prior notice according to high/low travel seasons, national holidays, or local festivities.'
        },
        {
          id: 'b-6',
          tag: 'PROHIBICION',
          textEs: 'Por disposiciones de seguridad financiera, no se reciben billetes de la denominación de S/ 200 (doscientos soles). Todo billete falso detectado será retenido y reportado a la autoridad competente.',
          textEn: 'For financial security reasons, 200 PEN banknotes are not accepted. Any counterfeit bill detected will be confiscated and reported to the authorities.'
        },
        {
          id: 'b-7',
          tag: 'PROHIBICION',
          textEs: 'No se admiten canjes o cambios de Boleta de Venta por Factura Electrónica con posterioridad a la emisión.',
          textEn: 'Exchanging a Sales Receipt (Boleta) for a Corporate Invoice (Factura) after issuance is strictly prohibited under SUNAT tax regulations.'
        }
      ]
    },
    {
      id: 'equipaje',
      category: 'equipaje',
      icon: <FaSuitcase className="term-sec-icon" />,
      titleEs: '2. Del Equipaje de Pasajeros y Franquicias Permitidas',
      titleEn: '2. Passenger Luggage Allowances and Conditions',
      badgeEs: '25 kg Libres',
      badgeEn: '25 kg Allowance',
      items: [
        {
          id: 'eq-1',
          tag: 'BENEFICIO',
          textEs: 'Cada pasajero con boleto pagado tiene derecho al transporte libre de hasta 25 kilogramos de equipaje personal o un volumen equivalente a 40 cm x 40 cm x 30 cm en la maletera del vehículo.',
          textEn: 'Each passenger with a confirmed ticket is entitled to transport up to 25 kg of personal luggage or an equivalent volume of 40 cm x 40 cm x 30 cm in the vehicle trunk.'
        },
        {
          id: 'eq-2',
          tag: 'CONDICION',
          textEs: 'El exceso de equipaje será admitido únicamente si la capacidad de carga del vehículo lo permite, debiendo abonar la tarifa correspondiente por kilogramo adicional.',
          textEn: 'Excess baggage will be accepted only if the vehicle load capacity permits, subject to payment of the current excess luggage rate per extra kilogram.'
        },
        {
          id: 'eq-3',
          tag: 'OBLIGATORIO',
          textEs: 'El pasajero es responsable en todo momento de la custodia de sus objetos de valor, dinero, joyas, laptops o celulares dentro de la cabina. La empresa no se responsabiliza por pérdidas de artículos no declarados formalmente ni por daños derivados de embalajes defectuosos del cliente.',
          textEn: 'Passengers are strictly responsible for safeguarding their valuables, money, jewelry, laptops, or electronics inside the vehicle cabin. The company is not liable for undeclared items or poorly packaged goods.'
        },
        {
          id: 'eq-4',
          tag: 'PROHIBICION',
          textEs: 'Está terminantemente prohibido transportar en cabina o maletera: balones de gas, combustibles, pirotécnicos, productos químicos corrosivos, armas sin licencia o mercancías de contrabando.',
          textEn: 'Carrying gas cylinders, fuels, fireworks, corrosive chemicals, unlicensed weapons, or illicit goods in the cabin or trunk is strictly forbidden.'
        }
      ]
    },
    {
      id: 'menores',
      category: 'menores',
      icon: <FaChild className="term-sec-icon" />,
      titleEs: '3. Del Viaje de Menores de Edad (Ley N° 27337 y Normativa MTC)',
      titleEn: '3. Travel Rules for Minors (Law No. 27337 & MTC)',
      badgeEs: 'Normativa Legal',
      badgeEn: 'Legal Regulation',
      items: [
        {
          id: 'men-1',
          tag: 'OBLIGATORIO',
          textEs: 'Conforme a la Ley General de Transporte y Código del Niño y Adolescente, los menores de edad que viajen con solo uno de sus padres o con terceras personas deberán presentar obligatoriamente su DNI original y la AUTORIZACIÓN NOTARIAL DE VIAJE correspondiente.',
          textEn: 'In accordance with National Transportation Law and the Child and Adolescent Code, minors traveling with only one parent or with third parties must present their original DNI and official Notarized Travel Authorization.'
        },
        {
          id: 'men-2',
          tag: 'PROHIBICION',
          textEs: 'Está totalmente prohibido que menores de nueve (09) años de edad viajen solos o sin el acompañamiento de un adulto debidamente autorizado.',
          textEn: 'Children under nine (09) years of age are strictly prohibited from traveling unaccompanied by an authorized adult.'
        },
        {
          id: 'men-3',
          tag: 'CONDICION',
          textEs: 'Todo niño mayor de cinco (05) años de edad debe abonar su pasaje regular completo, viajando con su respectivo boleto y ocupando un asiento independiente con cinturón de seguridad.',
          textEn: 'Children over five (05) years old must have their full regular ticket, traveling with their assigned seat and seatbelt fastened.'
        }
      ]
    },
    {
      id: 'abordaje',
      category: 'abordaje',
      icon: <FaBus className="term-sec-icon" />,
      titleEs: '4. Del Abordaje, Embarque y Normas de Convivencia a Bordo',
      titleEn: '4. Boarding, Check-in, and Onboard Conduct Rules',
      badgeEs: '30 Minutos Antes',
      badgeEn: '30 Mins Prior',
      items: [
        {
          id: 'ab-1',
          tag: 'OBLIGATORIO',
          textEs: 'El pasajero debe presentarse en el punto de embarque con un mínimo de treinta (30) minutos de anticipación a la hora fijada en su boleto. El pasajero que no se presente a tiempo perderá su derecho a viajar sin lugar a reclamo o reembolso.',
          textEn: 'Passengers must arrive at the boarding terminal at least thirty (30) minutes before the scheduled departure time. Failure to arrive on time will result in forfeiture of the ticket with no refund.'
        },
        {
          id: 'ab-2',
          tag: 'OBLIGATORIO',
          textEs: 'Para ingresar al vehículo es indispensable presentar el documento de identidad en físico (DNI / Pasaporte) y el boleto de viaje digital o impreso.',
          textEn: 'To board the vehicle, passengers must present their physical original ID (DNI / Passport) along with their digital or printed travel ticket.'
        },
        {
          id: 'ab-3',
          tag: 'PROHIBICION',
          textEs: 'No se permitirá el abordaje de personas bajo la influencia de alcohol o sustancias estupefacientes, ni a pasajeros con actitudes violentas o que atenten contra la seguridad y tranquilidad de los demás viajeros.',
          textEn: 'Passengers under the influence of alcohol, drugs, or demonstrating aggressive or unsafe behavior will be denied boarding without right to refund.'
        },
        {
          id: 'ab-4',
          tag: 'PROHIBICION',
          textEs: 'Por salubridad y respeto a los pasajeros, queda prohibido el transporte de mascotas en el salón (salvo animales de asistencia o lazarillos certificados) y el cambio de pañales dentro del vehículo.',
          textEn: 'For hygiene and passenger comfort, transporting pets inside the passenger cabin (except certified guide/service dogs) and diaper changes are strictly prohibited.'
        },
        {
          id: 'ab-5',
          tag: 'CONDICION',
          textEs: 'El embarque y desembarque se realizará únicamente en los terminales y paraderos legalmente autorizados por el MTC / SUTRAN.',
          textEn: 'Boarding and drop-offs will only occur at officially authorized terminals and checkpoints compliant with SUTRAN / MTC regulations.'
        }
      ]
    },
    {
      id: 'postergaciones',
      category: 'postergaciones',
      icon: <FaCalendarAlt className="term-sec-icon" />,
      titleEs: '5. De las Postergaciones, Reprogramaciones y Boletos en "Fecha Libre"',
      titleEn: '5. Rescheduling, Trip Postponements and Open-Date Tickets',
      badgeEs: 'Flexibilidad de Viaje',
      badgeEn: 'Travel Flexibility',
      items: [
        {
          id: 'post-1',
          tag: 'CONDICION',
          textEs: 'Las solicitudes de cambio de fecha u hora deben efectuarse en nuestras agencias autorizadas o WhatsApp con un mínimo de dos (02) horas de anticipación a la hora de salida programada.',
          textEn: 'Requests for date or time changes must be made at our authorized offices or via official WhatsApp at least two (02) hours before the scheduled departure time.'
        },
        {
          id: 'post-2',
          tag: 'PROHIBICION',
          textEs: 'No se admiten cambios, postergaciones ni reprogramaciones solicitadas con menos de 59 minutos antes de la salida, perdiendo el pasajero el 100% del valor de su pasaje.',
          textEn: 'No modifications, postponements or re-routes will be granted within 59 minutes before departure; the ticket value will be 100% forfeited.'
        },
        {
          id: 'post-3',
          tag: 'BENEFICIO',
          textEs: 'El boleto postergado podrá quedar en condición de "Fecha Libre" por un plazo máximo improrrogable de treinta (30) días calendario a partir de la fecha de viaje original.',
          textEn: 'Postponed tickets may be held as "Open Date" for a maximum non-extendable period of thirty (30) calendar days from the original travel date.'
        },
        {
          id: 'post-4',
          tag: 'CONDICION',
          textEs: 'En caso de suspensión temporal de la vía por causas de fuerza mayor (derrumbes, factores climáticos o bloqueos), el viaje será reprogramado en el siguiente horario disponible dentro de las doce (12) horas posteriores al restablecimiento del tránsito.',
          textEn: 'In case of road closures due to force majeure (landslides, severe weather, or strikes), trips will be rescheduled for the next available departure within 12 hours of highway reopening.'
        }
      ]
    },
    {
      id: 'reservas',
      category: 'reservas',
      icon: <FaMoneyBillWave className="term-sec-icon" />,
      titleEs: '6. De las Reservas Online, Pagos por Yape y Emisión Inmediata',
      titleEn: '6. Online Reservations, Yape Transfers and Direct Emission',
      badgeEs: 'Bloqueo Seguro',
      badgeEn: 'Secure Lock',
      items: [
        {
          id: 'res-1',
          tag: 'CONDICION',
          textEs: 'Al seleccionar un asiento en la plataforma web, el sistema efectúa un bloqueo temporal exclusivo de 8 minutos para permitir el registro y confirmación del pago.',
          textEn: 'Selecting a seat on the web platform locks it exclusively for 8 minutes to allow passenger data entry and payment confirmation.'
        },
        {
          id: 'res-2',
          tag: 'OBLIGATORIO',
          textEs: 'En pagos mediante Yape o transferencia directa, el usuario debe ingresar correctamente el Código de Operación de 6 dígitos. Una vez validado por el equipo de caja, se emite el comprobante y boleto automáticamente.',
          textEn: 'For Yape or direct transfers, users must enter the valid 6-digit Operation Code. Upon verification by our staff, the official receipt and ticket are issued automatically.'
        },
        {
          id: 'res-3',
          tag: 'BENEFICIO',
          textEs: 'Todos los comprobantes y boletos son enviados al correo electrónico del pasajero y están disponibles para descarga en PDF y formato XML autorizado por SUNAT.',
          textEn: 'All invoices and travel tickets are sent to the passenger’s email and remain available for instant download in PDF and SUNAT-compliant XML.'
        }
      ]
    },
    {
      id: 'encomiendas',
      category: 'encomiendas',
      icon: <FaBox className="term-sec-icon" />,
      titleEs: '7. Del Servicio de Encomiendas, Carga Express y Giros',
      titleEn: '7. Express Cargo, Parcel Shipping and Money Transfers',
      badgeEs: 'Entrega Rápida',
      badgeEn: 'Express Delivery',
      items: [
        {
          id: 'enc-1',
          tag: 'OBLIGATORIO',
          textEs: 'El remitente debe identificarse con su DNI original y declarar de forma exacta y verídica el contenido del paquete a despachar.',
          textEn: 'The sender must present their original ID (DNI) and accurately declare the true contents of the parcel being shipped.'
        },
        {
          id: 'enc-2',
          tag: 'CONDICION',
          textEs: 'El destinatario deberá presentar su DNI en original para el retiro de la encomienda en las agencias de Cusco, Quillabamba o Kiteni.',
          textEn: 'The recipient must present their physical original ID to pick up parcels at our Cusco, Quillabamba, or Kiteni branches.'
        },
        {
          id: 'enc-3',
          tag: 'CONDICION',
          textEs: 'Las encomiendas no recogidas en un plazo de treinta (30) días calendario generarán gastos adicionales por almacenaje y custodia.',
          textEn: 'Parcels unclaimed after thirty (30) calendar days will accrue additional warehousing and storage fees.'
        }
      ]
    },
    {
      id: 'seguridad',
      category: 'seguridad',
      icon: <FaShieldAlt className="term-sec-icon" />,
      titleEs: '8. De la Seguridad Vial, Póliza de Seguro SOAT y Transbordos',
      titleEn: '8. Road Safety, SOAT Insurance Policy and Transfers',
      badgeEs: '100% Cobertura SOAT',
      badgeEn: 'Full SOAT Covered',
      items: [
        {
          id: 'seg-1',
          tag: 'BENEFICIO',
          textEs: 'Todos los pasajeros viajan protegidos por la Póliza de Seguro Obligatorio contra Accidentes de Tránsito (SOAT) vigente en todas nuestras unidades de 4 y 6 pasajeros.',
          textEn: 'All passengers are protected under our active mandatory traffic accident insurance policy (SOAT) across all 4 and 6-passenger vehicles.'
        },
        {
          id: 'seg-2',
          tag: 'CONDICION',
          textEs: 'En caso de desperfecto mecánico o eventualidad fortuita en la ruta, la empresa queda plenamente facultada para disponer el transbordo inmediato de los pasajeros a otra unidad habilitada de similar o superior confort.',
          textEn: 'In the event of a mechanical breakdown or unexpected route incident, the company is authorized to transfer passengers to another certified replacement vehicle of equal comfort.'
        },
        {
          id: 'seg-3',
          tag: 'OBLIGATORIO',
          textEs: 'El uso del cinturón de seguridad es obligatorio durante todo el trayecto para todos los ocupantes del vehículo conforme a la normativa de SUTRAN.',
          textEn: 'Wearing seatbelts is strictly mandatory for all occupants throughout the entire journey per SUTRAN road safety regulations.'
        }
      ]
    },
    {
      id: 'reclamaciones',
      category: 'reclamaciones',
      icon: <FaBook className="term-sec-icon" />,
      titleEs: '9. Del Libro de Reclamaciones y Canales de Atención',
      titleEn: '9. Complaints Book and Customer Support Channels',
      badgeEs: 'Conforme a Ley INDECOPI',
      badgeEn: 'INDECOPI Compliant',
      items: [
        {
          id: 'rec-1',
          tag: 'BENEFICIO',
          textEs: 'Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571), la empresa cuenta con un Libro de Reclamaciones físico en cada una de sus agencias y atención directa de reclamos.',
          textEn: 'In compliance with the Consumer Protection Code (Law No. 29571), our company maintains an official physical Complaints Book at each terminal branch.'
        },
        {
          id: 'rec-2',
          tag: 'BENEFICIO',
          textEs: 'Todo reclamo o queja será atendido de manera formal en un plazo máximo de quince (15) días hábiles conforme a la normativa de INDECOPI.',
          textEn: 'All official claims or complaints will be formally addressed within a maximum period of fifteen (15) business days pursuant to INDECOPI rules.'
        }
      ]
    }
  ];

  const filteredSections = useMemo(() => {
    return sections
      .filter(sec => activeCategory === 'ALL' || sec.category === activeCategory)
      .map(sec => {
        if (!searchQuery.trim()) return sec;
        const q = searchQuery.toLowerCase().trim();
        const matchesSectionTitle = isEn
          ? sec.titleEn.toLowerCase().includes(q)
          : sec.titleEs.toLowerCase().includes(q);

        const filteredItems = sec.items.filter(item => {
          const text = isEn ? item.textEn.toLowerCase() : item.textEs.toLowerCase();
          return text.includes(q);
        });

        if (matchesSectionTitle) return sec;
        return { ...sec, items: filteredItems };
      })
      .filter(sec => sec.items.length > 0);
  }, [sections, activeCategory, searchQuery, isEn]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sections.forEach(s => { allExpanded[s.id] = true; });
    setExpandedSections(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sections.forEach(s => { allCollapsed[s.id] = false; });
    setExpandedSections(allCollapsed);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="terms-page-wrapper">
      {/* 1. Header Banner */}
      <header className="terms-hero">
        <div className="container terms-hero-content">
          <div className="terms-hero-badge">
            <FaBalanceScale /> {isEn ? 'Official Terms of Service' : 'Normativa y Condiciones del Servicio'}
          </div>
          <h1 className="terms-main-title">
            {isEn ? 'Terms & Conditions of Transport' : 'Términos y Condiciones de Transporte'}
          </h1>
          <p className="terms-main-subtitle">
            {isEn
              ? 'Official travel regulations, passenger rights, baggage policies, and service rules of Inversiones Tunky Chasky S.R.L.'
              : 'Condiciones de contratación, derechos y obligaciones del pasajero, políticas de equipaje y normativa de viaje de Inversiones Tunky Chasky S.R.L.'}
          </p>

          <div className="terms-meta-badges">
            <span className="terms-meta-chip">
              <strong>RUC:</strong> 20613271701
            </span>
            <span className="terms-meta-chip">
              <FaShieldAlt style={{ color: '#10B981' }} /> {isEn ? 'SUTRAN / MTC Compliant' : 'Regulado por SUTRAN / MTC'}
            </span>
            <span className="terms-meta-chip">
              <FaClock style={{ color: '#F59E0B' }} /> {isEn ? 'Updated: 2026' : 'Vigencia: Año 2026'}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="terms-quick-actions">
            <button className="terms-btn terms-btn-print" onClick={handlePrint}>
              <FaPrint /> {isEn ? 'Print / Save PDF' : 'Imprimir / Guardar PDF'}
            </button>
            <a
              href="https://wa.me/51997040003?text=Hola,%20tengo%20una%20consulta%20sobre%20los%20términos%20y%20condiciones%20de%20viaje."
              target="_blank"
              rel="noopener noreferrer"
              className="terms-btn terms-btn-whatsapp"
            >
              <FaWhatsapp className="terms-btn-whatsapp-icon" /> <span>{isEn ? 'WhatsApp Support' : 'Consultar por WhatsApp'}</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="container terms-main-container">
        {/* Search & Category Filter Toolbar */}
        <div className="terms-toolbar-card">
          <div className="terms-search-row">
            <div className="terms-search-input-wrapper">
              <FaSearch className="terms-search-icon" />
              <input
                type="text"
                className="terms-search-input"
                placeholder={
                  isEn
                    ? 'Search terms (e.g., luggage, minors, refund, delay, invoice, pets, SOAT)...'
                    : 'Buscar en los términos (ej. equipaje, menores, postergación, boleta, factura, mascotas, SOAT)...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="terms-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title={isEn ? 'Clear search' : 'Limpiar búsqueda'}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="terms-expand-controls">
              <button className="terms-toggle-all-btn" onClick={handleExpandAll}>
                <FaChevronDown /> {isEn ? 'Expand All' : 'Expandir Todo'}
              </button>
              <button className="terms-toggle-all-btn" onClick={handleCollapseAll}>
                <FaChevronUp /> {isEn ? 'Collapse All' : 'Contraer'}
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="terms-categories-scroll">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`terms-category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="terms-cat-pill-icon">{cat.icon}</span>
                <span>{isEn ? cat.labelEn : cat.labelEs}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Sections List */}
        <div className="terms-sections-list">
          {filteredSections.length === 0 ? (
            <div className="terms-empty-state">
              <FaInfoCircle className="terms-empty-icon" />
              <h3>{isEn ? 'No terms found matching your query' : 'No se encontraron artículos con esa búsqueda'}</h3>
              <p>
                {isEn
                  ? 'Try searching with different keywords or click on "All Terms" above.'
                  : 'Intenta con otras palabras clave o selecciona "Todos los Términos".'}
              </p>
              <button
                className="terms-btn terms-btn-reset"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                }}
              >
                {isEn ? 'Show All Terms' : 'Restablecer Filtros'}
              </button>
            </div>
          ) : (
            filteredSections.map(sec => {
              const isExpanded = expandedSections[sec.id] ?? true;
              return (
                <article key={sec.id} className="terms-section-card">
                  {/* Section Accordion Header */}
                  <div
                    className="terms-section-header"
                    onClick={() => toggleSection(sec.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="terms-sec-title-group">
                      <div className="terms-sec-icon-box">{sec.icon}</div>
                      <div>
                        <h2 className="terms-sec-title">
                          {isEn ? sec.titleEn : sec.titleEs}
                        </h2>
                        <span className="terms-sec-badge">
                          {isEn ? sec.badgeEn : sec.badgeEs}
                        </span>
                      </div>
                    </div>

                    <div className="terms-sec-chevron">
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>

                  {/* Section Content Items */}
                  {isExpanded && (
                    <div className="terms-section-body">
                      <ul className="terms-items-list">
                        {sec.items.map(item => (
                          <li key={item.id} className={`terms-item-row tag-${item.tag.toLowerCase()}`}>
                            <div className="terms-item-tag-badge">
                              {item.tag === 'OBLIGATORIO' && (
                                <>
                                  <FaExclamationTriangle /> {isEn ? 'MANDATORY' : 'OBLIGATORIO'}
                                </>
                              )}
                              {item.tag === 'BENEFICIO' && (
                                <>
                                  <FaCheckCircle /> {isEn ? 'PASSENGER RIGHT' : 'BENEFICIO'}
                                </>
                              )}
                              {item.tag === 'CONDICION' && (
                                <>
                                  <FaInfoCircle /> {isEn ? 'POLICY' : 'CONDICIÓN'}
                                </>
                              )}
                              {item.tag === 'PROHIBICION' && (
                                <>
                                  <FaBan /> {isEn ? 'PROHIBITED' : 'PROHIBICIÓN'}
                                </>
                              )}
                            </div>
                            <div className="terms-item-text">
                              {isEn ? item.textEn : item.textEs}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* 4. Support & Direct Contact Box */}
        <section className="terms-support-card">
          <div className="terms-support-grid">
            <div className="terms-support-info">
              <div className="terms-support-tag">
                <FaPhoneAlt /> {isEn ? '24/7 Customer Service' : 'Atención al Cliente'}
              </div>
              <h3>
                {isEn
                  ? 'Have questions about policies, baggage or ticket changes?'
                  : '¿Tienes dudas sobre las políticas, equipaje o reprogramaciones?'}
              </h3>
              <p>
                {isEn
                  ? 'Our team is ready to assist you. Contact our central offices or message us directly via WhatsApp.'
                  : 'Nuestro equipo de atención está listo para asesorarte de forma personalizada antes y durante tu viaje.'}
              </p>
            </div>

            <div className="terms-contact-chips">
              <a href="tel:997040003" className="terms-contact-pill">
                <FaPhoneAlt /> <span>Central: 997040003</span>
              </a>
              <a
                href="https://wa.me/51997040003?text=Hola,%20deseo%20asistencia%20con%20mi%20boleto%20de%20viaje."
                target="_blank"
                rel="noopener noreferrer"
                className="terms-contact-pill whatsapp"
              >
                <FaWhatsapp /> <span>WhatsApp: +51 997040003</span>
              </a>
              <div className="terms-contact-pill location">
                <FaMapMarkerAlt /> <span>Cusco & Quillabamba</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
