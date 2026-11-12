$(document).ready(function() {
  let appData = null;
  let currentPlatform = 'ps5';
  let currentCapacityKey = 'individual';
  let pedidoActual = null;
  let timerInterval = null;

  const themeColors = {
    'ps5': '#0072ce',
    'xbox': '#107c10',
    'pc': '#ff0055'
  };

    // PWA: CAPTURAR EVENTO DE INSTALACIÓN
  let deferredPrompt;
  const btnInstalar = $('#btn-instalar-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstalar.fadeIn(300);
  });

  btnInstalar.on('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA instalada');
      btnInstalar.fadeOut(300);
    } else {
      console.log('Usuario canceló instalación');
    }
    
    deferredPrompt = null;
  });

  // Ocultar botón si ya está instalada
  window.addEventListener('appinstalled', () => {
    btnInstalar.fadeOut(300);
    deferredPrompt = null;
  });

  // 1. CARGA DE DATOS CON AJAX
  $.ajax({
    url: 'data.json',
    method: 'GET',
    dataType: 'json',
    success: function(data) {
      appData = data;
      
      // Establecer fecha de hoy por defecto
      const today = new Date().toISOString().split('T')[0];
      $('#input-fecha').val(today).prop('min', today);

      // Inicializar la UI con los datos cargados
      renderCarousel(currentPlatform);
      renderPlanes();
      actualizarDashboard();
    },
    error: function(xhr, status, error) {
      console.error("Error cargando data.json:", error);
      $('#resumen-content').html('<p style="color:red;">Error cargando datos. Verifica que data.json exista.</p>');
    }
  });

  // 2. RENDERIZAR PLANES
  function renderPlanes() {
    if (!appData) return;
    const plans = appData.plansByCapacity[currentCapacityKey][currentPlatform];
    const container = $('#plan-cards-container');
    container.empty();

    plans.forEach((plan, index) => {
      const priceText = plan.fixed ? `$${plan.price.toFixed(2)}` : `$${plan.price.toFixed(2)}/h`;
      const activeClass = index === 0 ? 'active' : '';
      const planHtml = `
        <div class="plan-card ${activeClass}" data-price="${plan.price}" data-name="${plan.name}" data-fixed="${plan.fixed}">
          <div class="plan-head">
            <span>${plan.label}</span>
            <strong>${priceText}</strong>
          </div>
        </div>
      `;
      container.append(planHtml);
    });

    if (plans[0].fixed) {
      $('#group-horas').slideUp(150);
    } else {
      $('#group-horas').slideDown(150);
    }
  }

  // 3. RENDERIZAR CARRUSEL
  function renderCarousel(platformKey) {
    if (!appData) return;
    const track = $('#games-carousel');
    track.empty();
    
    appData.platformData[platformKey].cards.forEach(card => {
      const itemHtml = `
        <div class="carousel-card">
          <img src="${card.img}" alt="${card.name}" loading="lazy" decoding="async">
          <div class="carousel-body">
            <h4>${card.name}</h4>
            <p>${card.desc}</p>
            <span class="game-badge"><i class="fa-solid fa-check"></i> Incluido en ${card.console}</span>
          </div>
        </div>
      `;
      track.append(itemHtml);
    });
  }

  // 4. LÓGICA DEL CARRUSEL
  let scrollPosition = 0;
  const cardWidth = 215; 

  $('.next-btn').on('click', function() {
    if (!appData) return;
    const maxScroll = (appData.platformData[currentPlatform].cards.length - 2) * cardWidth;
    if (scrollPosition < maxScroll) {
      scrollPosition += cardWidth;
      $('.carousel-track').css('transform', `translateX(-${scrollPosition}px)`);
    }
  });

  $('.prev-btn').on('click', function() {
    if (scrollPosition > 0) {
      scrollPosition -= cardWidth;
      $('.carousel-track').css('transform', `translateX(-${scrollPosition}px)`);
    }
  });

  // 5. NAVEGACIÓN POR PESTAÑAS
  $('.nav-tab, .btn-goto').on('click', function(e) {
    e.preventDefault();
    const targetView = $(this).attr('data-target');
    $('.nav-links a').removeClass('active');
    $(`.nav-links a[data-target="${targetView}"]`).addClass('active');
    $('.app-view').removeClass('active');
    $(`#${targetView}`).addClass('active');
    $('#nav-links').removeClass('show');
  });

  $('#nav-toggle').on('click', function(e) {
    e.stopPropagation();
    $('#nav-links').toggleClass('show');
  });

  $(document).on('click', function(e) {
    if (!$(e.target).closest('.navbar').length) {
      $('#nav-links').removeClass('show');
    }
  });

  // 6. CAMBIO DE TEMA / PLATAFORMA
  $('.btn-theme').on('click', function() {
    const selectedTheme = $(this).attr('data-theme');
    const platformKey = $(this).attr('data-platform');
    currentPlatform = platformKey;
    const data = appData.platformData[platformKey];

    $('.btn-theme').removeClass('active');
    $(this).addClass('active');
    $('body').removeClass('theme-ps5 theme-xbox theme-pc').addClass(selectedTheme);
    $('meta[name="theme-color"]').attr('content', themeColors[platformKey]);

    $('#hero-title').text(data.title);
    $('#hero-description').text(data.description);
    $('#featured-img').attr('src', data.image);

    renderPlanes();
    scrollPosition = 0;
    $('.carousel-track').css('transform', `translateX(0px)`);
    renderCarousel(platformKey);
    actualizarDashboard();
  });

  // 7. SELECCIÓN DE PLANES Y AFORO
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

  let aforoSeleccionado = "1 Persona (Individual)";
  $('.btn-aforo').on('click', function() {
    $('.btn-aforo').removeClass('active');
    $(this).addClass('active');
    aforoSeleccionado = $(this).data('capacity');
    currentCapacityKey = $(this).data('capacity-key');
    renderPlanes();
    actualizarDashboard();
  });

  // 8. CÁLCULO EN TIEMPO REAL (INCLUYE FECHA)
  function actualizarDashboard() {
    if (!appData) return;
    
    const nombre = $('#input-nombre').val() || 'Jugador Anónimo';
    const fechaRaw = $('#input-fecha').val();
    // Formatear fecha a formato legible (ej: 12/11/2026)
    const fechaFormateada = fechaRaw ? new Date(fechaRaw + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No seleccionada';
    
    const planActive = $('.plan-card.active');
    const servicioNombre = planActive.data('name');
    const precioHora = parseFloat(planActive.data('price'));
    const esTarifaFija = planActive.data('fixed') === true;
    const horas = esTarifaFija ? 1 : (parseInt($('#input-horas').val()) || 1);

    let subtotalServicio = esTarifaFija ? precioHora : (precioHora * horas);

    let snacksTotal = 0;
    let snacksNombres = [];
    $('.snack-chk:checked').each(function() {
      snacksTotal += parseFloat($(this).val());
      snacksNombres.push($(this).data('name'));
    });

    const totalFinal = subtotalServicio + snacksTotal;
    $('#live-total').text(`$${totalFinal.toFixed(2)} USD / BOB`);

    let snacksHtml = snacksNombres.length > 0 ? snacksNombres.join('<br>• ') : 'Sin snacks';

    pedidoActual = {
      nombre: nombre,
      fecha: fechaFormateada,
      servicio: servicioNombre,
      aforo: aforoSeleccionado,
      horas: esTarifaFija ? 'Pack Nocturno (8h)' : `${horas} Hora(s)`,
      snacks: snacksHtml,
      total: totalFinal.toFixed(2)
    };

    const resumenHtml = `
      <div class="resumen-item"><span><strong>Jugador:</strong></span> <span>${pedidoActual.nombre}</span></div>
      <div class="resumen-item"><span><strong>Fecha:</strong></span> <span>${pedidoActual.fecha}</span></div>
      <div class="resumen-item"><span><strong>Plan:</strong></span> <span>${pedidoActual.servicio}</span></div>
      <div class="resumen-item"><span><strong>Aforo:</strong></span> <span>${pedidoActual.aforo}</span></div>
      <div class="resumen-item"><span><strong>Duración:</strong></span> <span>${pedidoActual.horas}</span></div>
      <div style="margin-top: 4px; border-top: 1px dashed var(--border-color); padding-top: 4px;">
        <strong>Combos:</strong> • ${pedidoActual.snacks}
      </div>
    `;

    $('#resumen-content').html(resumenHtml);
  }

  $('#input-nombre, #input-fecha, #input-horas, .snack-chk').on('input change', function() {
    actualizarDashboard();
  });

  // 9. MODAL UI Y CRONÓMETRO
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

  $('#btn-abrir-modal').on('click', function() {
    if (!pedidoActual) return;
    const modalDetalle = `
      <strong>Jugador:</strong> ${pedidoActual.nombre}<br>
      <strong>Fecha:</strong> ${pedidoActual.fecha}<br>
      <strong>Plan:</strong> ${pedidoActual.servicio} (${pedidoActual.horas})<br>
      <strong>Aforo:</strong> ${pedidoActual.aforo}<br>
      <strong>Combos:</strong> • ${pedidoActual.snacks}<br>
      <hr style="border-color: var(--border-color); margin: 6px 0;">
      <strong>Monto a Cancelar:</strong> <span style="color: var(--accent-color); font-weight: bold;">$${pedidoActual.total} BOB / USD</span>
    `;
    $('#modal-detalle-texto').html(modalDetalle);
    $('#modal-confirmacion').css('display', 'flex').hide().fadeIn(250);
    iniciarContadorModal();
  });

  function cerrarModalFunc() {
    clearInterval(timerInterval);
    $('#modal-confirmacion').fadeOut(200);
  }

  $('#btn-cerrar-x, #btn-modal-cancelar').on('click', cerrarModalFunc);

  $('#btn-modal-procesar').on('click', function() {
    cerrarModalFunc();
    $('#toast-text').text(`¡Reserva confirmada con éxito! Total: $${pedidoActual.total}`);
    $('#toast-alert').stop(true, true).slideDown(400, function() {
      setTimeout(function() {
        $('#toast-alert').fadeOut(400);
      }, 3000);
    });

    $('#calc-form')[0].reset();
    // Restablecer fecha a hoy
    const today = new Date().toISOString().split('T')[0];
    $('#input-fecha').val(today);
    
    $('.btn-aforo').removeClass('active').first().addClass('active');
    aforoSeleccionado = "1 Persona (Individual)";
    currentCapacityKey = "individual";
    renderPlanes();
    actualizarDashboard();
  });

});