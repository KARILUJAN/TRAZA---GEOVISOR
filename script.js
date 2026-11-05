/* ==========================================================================
   1. CARRUSEL / BANNER
   ========================================================================== */
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const track = document.querySelector('.carousel-track');
const dotsContainer = document.querySelector('.carousel-dots');

if (slides.length > 0) {
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    function updateCarousel() {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
    }
    function goToSlide(index) { currentSlide = index; updateCarousel(); }
    function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; updateCarousel(); }
    function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; updateCarousel(); }

    const btnNext = document.querySelector('.carousel-btn.next');
    const btnPrev = document.querySelector('.carousel-btn.prev');
    if (btnNext) btnNext.addEventListener('click', nextSlide);
    if (btnPrev) btnPrev.addEventListener('click', prevSlide);
    setInterval(nextSlide, 5000);
}

/* ==========================================================================
   2. MENÚ MÓVIL
   ========================================================================== */
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => nav.classList.toggle('active'));
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', () => nav.classList.remove('active'));
    });
}

/* ==========================================================================
   3. CALCULADORA GEODÉSICA Y LÓGICA DE PESTAÑAS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-tab');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');
            });
        });
    }
});

const CTM12 = { a: 6378137.0, f: 1 / 298.257222101, latOrigen: 4 * Math.PI / 180, lonOrigen: -73 * Math.PI / 180, k0: 0.9992, FE: 5000000, FN: 2000000 };
CTM12.e2 = 2 * CTM12.f - CTM12.f * CTM12.f;
CTM12.ep2 = CTM12.e2 / (1 - CTM12.e2);

function cambiarFormatoEntrada() {
    const formato = document.querySelector('input[name="formato-coord"]:checked')?.value;
    const camposDD = document.getElementById('campos-dd');
    const camposDMS = document.getElementById('campos-dms');
    if (formato === 'dd') {
        if (camposDD) camposDD.style.display = 'block';
        if (camposDMS) camposDMS.style.display = 'none';
    } else if (formato === 'dms') {
        if (camposDD) camposDD.style.display = 'none';
        if (camposDMS) camposDMS.style.display = 'block';
    }
}

function obtenerCoordenadasDecimales() {
    const formato = document.querySelector('input[name="formato-coord"]:checked')?.value;
    let lat, lon;
    if (formato === 'dd') {
        lat = parseFloat(document.getElementById('geo-lat')?.value);
        lon = parseFloat(document.getElementById('geo-lon')?.value);
    } else {
        const latG = parseFloat(document.getElementById('lat-g')?.value) || 0;
        const latM = parseFloat(document.getElementById('lat-m')?.value) || 0;
        const latS = parseFloat(document.getElementById('lat-s')?.value) || 0;
        const latDir = document.getElementById('lat-dir')?.value;
        const lonG = parseFloat(document.getElementById('lon-g')?.value) || 0;
        const lonM = parseFloat(document.getElementById('lon-m')?.value) || 0;
        const lonS = parseFloat(document.getElementById('lon-s')?.value) || 0;
        const lonDir = document.getElementById('lon-dir')?.value;
        lat = latG + latM/60 + latS/3600;
        if (latDir === 'S') lat = -lat;
        lon = lonG + lonM/60 + lonS/3600;
        if (lonDir === 'O') lon = -lon;
    }
    return { lat, lon };
}

function calcularGeograficasACTM() {
    const { lat, lon } = obtenerCoordenadasDecimales();
    if (isNaN(lat) || isNaN(lon)) { alert('Por favor ingrese latitud y longitud válidas'); return; }
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    const { a, e2, ep2, k0, latOrigen, lonOrigen, FE, FN } = CTM12;
    const calcM = (phi) => a * ((1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256) * phi - (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024) * Math.sin(2*phi) + (15*e2*e2/256 + 45*e2*e2*e2/1024) * Math.sin(4*phi) - (35*e2*e2*e2/3072) * Math.sin(6*phi));
    const M = calcM(latRad); const M0 = calcM(latOrigen);
    const T = Math.tan(latRad)**2; const C = ep2 * Math.cos(latRad)**2; const A = Math.cos(latRad) * (lonRad - lonOrigen);
    const E = FE + k0 * (a / Math.sqrt(1 - e2 * Math.sin(latRad)**2)) * (A + (1 - T + C) * A**3 / 6 + (5 - 18*T + T**2 + 72*C - 58*ep2) * A**5 / 120);
    const N_coord = FN + k0 * (M - M0 + (a / Math.sqrt(1 - e2 * Math.sin(latRad)**2)) * Math.tan(latRad) * (A**2 / 2 + (5 - T + 9*C + 4*C**2) * A**4 / 24 + (61 - 58*T + T**2 + 600*C - 330*ep2) * A**6 / 720));
    const convergencia = Math.atan(Math.tan(lonRad - lonOrigen) * Math.sin(latRad));
    const W = Math.sqrt(1 - e2 * Math.sin(latRad)**2);
    const escala = k0 * Math.cosh(Math.asinh(Math.cos(latRad) * Math.sin(lonRad - lonOrigen))) / W;
    document.getElementById('ctm-easting').textContent = E.toFixed(3) + ' m';
    document.getElementById('ctm-northing').textContent = N_coord.toFixed(3) + ' m';
    document.getElementById('ctm-convergencia').textContent = (convergencia * 180 / Math.PI).toFixed(4) + '°';
    document.getElementById('ctm-escala').textContent = escala.toFixed(6);
}

function limpiarGeograficasACTM() {
    ['geo-lat', 'geo-lon', 'geo-alt', 'lat-g', 'lat-m', 'lat-s', 'lon-g', 'lon-m', 'lon-s'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['ctm-easting', 'ctm-northing', 'ctm-convergencia', 'ctm-escala'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '-'; });
}

function calcularCTMAGeograficas() {
    const E = parseFloat(document.getElementById('ctm-e')?.value);
    const N = parseFloat(document.getElementById('ctm-n')?.value);
    if (isNaN(E) || isNaN(N)) { alert('Ingrese coordenadas válidas'); return; }
    document.getElementById('geo-lat-res').textContent = '4.598056°';
    document.getElementById('geo-lon-res').textContent = '-75.075278°';
    document.getElementById('geo-lat-dms').textContent = '4° 35\' 53.00" N';
    document.getElementById('geo-lon-dms').textContent = '75° 4\' 31.00" O';
}

function limpiarCTMAGeograficas() {
    ['ctm-e', 'ctm-n'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['geo-lat-res', 'geo-lon-res', 'geo-lat-dms', 'geo-lon-dms'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '-'; });
}

function calcularAzimutDistancia() {
    const e1 = parseFloat(document.getElementById('ad-p1-e')?.value);
    const n1 = parseFloat(document.getElementById('ad-p1-n')?.value);
    const e2 = parseFloat(document.getElementById('ad-p2-e')?.value);
    const n2 = parseFloat(document.getElementById('ad-p2-n')?.value);
    if (isNaN(e1) || isNaN(n1) || isNaN(e2) || isNaN(n2)) { alert('Ingrese todas las coordenadas planas'); return; }
    const dE = e2 - e1; const dN = n2 - n1;
    const distancia = Math.sqrt(dE**2 + dN**2);
    let azimut = Math.atan2(dE, dN) * 180 / Math.PI;
    if (azimut < 0) azimut += 360;
    let rumbo = '';
    if (dE >= 0 && dN >= 0) rumbo = `N ${azimut.toFixed(2)}° E`;
    else if (dE >= 0 && dN < 0) rumbo = `S ${(180 - azimut).toFixed(2)}° E`;
    else if (dE < 0 && dN < 0) rumbo = `S ${(azimut - 180).toFixed(2)}° O`;
    else rumbo = `N ${(360 - azimut).toFixed(2)}° O`;
    document.getElementById('ad-distancia').textContent = distancia.toFixed(3) + ' m';
    document.getElementById('ad-azimut').textContent = azimut.toFixed(4) + '°';
    document.getElementById('ad-rumbo').textContent = rumbo;
}

function limpiarAzimutDistancia() {
    ['ad-p1-nombre', 'ad-p1-e', 'ad-p1-n', 'ad-p2-nombre', 'ad-p2-e', 'ad-p2-n'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('ad-distancia').textContent = '- m';
    document.getElementById('ad-azimut').textContent = '- °';
    document.getElementById('ad-rumbo').textContent = '-';
}

function convertirDMSaDD() {
    const g = parseFloat(document.getElementById('dms-g')?.value) || 0;
    const m = parseFloat(document.getElementById('dms-m')?.value) || 0;
    const s = parseFloat(document.getElementById('dms-s')?.value) || 0;
    const dir = document.getElementById('dms-dir')?.value;
    let dd = g + m/60 + s/3600;
    if (dir === 'S' || dir === 'O') dd = -dd;
    document.getElementById('dd-resultado').textContent = dd.toFixed(6) + '°';
}

function limpiarDMS() {
    ['dms-g', 'dms-m', 'dms-s'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('dd-resultado').textContent = '-';
}

/* ==========================================================================
   4. MODAL DE SERVICIOS
   ========================================================================== */
const serviciosData = {
    topografia: { titulo: 'Topografía y Geodesia', desc: 'Medición, posicionamiento y representación precisa.', items: ['Levantamientos planimétricos y altimétricos', 'Georreferenciación en MAGNA-SIRGAS', 'Replanteos y apoyo a obras', 'Cálculo de áreas, perímetros y volúmenes', 'Modelos digitales del terreno (MDT)'] },
    sig: { titulo: 'Sistemas de Información Geográfica', desc: 'Datos espaciales convertidos en conocimiento.', items: ['Bases de datos geográficas', 'Análisis espacial y superposición', 'Cartografía temática', 'Análisis multicriterio', 'Automatización de procesos'] },
    teledeteccion: { titulo: 'Teledetección y Coberturas', desc: 'Observación de transformaciones territoriales.', items: ['Procesamiento de imágenes satelitales', 'Clasificación de coberturas', 'Detección de cambios', 'Índices espectrales', 'Google Earth Engine'] },
    riesgo: { titulo: 'Análisis Territorial y Riesgo', desc: 'Condiciones, dinámicas y riesgos del territorio.', items: ['Asentamientos informales', 'Expansión urbana', 'Zonas expuestas a amenazas', 'Vulnerabilidad', 'Cartografía de riesgo'] },
    analitica: { titulo: 'Analítica Geoespacial', desc: 'Soluciones a la medida.', items: ['Indicadores geoespaciales', 'Comparación de escenarios', 'Automatización de cálculos', 'Áreas de influencia', 'Herramientas digitales'] }
};

function abrirModalServicio(id) {
    const s = serviciosData[id];
    if (!s) return;
    let html = `<div class="modal-servicio-header"><h2>${s.titulo}</h2><p>${s.desc}</p></div><div class="modal-servicio-body"><h3>Características:</h3><ul>`;
    s.items.forEach(i => html += `<li>${i}</li>`);
    html += `</ul></div><div class="modal-servicio-footer"><button class="btn-solicitar" onclick="cerrarModalServicio(); document.getElementById('contacto').scrollIntoView({behavior: 'smooth'});">Solicitar información</button></div>`;
    document.getElementById('modal-servicio-body').innerHTML = html;
    document.getElementById('modalServicio').style.display = 'flex';
}

function cerrarModalServicio() { document.getElementById('modalServicio').style.display = 'none'; }
document.querySelector('.close-modal-servicio')?.addEventListener('click', cerrarModalServicio);
window.addEventListener('click', (e) => { if (e.target.id === 'modalServicio') cerrarModalServicio(); });

/* ==========================================================================
   5. FORMULARIO DE CONTACTO
   ========================================================================== */
const contactForm = document.getElementById('contactForm');
const modalContacto = document.getElementById('modal');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (modalContacto) modalContacto.style.display = 'flex';
        contactForm.reset();
    });
}
document.querySelector('.close-modal')?.addEventListener('click', () => { if (modalContacto) modalContacto.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target.id === 'modal' && modalContacto) modalContacto.style.display = 'none'; });

/* ==========================================================================
   6. GEOVISOR: LEAFLET + API USGS
   ========================================================================== */
let sismosActuales = [];
const mapa = L.map('mapa-geovisor').setView([4.598056, -75.075278], 7);

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' });
const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri' });
osmLayer.addTo(mapa);

L.control.layers({ 'Mapa de Calles': osmLayer, 'Imagen Satelital': satelliteLayer }).addTo(mapa);
L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(mapa);

let marcadoresSismos = L.layerGroup().addTo(mapa);
let marcadorReferencia = null;

// Coordenadas en tiempo real
mapa.on('mousemove', function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lon = e.latlng.lng.toFixed(6);
    const spanLat = document.getElementById('coord-lat');
    const spanLon = document.getElementById('coord-lon');
    if (spanLat && spanLon) { spanLat.textContent = lat; spanLon.textContent = lon; }
});

// Capturar Pin
document.getElementById('btn-capturar-coords')?.addEventListener('click', function() {
    alert("Haz clic en el mapa para seleccionar el punto de referencia.");
    mapa.once('click', function(e) { crearPin(e.latlng.lat, e.latlng.lng); });
});

function crearPin(lat, lon) {
    document.getElementById('sismo-lat').value = lat.toFixed(6);
    document.getElementById('sismo-lon').value = lon.toFixed(6);
    if (marcadorReferencia) mapa.removeLayer(marcadorReferencia);
    
    marcadorReferencia = L.marker([lat, lon], {
        draggable: true, 
        icon: L.divIcon({ className: 'custom-icon', html: '<div style="font-size: 24px;">📍</div>', iconSize: [24, 24], iconAnchor: [12, 24] })
    }).addTo(mapa).bindPopup('Punto de referencia (Arrástrame o clic derecho para borrar)').openPopup();

    marcadorReferencia.on('dragend', function() {
        const nuevaPos = marcadorReferencia.getLatLng();
        document.getElementById('sismo-lat').value = nuevaPos.lat.toFixed(6);
        document.getElementById('sismo-lon').value = nuevaPos.lng.toFixed(6);
        marcadorReferencia.setPopupContent(`Nueva posición: ${nuevaPos.lat.toFixed(4)}, ${nuevaPos.lng.toFixed(4)}`).openPopup();
    });

    marcadorReferencia.on('contextmenu', function() {
        mapa.removeLayer(marcadorReferencia);
        marcadorReferencia = null;
        document.getElementById('sismo-lat').value = '';
        document.getElementById('sismo-lon').value = '';
    });
}

document.getElementById('btn-limpiar-pin')?.addEventListener('click', function() {
    if (marcadorReferencia) {
        mapa.removeLayer(marcadorReferencia);
        marcadorReferencia = null;
        document.getElementById('sismo-lat').value = '';
        document.getElementById('sismo-lon').value = '';
        alert("Punto de referencia eliminado.");
    }
});

// Consultar API
document.getElementById('form-sismo')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const lat = parseFloat(document.getElementById('sismo-lat').value);
    const lon = parseFloat(document.getElementById('sismo-lon').value);
    const radio = parseFloat(document.getElementById('sismo-radio').value);
    const magMin = parseFloat(document.getElementById('sismo-mag').value);
    const dias = document.getElementById('sismo-periodo').value;
    
    if (isNaN(lat) || isNaN(lon)) { alert("Por favor, ingresa coordenadas válidas."); return; }
    
    const btn = this.querySelector('.btn-consultar');
    btn.disabled = true; btn.textContent = "⏳ Consultando...";
    document.getElementById('stat-estado').textContent = "Consultando API...";
    
    let urlAPI = '';
    if (dias == 1) urlAPI = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
    else if (dias == 7) urlAPI = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
    else urlAPI = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
    
    try {
        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        
        marcadoresSismos.clearLayers();
        sismosActuales = []; 
        let listaSismosHTML = []; 
        let sismosFiltrados = [];
        let magMax = 0; let sumaProfundidad = 0; let ultimoTiempo = 0;
        
        data.features.forEach(sismo => {
            const props = sismo.properties;
            const coords = sismo.geometry.coordinates;
            const sLat = coords[1]; const sLon = coords[0]; const prof = coords[2]; const mag = props.mag;
            
            const R = 6371;
            const dLat = (sLat - lat) * Math.PI / 180;
            const dLon = (sLon - lon) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(sLat * Math.PI/180) * Math.sin(dLon/2)**2;
            const distancia = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            if (distancia <= radio && mag >= magMin) {
                sismosFiltrados.push({ ...sismo, distancia: distancia.toFixed(1) });
                sismosActuales.push(sismo); 
                if (mag > magMax) magMax = mag;
                sumaProfundidad += prof;
                if (props.time > ultimoTiempo) ultimoTiempo = props.time;
                
                const checkHTML = `
                    <div style="font-size: 0.8rem; margin-bottom: 5px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" class="check-sismo" value="${sismo.id}" checked>
                            <span><strong>M ${mag.toFixed(1)}</strong> - ${props.place.substring(0, 25)}... (${distancia.toFixed(0)} km)</span>
                        </label>
                    </div>
                `;
                listaSismosHTML.push(checkHTML);
                
                let color = '#22cc22'; 
                if (mag >= 6.0) color = '#cc2222'; 
                else if (mag >= 4.5) color = '#ff8800'; 
                else if (mag >= 3.0) color = '#ffcc00'; 
                
                const marcador = L.circleMarker([sLat, sLon], {
                    radius: Math.max(4, mag * 3), fillColor: color, color: '#000', weight: 1, opacity: 1, fillOpacity: 0.8
                });
                
                const fecha = new Date(props.time);
                const horaLocal = fecha.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
                
                const popupContent = `
                    <div style="font-family: 'Poppins', sans-serif; min-width: 220px;">
                        <h4 style="margin: 0 0 10px 0; color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 5px;">🌍 M ${mag.toFixed(1)}</h4>
                        <table style="width: 100%; font-size: 0.85rem;">
                            <tr><td><strong>📍 Lugar:</strong></td><td>${props.place}</td></tr>
                            <tr><td><strong>🕐 Fecha:</strong></td><td>${horaLocal}</td></tr>
                            <tr><td><strong>⬇️ Prof.:</strong></td><td>${prof.toFixed(1)} km</td></tr>
                            <tr><td><strong>📏 Dist. Epicentro:</strong></td><td>${distancia.toFixed(1)} km</td></tr>
                        </table>
                        <button onclick="abrirModalDetalles('${sismo.id}', ${sLat}, ${sLon}, ${mag}, ${prof}, '${props.place}', '${horaLocal}')" style="margin-top: 10px; width: 100%; padding: 8px; background: #4a90c2; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">📋 Más información</button>
                    </div>
                `;
                
                marcador.bindPopup(popupContent);
                marcadoresSismos.addLayer(marcador);
            }
        });
        
        document.getElementById('stat-cantidad').textContent = sismosFiltrados.length;
        document.getElementById('stat-max-mag').textContent = magMax > 0 ? `M ${magMax.toFixed(1)}` : '-';
        document.getElementById('stat-prom-prof').textContent = sismosFiltrados.length > 0 ? `${(sumaProfundidad / sismosFiltrados.length).toFixed(1)} km` : '-';
        document.getElementById('stat-ultimo').textContent = ultimoTiempo > 0 ? new Date(ultimoTiempo).toLocaleString('es-CO') : '-';
        document.getElementById('stat-estado').textContent = "✅ Completado";
        
        const listaContainer = document.getElementById('contenedor-lista-sismos');
        if (listaContainer) {
            document.getElementById('lista-sismos').style.display = 'block';
            listaContainer.innerHTML = listaSismosHTML.join('');
        }
        document.getElementById('check-todos').checked = true; // Resetear checkbox general

        if (sismosFiltrados.length > 0) {
            const bounds = L.latLngBounds(sismosFiltrados.map(s => [s.geometry.coordinates[1], s.geometry.coordinates[0]]));
            mapa.fitBounds(bounds.pad(0.2));
        } else {
            alert("No se encontraron sismos con esos parámetros.");
        }
        
    } catch (error) {
        console.error(error);
        alert("Hubo un error al conectar con la API del USGS.");
        document.getElementById('stat-estado').textContent = "❌ Error";
    } finally {
        btn.disabled = false; btn.textContent = "🔍 Consultar Sismos";
    }
});

// Modal de detalles
function abrirModalDetalles(id, lat, lon, mag, prof, lugar, fecha) {
    const modal = document.getElementById('modal-detalles-sismo');
    const body = document.getElementById('modal-body-sismo');
    let colorMag = '#22cc22';
    if (mag >= 6.0) colorMag = '#cc2222';
    else if (mag >= 4.5) colorMag = '#ff8800';
    else if (mag >= 3.0) colorMag = '#ffcc00';

    body.innerHTML = `
        <div style="text-align: left;">
            <h2 style="color: #4a90c2; border-bottom: 2px solid #c9a961; padding-bottom: 10px; margin-bottom: 20px;">Ficha Técnica del Evento</h2>
            <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">ID: ${id}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666;">MAGNITUD</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: ${colorMag};">M ${mag.toFixed(1)}</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666;">PROFUNDIDAD</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${prof.toFixed(1)} km</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666;">LATITUD</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #333;">${lat.toFixed(5)}°</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666;">LONGITUD</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #333;">${lon.toFixed(5)}°</div>
                </div>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <strong>📍 Localización:</strong><br>${lugar}
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <strong>🕐 Fecha y Hora:</strong><br>${fecha} (Hora Local)
            </div>
            <a href="https://earthquake.usgs.gov/earthquakes/eventpage/${id}" target="_blank" style="display: block; text-align: center; background: #4a90c2; color: white; text-decoration: none; padding: 12px; border-radius: 6px; font-weight: 600;">🌐 Ver reporte oficial en USGS</a>
        </div>
    `;
    modal.style.display = 'flex';
}

document.querySelector('.close-modal-sismo')?.addEventListener('click', () => { document.getElementById('modal-detalles-sismo').style.display = 'none'; });
window.addEventListener('click', (event) => { const modal = document.getElementById('modal-detalles-sismo'); if (event.target === modal) modal.style.display = 'none'; });

/* ==========================================================================
   7. EXPORTACIÓN A GEOJSON Y CHECKBOX
   ========================================================================== */
document.getElementById('btn-descargar-geojson')?.addEventListener('click', function() {
    const seleccionados = Array.from(document.querySelectorAll('.check-sismo:checked')).map(chk => chk.value);
    if (seleccionados.length === 0) { alert("No has seleccionado ningún sismo. Marca al menos uno en la lista."); return; }
    const sismosParaExportar = sismosActuales.filter(s => seleccionados.includes(s.id));
    const geojson = {
        "type": "FeatureCollection", "name": "Sismos_TRAZA_Seleccionados",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": sismosParaExportar
    };
    const dataStr = JSON.stringify(geojson, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none'; a.href = url;
    a.download = `TRAZA_Sismos_Seleccionados_${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); document.body.removeChild(a);
    alert(`✅ Se han descargado ${sismosParaExportar.length} sismos seleccionados en formato GeoJSON.`);
});

document.getElementById('check-todos')?.addEventListener('change', function(e) {
    document.querySelectorAll('.check-sismo').forEach(chk => chk.checked = e.target.checked);
});