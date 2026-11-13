/**
 * Módulo de Reservas - Anti-XSS
 * - Captura submit con e.preventDefault()
 * - Construye nodos DOM usando estrictamente .text()
 * - Ejecuta this.reset() al finalizar
 */
import { sanitizeString, formatDate, getTodayISO } from './utils.js';

let pedidoActual = null;
let aforoSeleccionado = "1 Persona (Individual)";
let timerInterval = null;

// Inicializa la fecha por defecto (hoy) y bloquea fechas pasadas
export function initDateField() {
  const today = getTodayISO();
  $('#input-fecha').val(today).prop('min', today);
}

// Calcula y renderiza el resumen en vivo (TODO con .text() anti-XSS)
export function actualizarDashboard() {
  // Sanitización del nombre del jugador
  const nombreRaw = $('#input-nombre').val() || 'Jugador Anónimo';
  const nombre = sanitizeString(nombreRaw);
  
  const fechaFormateada = formatDate($('#input-fecha').val());
  const planActive = $('.plan-card.active');
  const servicioNombre = planActive.data('name') || '';
  const precioHora = parseFloat(planActive.data('price')) || 0;
  const esTarifaFija = planActive.data('fixed') === true || planActive.data('fixed') === 'true';
  const horas = esTarifaFija ? 1 : (parseInt($('#input-horas').val()) || 1);

  const subtotalServicio = esTarifaFija ? precioHora : (precioHora * horas);

  let snacksTotal = 0;
  const snacksNombres = [];
  $('.snack-chk:checked').each(function() {
    snacksTotal += parseFloat($(this).val());
    snacksNombres.push($(this).data('name'));
  });

  const totalFinal = subtotalServicio + snacksTotal;
  $('#live-total').text(`$${totalFinal.toFixed(2)} USD / BOB`);

  pedidoActual = {
    nombre,
    fecha: fechaFormateada,
    servicio: servicioNombre,
    aforo: aforoSeleccionado,
    horas: esTarifaFija ? 'Pack Nocturno (8h)' : `${horas} Hora(s)`,
    snacks: snacksNombres,
    total: totalFinal.toFixed(2)
  };

  // ✅ Construcción del resumen con nodos DOM puros y .text()
  const resumen = $('#resumen-content').empty();

  const addItem = (label, value) => {
    const row = $('<div>').addClass('resumen-item');
    $('<span>').append($('<strong>').text(label)).appendTo(row);
    $('<span>').text(value).appendTo(row);
    resumen.append(row);
  };

  addItem('Jugador:', pedidoActual.nombre);
  addItem('Fecha:', pedidoActual.fecha);
  addItem('Plan:', pedidoActual.servicio);
  addItem('Aforo:', pedidoActual.aforo);
  addItem('Duración:', pedidoActual.horas);

  const combosRow = $('<div>').css({ marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' });
  combosRow.append($('<strong>').text('Combos: '));
  const snacksText = pedidoActual.snacks.length > 0 ? pedidoActual.snacks.join(', ') : 'Sin snacks';
  combosRow.append(document.createTextNode('• ' + snacksText));
  resumen.append(combosRow);
}

// Captura del envío del formulario (Anti-XSS + preventDefault)
export function initReservationForm() {
  $('#calc-form').on('submit', function(e) {
    e.preventDefault(); // ✅ Captura del envío
    abrirModalConfirmacion();
  });

  // Listeners de actualización en tiempo real
  $('#input-nombre, #input-fecha, #input-horas, .snack-chk').on('input change', actualizarDashboard);
}

// Selección de planes (delegado)
export function initPlanSelection() {
  $(document).on('click', '.plan-card', function() {
    $('.plan-card').removeClass('active');
    $(this).addClass('active');
    if ($(this).data('fixed') === true || $(this).data('fixed') === 'true') {
      $('#group-horas').slideUp(150);
    } else {
      $('#group-horas').slideDown(150);
    }
    actualizarDashboard();
  });
}

// Selección de aforo
export function initAforoSelection(renderPlanesFn, currentCapacityKeyRef) {
  $('.btn-aforo').on('click', function() {
    $('.btn-aforo').removeClass('active');
    $(this).addClass('active');
    aforoSeleccionado = $(this).data('capacity');
    currentCapacityKeyRef.value = $(this).data('capacity-key');
    renderPlanesFn();
    actualizarDashboard();
  });
}

// Modal de confirmación con countdown
function abrirModalConfirmacion() {
  if (!pedidoActual) return;

  // ✅ Construcción del detalle del modal con .text() estrictamente
  const detalle = $('#modal-detalle-texto').empty();
  
  const addLine = (label, value) => {
    detalle.append(document.createElement('strong')).append(document.createTextNode(label + ' '));
    detalle.append(document.createTextNode(value));
    detalle.append(document.createElement('br'));
  };

  addLine('Jugador:', pedidoActual.nombre);
  addLine('Fecha:', pedidoActual.fecha);
  addLine('Plan:', `${pedidoActual.servicio} (${pedidoActual.horas})`);
  addLine('Aforo:', pedidoActual.aforo);
  const snacksText = pedidoActual.snacks.length > 0 ? pedidoActual.snacks.join(', ') : 'Sin snacks';
  addLine('Combos:', '• ' + snacksText);

  $('<hr>').css({ borderColor: 'var(--border-color)', margin: '6px 0' }).appendTo(detalle);
  
  const totalLine = $('<div>');
  totalLine.append($('<strong>').text('Monto a Cancelar: '));
  $('<span>')
    .text(`$${pedidoActual.total} BOB / USD`)
    .css({ color: 'var(--accent-color)', fontWeight: 'bold' })
    .appendTo(totalLine);
  detalle.append(totalLine);

  $('#modal-confirmacion').css('display', 'flex').hide().fadeIn(250);
  iniciarContadorModal();
}

function iniciarContadorModal() {
  let segundosRestantes = 30;
  $('#countdown-timer').text(`00:${segundosRestantes < 10 ? '0' : ''}${segundosRestantes}s`);

  clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    segundosRestantes--;
    $('#countdown-timer').text(`00:${segundosRestantes < 10 ? '0' : ''}${segundosRestantes}s`);
    if (segundosRestantes <= 0) {
      clearInterval(timerInterval);
      $('#modal-confirmacion').fadeOut(300);
    }
  }, 1000);
}

function cerrarModal() {
  clearInterval(timerInterval);
  $('#modal-confirmacion').fadeOut(200);
}

export function initModal() {
  $('#btn-abrir-modal').on('click', function(e) {
    e.preventDefault();
    abrirModalConfirmacion();
  });

  $('#btn-cerrar-x, #btn-modal-cancelar').on('click', cerrarModal);

  // Procesar pago: cierra modal, muestra toast, y ejecuta this.reset()
  $('#btn-modal-procesar').on('click', function() {
    cerrarModal();

    $('#toast-text').text(`¡Reserva confirmada con éxito! Total: $${pedidoActual.total}`);
    $('#toast-alert').stop(true, true).slideDown(400, function() {
      setTimeout(() => $('#toast-alert').fadeOut(400), 3000);
    });

    // ✅ this.reset() sobre el formulario
    const form = $('#calc-form')[0];
    form.reset();

    // Restablecer fecha a hoy después del reset
    $('#input-fecha').val(getTodayISO());

    // Restablecer aforo
    $('.btn-aforo').removeClass('active').first().addClass('active');
    aforoSeleccionado = "1 Persona (Individual)";
    
    actualizarDashboard();
  });
}

export function getAforoSeleccionado() {
  return aforoSeleccionado;
}