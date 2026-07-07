document.addEventListener('DOMContentLoaded', () => {
    const e = document.querySelector('.menu-toggle'), t = document.querySelector('.nav-links'), n = document.getElementById('main-header');
    e && t && e.addEventListener('click', () => {
        t.classList.toggle('active');
        const n = e.querySelector('i');
        t.classList.contains('active') ? n.classList.replace('fa-bars', 'fa-times') : n.classList.replace('fa-times', 'fa-bars')
    });
    const o = () => { window.scrollY > 50 ? n.classList.add('scrolled') : n.classList.remove('scrolled') };
    window.addEventListener('scroll', o), o();
    const r = new IntersectionObserver(e => {
        e.forEach(e => { e.isIntersecting && e.target.classList.add('active') })
    }, { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(e => r.observe(e)), document.querySelectorAll('a[href^="#"]').forEach(n => {
        n.addEventListener('click', function (o) {
            o.preventDefault();
            const r = document.querySelector(this.getAttribute('href'));
            r && (t.classList.contains('active') && (t.classList.remove('active'), e.querySelector('i').classList.replace('fa-times', 'fa-bars')), window.scrollTo({ top: r.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' }))
        })
    });
    const l = document.getElementById('lang-switch');
    let a = 'es';
    const s = {
        en: {
            nav_routes: "Routes", nav_services: "Services", nav_location: "Find Us", nav_contact: "Contact", btn_enquire: "Enquire", hero_eyebrow: "Safety · Speed · Comfort", hero_h1_1: "We Reach ", hero_h1_grad: "Faster", hero_h1_2: " to Your Destination", hero_p: "Intercity transport service in modern 3-row SUVs. Daily departures and certified shipping nationwide.", btn_view_routes: "View Routes", btn_our_services: "Our Services", service_1_h3: "Cargo & Transfers", service_1_p: "Shipping of envelopes, packages, and money transfers with the highest security and speed in the market.", service_2_h3: "Daily Departures", service_2_p: "Constant scheduling to Hidroeléctrica, Quillabamba, Lima, and more strategic destinations.", service_3_h3: "Expert Drivers", service_3_p: "Professional drivers with extensive experience in high Andean and jungle routes.", routes_subtitle: "Passenger Transport", routes_h2: "Routes and Destinations", card_1_h3: "Machu Picchu Route", card_1_p: "Direct and fast service for tourists and locals seeking punctuality.", meta_express: "Express", meta_comfort: "Comfort", btn_enquire_now: "Enquire Now", card_2_h3: "La Convención Route", card_2_p: "Daily trips via the Malaga route with expert drivers.", meta_daily: "Daily", card_3_h3: "Quellouno Route", card_3_p: "Fast and safe connection to the Quellouno valley every day.", meta_jungle: "Jungle", meta_fast: "Fast", card_4_h3: "Sacred Valley Route", card_4_p: "Frequent transport to the heart of Calca in modern SUVs.", meta_valley: "Valley", meta_frequent: "Frequent", card_5_h3: "Train Connection", card_5_p: "Arrive on time for your train to Machu Picchu with our executive service.", meta_train: "Train", meta_punctual: "Punctual", card_6_h3: "National Route", card_6_p: "Special service to the capital with GPS and 24/7 monitoring.", meta_direct: "Direct", meta_executive: "Executive", card_7_h3: "Intercity Route", card_7_p: "The fastest and safest option to travel to Abancay.", meta_veloz: "Fast", meta_secure: "Safe", map_subtitle: "Visit Us", map_h2: "Find Us At", footer_desc: "Leaders in intercity land transport and cargo logistics in the Cusco region.", footer_contact: "Direct Contact", footer_social: "Social Media", footer_copy: "&copy; 2026 Inversiones Tunki Chasky S.R.L. | Designed for excellence.", test_subtitle: "Testimonials", test_h2: "What our passengers say", test_1_p: '"Excellent service, very fast and the SUVs are very comfortable. 100% recommended."', test_1_meta: "Frequent Passenger", test_2_p: '"The best option for sending packages to Quillabamba. Very reliable and punctual."', test_2_meta: "Merchant", test_3_p: '"Professional and very friendly drivers. The safest way to travel the route."', test_3_meta: "Executive Traveler",
            btn_tourist_info: "Tourist Info",
            route_1_title: "Machu Picchu Route (Hidroeléctrica)",
            route_1_desc: "La Hidroeléctrica is the main alternative gateway to Machu Picchu. From here, you start a beautiful 2.5 to 3-hour trek along the train tracks surrounded by dense tropical jungle until you reach Aguas Calientes (Machu Picchu Pueblo). It is an economical and highly scenic route offering stunning views of the Vilcanota River canyon.",
            route_2_title: "La Convención Route (Quillabamba)",
            route_2_desc: "Quillabamba, known as the 'City of Eternal Summer', is the capital of the La Convención province. It has a warm tropical climate and valleys filled with coffee, cacao, and tea plantations. Main tourist attractions include the Siete Tinajas waterfalls, the Sambaray resort, and its delicious local cuisine.",
            route_3_title: "Quellouno Route",
            route_3_desc: "Quellouno is a lush valley district rich in tropical agriculture. It is an ideal ecotourism destination, famous for its majestic jungle-edge landscapes, crystal-clear rivers perfect for swimming and adventure sports, and warm, welcoming locals.",
            route_4_title: "Sacred Valley Route (Calca)",
            route_4_desc: "Calca lies in the heart of the Sacred Valley of the Incas. It features beautiful snow-capped peaks like Pitusiray, the soothing hot springs of Machacancha and Minas Moqo, and archaeological treasures like Huchuy Qosqo. Its mild climate makes it perfect for relaxation.",
            route_5_title: "Train Connection (Ollantaytambo)",
            route_5_desc: "Ollantaytambo is the only living Inca town, preserving its original urban planning. The fortress ruins are a masterpiece of stone architecture. It also serves as the principal train station to Machu Picchu, making it a bustling and colorful cultural hub.",
            route_6_title: "National Route (Lima)",
            route_6_desc: "Lima, the capital of Peru, sits on the Pacific coast. It blends history in its UNESCO-listed Colonial Center, world-class museums, and coastal neighborhoods like Miraflores and Barranco. It is also celebrated as the gastronomic capital of Latin America.",
            route_7_title: "Intercity Route (Abancay)",
            route_7_desc: "Abancay, the 'Valley of Eternal Spring', is known for its mild weather and the deep Apurímac Canyon. Nearby, the Ampay National Sanctuary hosts unique native Intimpa forests and the gorgeous alpine lagoon of Uspaccocha."
        },
        es: {
            nav_routes: "Rutas", nav_services: "Servicios", nav_location: "Ubícanos", nav_contact: "Contacto", btn_enquire: "Consultar", hero_eyebrow: "Seguridad · Rapidez · Confort", hero_h1_1: "Llegamos ", hero_h1_grad: "Más Rápido", hero_h1_2: " a tu Destino", hero_p: "Servicio de transporte interurbano en modernas camionetas de 3 filas. Salidas diarias y envíos certificados a nivel nacional.", btn_view_routes: "Ver Rutas", btn_our_services: "Nuestros Servicios", service_1_h3: "Encomiendas y Giros", service_1_p: "Envío de sobres, paquetes y giros de dinero con la mayor seguridad y rapidez del mercado.", service_2_h3: "Salidas Diarias", service_2_p: "Programación constante hacia Hidroeléctrica, Quillabamba, Lima y más destinos estratégicos.", service_3_h3: "Conductores Expertos", service_3_p: "Conductores profesionales con amplia experiencia en rutas altoandinas y de selva.", routes_subtitle: "Transporte de Pasajeros", routes_h2: "Rutas y Destinos", card_1_h3: "Ruta a Machu Picchu", card_1_p: "Servicio directo y veloz para turistas y locales buscando puntualidad.", meta_express: "Express", meta_comfort: "Confort", btn_enquire_now: "Consultar Ahora", card_2_h3: "Ruta de la Convención", card_2_p: "Viajes diarios por la ruta Málaga con conductores expertos.", meta_daily: "Diario", card_3_h3: "Ruta Quellouno", card_3_p: "Conexión rápida y segura hacia el valle de Quellouno todos los días.", meta_jungle: "Selva", meta_fast: "Rápido", card_4_h3: "Ruta Valle Sagrado", card_4_p: "Transporte frecuente hacia el corazón de Calca en camionetas modernas.", meta_valley: "Valle", meta_frequent: "Frecuente", card_5_h3: "Conexión Trenes", card_5_p: "Llega a tiempo para tu tren a Machu Picchu con nuestro servicio ejecutivo.", meta_train: "Tren", meta_punctual: "Puntual", card_6_h3: "Ruta Nacional", card_6_p: "Servicio especial hacia la capital con GPS y monitoreo 24/7.", meta_direct: "Directo", meta_executive: "Ejecutivo", card_7_h3: "Ruta Interurbana", card_7_p: "La opción más veloz y segura para viajar hacia Abancay.", meta_veloz: "Veloz", meta_secure: "Seguro", map_subtitle: "Visítanos", map_h2: "Encuéntranos en", footer_desc: "Líderes en transporte terrestre interurbano y logística de encomiendas en la región Cusco.", footer_contact: "Contacto Directo", footer_social: "Redes Sociales", footer_copy: "&copy; 2026 Inversiones Tunki Chasky S.R.L. | Diseñado para la excelencia.", test_subtitle: "Testimonios", test_h2: "Lo que dicen nuestros pasajeros", test_1_p: '"Excelente servicio, muy rápido y las camionetas son muy cómodas. Recomendado al 100%."', test_1_meta: "Pasajero Frecuente", test_2_p: '"La mejor opción para enviar encomiendas a Quillabamba. Muy confiables y puntuales."', test_2_meta: "Comerciante", test_3_p: '"Conductores profesionales y muy amables. La forma más segura de viajar por la ruta."', test_3_meta: "Viajero Ejecutivo",
            btn_tourist_info: "Info Turística",
            route_1_title: "Ruta a Machu Picchu (Hidroeléctrica)",
            route_1_desc: "La Hidroeléctrica es la principal puerta de entrada alternativa a Machu Picchu. Desde este punto, se realiza una hermosa caminata de 2.5 a 3 horas a lo largo de las vías del tren rodeado de densa vegetación tropical hasta llegar a Aguas Calientes (Machu Picchu Pueblo). Es una ruta económica y llena de aventura con vistas increíbles del cañón del Vilcanota.",
            route_2_title: "Ruta de la Convención (Quillabamba)",
            route_2_desc: "Quillabamba, conocida como la 'Ciudad del Eterno Verano', es la capital de la provincia de La Convención. Posee un clima cálido y valles llenos de plantaciones de café, cacao y té. Entre sus principales atractivos destacan las Cascadas de Siete Tinajas, el balneario de Sambaray y su exquisita gastronomía tropical.",
            route_3_title: "Ruta Quellouno",
            route_3_desc: "Quellouno es un exuberante distrito ubicado en el valle de La Convención. Es una zona agrícola rica en frutas tropicales e ideal para el ecoturismo. Es famoso por sus hermosos paisajes de ceja de selva, ríos cristalinos propicios para actividades de aventura, y su hospitalaria población local.",
            route_4_title: "Ruta Valle Sagrado (Calca)",
            route_4_desc: "Calca está ubicada en el corazón del majestuoso Valle Sagrado de los Incas. Cuenta con nevados impresionantes como el Pitusiray, baños termo-medicinales de Machacancha y Minas Moqo, así como importantes zonas arqueológicas como Huchuy Qosqo. Su clima templado y paisajes verdes la hacen un destino imperdible.",
            route_5_title: "Conexión Trenes (Ollantaytambo)",
            route_5_desc: "Ollantaytambo es el único pueblo inca viviente que mantiene su planificación urbana original. Su fortaleza arqueológica es una obra maestra de la arquitectura incaica. Es también el punto de partida de la mayoría de trenes hacia Machu Picchu, convirtiéndolo en un centro turístico vibrante.",
            route_6_title: "Ruta Nacional (Lima)",
            route_6_desc: "Lima, la capital del Perú, se ubica frente al Océano Pacífico. Combina modernidad y tradición con su hermoso Centro Histórico Colonial (Patrimonio de la Humanidad), museos reconocidos a nivel mundial, y distritos costeros como Miraflores y Barranco. Es la capital gastronómica de América Latina.",
            route_7_title: "Ruta Interurbana (Abancay)",
            route_7_desc: "Abancay, conocida como 'El Valle de la Eterna Primavera', destaca por su clima agradable y el majestuoso Cañón del Apurímac (uno de los más profundos del mundo). Alberga el Santuario Nacional de Ampay con su bosque de intimpas (árboles nativos) y la hermosa laguna de Uspaccocha."
        }
    };
    l && l.addEventListener('click', () => {
        a = 'es' === a ? 'en' : 'es', l.textContent = 'es' === a ? 'EN' : 'ES', document.documentElement.lang = a, document.querySelectorAll("[data-i18n]").forEach(e => {
            const t = e.getAttribute("data-i18n");
            s[a][t] && (e.innerHTML = s[a][t])
        })
    });
    const c = document.getElementById('tourist-modal'), u = document.getElementById('modal-title'), d = document.getElementById('modal-image'), i = document.getElementById('modal-description'), m = document.getElementById('modal-whatsapp-link'), g = document.querySelector('.modal-close');
    document.querySelectorAll('.btn-tourist-info').forEach(e => {
        e.addEventListener('click', n => {
            n.preventDefault();
            const o = e.getAttribute('data-route'), r = e.closest('.destination-card'), l = r.querySelector('.card-image img').src, sVal = s[a][`route_${o}_title`], dVal = s[a][`route_${o}_desc`], wHref = r.querySelector('a.btn-text:not(.btn-tourist-info)').href;
            u.textContent = sVal || '', i.innerHTML = dVal || '', d.src = l, d.alt = sVal || '', m.href = wHref, c.classList.add('active')
        })
    });
    g && g.addEventListener('click', () => c.classList.remove('active'));
    c && c.addEventListener('click', e => { e.target === c && c.classList.remove('active') });
});
