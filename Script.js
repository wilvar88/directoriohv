const GAS_URL = "https://script.google.com/macros/s/AKfycbx-ePGGBQt9NGJsrdgosqO3Q06aQvn3-xhYRFue-wlzsJxcmsNROcmkouot1iO1-Lo/exec";

let dataOriginal = [];
let candidatoActual = null;

document.addEventListener('DOMContentLoaded', () => {
   if (GAS_URL === "SU_URL_DE_APPS_SCRIPT_AQUI" || !GAS_URL) {
      mostrarErrorGlobal("Configuración Incompleta", "Debes pegar tu URL de Google Apps Script en la variable GAS_URL dentro del archivo Script.js");
      return;
   }

   cargarDatosDesdeAPI();

   document.getElementById('searchInput').addEventListener('input', filtrarCandidatos);
   document.getElementById('btnDescargarPDF').addEventListener('click', descargarPDF);
   document.getElementById('btnDescargarSeleccionados').addEventListener('click', descargarSeleccionados);
   document.getElementById('btnDescargarTodo').addEventListener('click', descargarTodo);
});

async function cargarDatosDesdeAPI() {
   try {
      const response = await fetch(GAS_URL);
      const res = await response.json();
      
      if(res.status === 'success') {
         inicializarApp(res.data);
      } else {
         mostrarErrorGlobal("Error del Servidor", res.message || "Error desconocido en Apps Script");
      }
   } catch (error) {
      mostrarErrorGlobal("Fallo de Conexión", "No se pudo conectar con el servidor. Verifica configuración de Apps Script. <br>Error: " + error.message);
   }
}

function inicializarApp(data) {
   dataOriginal = data;
   renderizarLista(dataOriginal);
}

function mostrarErrorGlobal(titulo, mensaje) {
   const lista = document.getElementById('candidatosList');
   lista.innerHTML = `
      <div style="padding:20px;text-align:center;color:#e74c3c;">
         <i class="ri-error-warning-fill" style="font-size:3rem;margin-bottom:10px;display:block;"></i>
         <h3>${titulo}</h3>
         <p style="font-size:0.9rem;margin-top:10px;">${mensaje}</p>
      </div>
   `;
}

function obtenerIniciales(nombre) {
  if (!nombre) return 'NA';
  const partes = nombre.toString().trim().split(/\s+/);
  if(partes.length === 0) return 'NA';
  if(partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
}

function renderizarLista(candidatos) {
   const lista = document.getElementById('candidatosList');
   lista.innerHTML = '';
   
   if (candidatos.length === 0) {
      lista.innerHTML = '<div style="padding:20px;text-align:center;color:var(--color-primary);"><i class="ri-user-unfollow-line" style="font-size:2rem;"></i><p>No se encontraron candidatos.</p></div>';
      return;
   }

   candidatos.forEach((c, index) => {
      const li = document.createElement('li');
      li.className = 'candidato-item fade-in';
      li.style.animationDelay = `${index * 0.05}s`;
      
      li.onclick = (e) => {
         if(e.target.type !== 'checkbox') {
             seleccionarCandidato(c, li);
         }
      };

      const chkContainer = document.createElement('div');
      chkContainer.className = 'chk-container';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'chk-candidato';
      cb.dataset.index = index;
      chkContainer.appendChild(cb);
      
      const avatar = document.createElement('div');
      avatar.className = 'avatar-list';
      avatar.textContent = obtenerIniciales(c.nombre);

      const info = document.createElement('div');
      info.className = 'candidato-info';
      const nombreEl = document.createElement('h3');
      nombreEl.textContent = c.nombre || 'Sin nombre';
      const docEl = document.createElement('p');
      docEl.innerHTML = c.documento ? `<i class="ri-id-card-line"></i> ${c.documento}` : 'Sin cédula';

      info.appendChild(nombreEl);
      info.appendChild(docEl);
      
      li.appendChild(chkContainer);
      li.appendChild(avatar);
      li.appendChild(info);

      lista.appendChild(li);
   });
}

function filtrarCandidatos(e) {
   const term = e.target.value.toLowerCase().trim();
   const filtrados = dataOriginal.filter(c => {
      const nom = (c.nombre || '').toString().toLowerCase();
      const doc = (c.documento || '').toString().toLowerCase();
      return nom.includes(term) || doc.includes(term);
   });
   renderizarLista(filtrados);
}

function seleccionarCandidato(candidato, elementoLi) {
   candidatoActual = candidato;
   
   document.querySelectorAll('.candidato-item').forEach(el => el.classList.remove('active'));
   if(elementoLi) elementoLi.classList.add('active');

   document.getElementById('emptyState').classList.add('hidden');
   document.getElementById('cvContent').classList.remove('hidden');

   renderizarHV(candidato);
}

function renderizarHV(c) {
   const container = document.getElementById('cvPrintableArea');

   let tituloPrincipal = '';
   if(c.pregrado && c.pregrado.length > 0 && c.pregrado[0].titulo) {
       tituloPrincipal = c.pregrado[0].titulo;
   } else if (c.experiencias && c.experiencias.length > 0 && c.experiencias[0].cargo) {
       tituloPrincipal = c.experiencias[0].cargo;
   }

   let allocEduItems = [];
   
   let educacionHTML = '';
   if(c.pregrado && c.pregrado.length > 0) {
      educacionHTML += `<h3 style="font-size:1rem; color:#4AB9F1; margin:0 0 10px 0; text-transform:uppercase;">PREGRADO</h3>`;
      c.pregrado.forEach((item) => {
         educacionHTML += `<div class="hv-edu-item page-avoid">
            <p><strong>${item.titulo || 'Sin Título'}</strong></p> 
            <p>${item.institucion || '-'} ${item.anio ? '| '+item.anio : ''}</p> 
         </div>`;
      });
   }
   
   if(c.posgrado && c.posgrado.length > 0) {
      educacionHTML += `<h3 style="font-size:1rem; color:#4AB9F1; margin:15px 0 10px 0; text-transform:uppercase;">POSGRADO</h3>`;
      c.posgrado.forEach((item) => {
         educacionHTML += `<div class="hv-edu-item page-avoid">
            <p><strong>${item.titulo || 'Sin Título'}</strong></p> 
            <p>${item.institucion || '-'} ${item.anio ? '| '+item.anio : ''}</p> 
         </div>`;
      });
   }

   if(c.certificaciones && c.certificaciones.length > 0) {
      educacionHTML += `<h3 style="font-size:1rem; color:#4AB9F1; margin:15px 0 10px 0; text-transform:uppercase;">CERTIFICACIONES</h3>`;
      c.certificaciones.forEach((item) => {
         educacionHTML += `<div class="hv-edu-item page-avoid">
            <p><strong>${item.titulo || 'Sin Nombre'}</strong></p> 
            <p>${item.institucion || '-'} ${item.anio ? '| '+item.anio : ''}</p> 
         </div>`;
      });
   }
   
   if(educacionHTML === '') educacionHTML = '<p style="font-size:0.85rem; opacity:0.7;">Sin formación registrada.</p>';

   let experienciaHTML = '';
   if(c.experiencias && c.experiencias.length > 0) {
      c.experiencias.forEach((exp) => {
         const tSplit = exp.tiempo.split(' ');
         const numTiempo = tSplit[0] || '-';
         const unitTiempo = tSplit.length > 1 ? tSplit.slice(1).join(' ') : '';

         let timeStatHTML = exp.tiempo && exp.tiempo !== '-' ? `
            <div class="hv-time-stat">
               <span class="hv-label">Tiempo laborado:</span> 
               <span class="hv-years-num">${numTiempo}</span> 
               <span class="hv-years-unit">${unitTiempo}</span> 
            </div>
         ` : '';

         experienciaHTML += `
         <div class="hv-experience-card page-avoid">
            <div class="hv-card-body">
               <h3>${exp.cargo || 'Cargo no especificado'}</h3> 
               <h4>${exp.empresa || '-'}</h4>
               <p class="hv-date-text">${exp.inicio || '-'} al ${exp.fin || 'Actualidad'}</p> 
               <div class="hv-tasks">
                  <strong>Funciones principales:</strong> 
                  <p>${exp.funciones || 'No especificadas'}</p> 
               </div>
            </div>
            ${timeStatHTML}
         </div>`;
      });
   } else {
      experienciaHTML = '<p style="font-size:0.85rem; opacity:0.7;">Sin experiencia laboral estructurada.</p>';
   }

   const html = `
    <div class="hv-container">
        <header class="hv-glass-header">
            <div class="hv-logo-glass">${obtenerIniciales(c.nombre)}</div>
            <div class="hv-header-text">
                <h1>${c.nombre || 'NOMBRE NO ESPECIFICADO'}</h1>
                ${tituloPrincipal ? `<div class="hv-badge-glass">${tituloPrincipal}</div>` : ''}
            </div>
        </header>

        <div class="hv-layout-grid">
            <aside class="hv-sidebar">
                <section class="hv-glass-card hv-personal-info page-avoid">
                    <h2>DATOS PERSONALES</h2> 
                    <ul>
                        <li><i>👤</i> ${c.documento || '-'}</li> 
                        <li><i>📍</i> ${c.ciudad || '-'}</li> 
                        <li><i>📞</i> ${c.celular || '-'}</li> 
                        <li><i>✉️</i> <span style="word-break:break-all;">${c.correo || '-'}</span></li>
                        ${c.tarjetaProf ? `<li><i>💳</i> ${c.tarjetaProf}</li>` : ''}
                        ${c.entidadTarjeta ? `<li><i>🏢</i> ${c.entidadTarjeta}</li>` : ''}
                    </ul>
                </section>

                <section class="hv-glass-card page-avoid">
                    <h2>FORMACIÓN PROFESIONAL</h2> 
                    ${educacionHTML}
                </section>
            </aside>

            <main class="hv-experience-flow">
                <h2>EXPERIENCIA LABORAL</h2> 
                ${experienciaHTML}
            </main>
        </div>
    </div>
   `;

   container.innerHTML = html;
}

// ------ PDF ------
// A4 a 96dpi = 794px ancho. Con el padding del área, usamos 760px de contenido.
// Capturamos el elemento clonado fuera del viewport para evitar scroll-clipping.
function generarPDF(elemento, filename) {
   return new Promise((resolve) => {
      // 1. Contenedor oculto con dimensiones A4 exactas e invisible (opacity:0) para no recortar en html2canvas
      const container = document.createElement('div');
      container.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 850px;
          height: auto;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
          z-index: -9999;
      `;

      const wrapper = document.createElement('div');
      wrapper.id = 'pdf-export-wrapper';
      wrapper.style.cssText = `
          width: 794px;
          min-height: 1120px;
          padding: 20px;
          box-sizing: border-box;
          background: linear-gradient(135deg, #001f3f 0%, #004a8d 100%); 
          color: #ffffff;
          position: relative;
          font-family: 'Poppins', 'Inter', sans-serif;
      `;

      // 2. Clonar y aplicar estilos de compactación (CSS inyectado en scope del wrapper)
      const clone = elemento.cloneNode(true);
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.width = '100%';
      clone.style.display = 'block';
      clone.style.background = 'transparent';
      
      const style = document.createElement('style');
      style.textContent = `
          #pdf-export-wrapper .hv-container { padding: 15px !important; width: 100% !important; max-width: none !important; border: none !important; box-shadow: none !important; background: transparent !important; }
          #pdf-export-wrapper .hv-glass-header { padding: 15px !important; margin-bottom: 20px !important; gap: 20px !important; backdrop-filter: none !important; background: rgba(255,255,255,0.05) !important; border-radius: 15px !important;}
          #pdf-export-wrapper .hv-header-text h1 { font-size: 30px !important; line-height: 1.1 !important; margin: 0 !important; }
          #pdf-export-wrapper .hv-badge-glass { padding: 4px 12px !important; font-size: 13px !important; }
          #pdf-export-wrapper .hv-logo-glass { width: 70px !important; height: 70px !important; min-width: 70px !important; font-size: 28px !important; backdrop-filter: none !important; margin-right: 0 !important; }
          #pdf-export-wrapper .hv-layout-grid { display: flex !important; gap: 20px !important; flex-direction: row !important; align-items: flex-start !important; }
          #pdf-export-wrapper .hv-sidebar { width: 230px !important; flex-shrink: 0 !important; backdrop-filter: none !important; background: rgba(255,255,255,0.03) !important; padding: 20px !important; border-radius: 12px !important; border: 1px solid rgba(255,255,255,0.1) !important;}
          #pdf-export-wrapper .hv-glass-card { padding: 0 !important; border: none !important; background: transparent !important; margin-bottom: 20px !important;}
          #pdf-export-wrapper .hv-glass-card h2, #pdf-export-wrapper .hv-experience-flow h2 { font-size: 16px !important; margin-bottom: 12px !important; }
          #pdf-export-wrapper .hv-glass-card li { font-size: 11px !important; margin-bottom: 6px !important; }
          #pdf-export-wrapper .hv-edu-item h3 { font-size: 12px !important; margin-bottom: 2px !important; }
          #pdf-export-wrapper .hv-edu-item p { font-size: 11px !important; margin: 0 !important; }
          #pdf-export-wrapper .hv-experience-flow { flex: 1 !important; }
          #pdf-export-wrapper .hv-experience-card { padding: 15px !important; margin-bottom: 15px !important; border-radius: 12px !important; backdrop-filter: none !important; background: rgba(255,255,255,0.05) !important; }
          #pdf-export-wrapper .hv-card-body h3 { font-size: 16px !important; margin-bottom: 2px !important; }
          #pdf-export-wrapper .hv-card-body h4 { font-size: 13px !important; margin-bottom: 6px !important; }
          #pdf-export-wrapper .hv-date-text { font-size: 11px !important; margin-bottom: 8px !important; }
          #pdf-export-wrapper .hv-tasks strong { font-size: 12px !important; margin-bottom: 2px !important;}
          #pdf-export-wrapper .hv-tasks p { font-size: 11px !important; line-height: 1.3 !important; }
          #pdf-export-wrapper .hv-time-stat { min-width: 90px !important; padding-left: 15px !important; margin-left: 10px !important; }
          #pdf-export-wrapper .hv-years-num { font-size: 26px !important; margin: 2px 0 !important;}
          #pdf-export-wrapper .hv-label { font-size: 9px !important; }
          #pdf-export-wrapper .hv-years-unit { font-size: 11px !important; letter-spacing: 1px !important;}
      `;
      clone.appendChild(style);

      // Desactivar filtros de cristal para evitar errores de renderizado (cintas transparentes)
      const elementsWithGlass = clone.querySelectorAll('.hv-container, .hv-glass-header, .hv-sidebar, .hv-experience-card, .hv-logo-glass');
      elementsWithGlass.forEach(el => {
          el.style.backdropFilter = 'none';
          el.style.webkitBackdropFilter = 'none';
      });

      wrapper.appendChild(clone);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      // 3. Generar el documento
      setTimeout(() => {
         const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
               scale: 2, // scale 2 para mayor nitidez
               useCORS: true,
               logging: false,
               backgroundColor: '#001f3f', // Solid dark backup mapping to wrapper dark
               width: 794,
               windowWidth: 794,
               x: 0,
               y: 0
            },
            pagebreak: { mode: 'css', avoid: '.page-avoid' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
         };

         html2pdf().set(opt).from(wrapper).save().then(() => {
            document.body.removeChild(container);
            resolve();
         }).catch(err => {
            console.error("Error en PDF:", err);
            document.body.removeChild(container);
            resolve();
         });
      }, 800);
   });
}

function descargarPDF() {
   if(!candidatoActual) return;
   const element = document.getElementById('cvPrintableArea');
   generarPDF(element, `Plantilla HV-${candidatoActual.nombre.replace(/\s+/g, '_')}.pdf`);
}

async function descargarSeleccionados() {
   const checks = document.querySelectorAll('.chk-candidato:checked');
   if(checks.length === 0) {
      alert("Selecciona al menos un candidato.");
      return;
   }
   
   const btn = document.getElementById('btnDescargarSeleccionados');
   const textOrig = btn.innerHTML;
   btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Generando...';
   btn.disabled = true;

   for(let check of checks) {
      const idx = check.dataset.index;
      const c = dataOriginal[idx];
      renderizarHV(c);
      await new Promise(r => setTimeout(r, 500));
      const element = document.getElementById('cvPrintableArea');
      await generarPDF(element, `Plantilla HV-${c.nombre.replace(/\s+/g, '_')}.pdf`);
   }
   
   btn.innerHTML = textOrig;
   btn.disabled = false;
   if(candidatoActual) renderizarHV(candidatoActual);
}

async function descargarTodo() {
   if(dataOriginal.length === 0) return;
   if(!confirm(`Procesarás el PDF de los ${dataOriginal.length} registros. Esta acción toma tiempo.`)) return;
   
   const btn = document.getElementById('btnDescargarTodo');
   const textOrig = btn.innerHTML;
   btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Procesando...';
   btn.disabled = true;

   for(let c of dataOriginal) {
      renderizarHV(c);
      await new Promise(r => setTimeout(r, 500));
      const element = document.getElementById('cvPrintableArea');
      await generarPDF(element, `Plantilla HV-${c.nombre.replace(/\s+/g, '_')}.pdf`);
   }
   
   btn.innerHTML = textOrig;
   btn.disabled = false;
   if(candidatoActual) renderizarHV(candidatoActual);
}
