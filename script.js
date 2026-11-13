$(document).ready(function() {
  'use strict';

  // ============================================================
  // UTILIDADES DE SEGURIDAD (Anti-XSS)
  // ============================================================
  function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  function formatDate(isoDate) {
    if (!isoDate) return 'No seleccionada';
    try {
      return new Date(isoDate + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  function getTodayISO() {
    return new Date().toISOString().split('T')[0];
  }

  const themeColors = {
    ps5: '#0072ce',
    xbox: '#107c10',
    pc: '#ff0055'
  };

  // ============================================================
  // VARIABLES DE ESTADO
  // ============================================================
  let appData = null;
  let currentPlatform = 'ps5';
  let currentCapacityKey = 'individual';
  let aforoSeleccionado = "1 Persona (Individual)";
  let pedidoActual = null;
  let timerInterval = null;
  let scrollPosition = 0;
  const cardWidth = 215;

  // ============================================================
  // DATOS DE RESPALDO (Garantiza funcionamiento local file:// y offline)
  // ============================================================
  const DEFAULT_DATA = {
    platformData: {
      ps5: {
        title: "Zona PlayStation 5",
        description: "Experimenta la máxima inmersión con audio 3D, retroalimentación háptica DualSense y pantallas 4K HDR de 55 pulgadas.",
        image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
        defaultPlanIndex: 0,
        cards: [
          { name: "Spider-Man 2", console: "PS5", img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=500&q=80", desc: "Aventura de mundo abierto a alta velocidad." },
          { name: "God of War Ragnarök", console: "PS5", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=80", desc: "Acción mitológica en 4K." },
          { name: "Gran Turismo 7", console: "PS5", img: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=500&q=80", desc: "Simulador con gatillos adaptativos." },
          { name: "The Last of Us II", console: "PS5", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80", desc: "Supervivencia dramática en 60 FPS." },
          { name: "Demon's Souls", console: "PS5", img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=500&q=80", desc: "Fantasía oscura en alta resolución." },
          { name: "FC 24 (FIFA)", console: "PS5", img: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=500&q=80", desc: "Fútbol competitivo en coop local." },
          { name: "Horizon Forbidden West", console: "PS5", img: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=500&q=80", desc: "Mundo abierto postapocalíptico fascinante." },
          { name: "Tekken 8", console: "PS5", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80", desc: "Peleas de nueva generación en versus local." },
          { name: "Mortal Kombat 1", console: "PS5", img: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=500&q=80", desc: "Combates sangrientos y modo cooperativo." }
        ]
      },
      xbox: {
        title: "Zona Xbox Series X",
        description: "Potencia pura de 12 Teraflops con Game Pass Ultimate y respuesta rápida a 120 FPS.",
        image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=800&q=80",
        defaultPlanIndex: 0,
        cards: [
          { name: "Halo Infinite", console: "XBOX", img: "https://images.unsplash.com/photo-1612287233202-b51b36619dfc?auto=format&fit=crop&w=500&q=80", desc: "Multijugador y campaña legendaria." },
          { name: "Forza Horizon 5", console: "XBOX", img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=80", desc: "Mundo abierto automovilístico." },
          { name: "Starfield", console: "XBOX", img: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=500&q=80", desc: "RPG de exploración espacial." },
          { name: "Gears 5", console: "XBOX", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80", desc: "Acción táctica en tercera persona." },
          { name: "Forza Motorsport", console: "XBOX", img: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=500&q=80", desc: "Simulación de carreras." },
          { name: "Sea of Thieves", console: "XBOX", img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=80", desc: "Aventura pirata en multijugador." },
          { name: "Hi-Fi RUSH", console: "XBOX", img: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=500&q=80", desc: "Acción rítmica frenética a 120 FPS." },
          { name: "Minecraft Dungeons", console: "XBOX", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80", desc: "Mazmorras y cooperativo para 4 jugadores." },
          { name: "Resident Evil 4", console: "XBOX", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=80", desc: "Terror y supervivencia renovado en 4K." }
        ]
      },
      pc: {
        title: "Zona PC Gamer Ultra",
        description: "Equipos competitivos eSports con RTX 4080, procesadores i9 y monitores de 240Hz.",
        image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80",
        defaultPlanIndex: 1,
        cards: [
          { name: "Valorant", console: "PC", img: "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=500&q=80", desc: "Shooter táctico a 240 FPS." },
          { name: "Counter-Strike 2", console: "PC", img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=500&q=80", desc: "Competitivo de latencia ultra baja." },
          { name: "League of Legends", console: "PC", img: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=500&q=80", desc: "MOBA con rendimiento fluido." },
          { name: "Cyberpunk 2077", console: "PC", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=80", desc: "Ray Tracing y Path Tracing activo." },
          { name: "Apex Legends", console: "PC", img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=500&q=80", desc: "Battle Royale de ritmo acelerado." },
          { name: "Dota 2", console: "PC", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80", desc: "Estrategia profunda para LAN." },
          { name: "Overwatch 2", console: "PC", img: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=500&q=80", desc: "Hero shooter por equipos a alta tasa de refresco." },
          { name: "Fortnite", console: "PC", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80", desc: "Battle Royale con Unreal Engine 5." },
          { name: "Call of Duty: Warzone", console: "PC", img: "https://images.unsplash.com/photo-1612287233202-b51b36619dfc?auto=format&fit=crop&w=500&q=80", desc: "Acción multijugador táctica militar." }
        ]
      }
    },
    plansByCapacity: {
      individual: {
        ps5: [
          { name: "PS5 Standard Individual", label: "PS5 Standard", price: 3.50, fixed: false },
          { name: "PS5 VIP 4K OLED Individual", label: "PS5 VIP 4K", price: 4.50, fixed: false },
          { name: "PS5 Pack Nocturno Individual", label: "Pack Nocturno", price: 15.00, fixed: true },
          { name: "PS5 Pase 4 Horas Individual", label: "Pase 4 Horas", price: 12.00, fixed: true }
        ],
        xbox: [
          { name: "Xbox Series X Standard", label: "Xbox Standard", price: 3.50, fixed: false },
          { name: "Xbox Game Pass Ultimate", label: "Xbox Ultimate", price: 4.50, fixed: false },
          { name: "Xbox Pack Nocturno Individual", label: "Pack Nocturno", price: 15.00, fixed: true },
          { name: "Xbox Pase 4 Horas Individual", label: "Pase 4 Horas", price: 12.00, fixed: true }
        ],
        pc: [
          { name: "PC Gamer Pro (RTX 4070)", label: "PC Pro RTX 4070", price: 4.00, fixed: false },
          { name: "PC Gamer Ultra (RTX 4080)", label: "PC Ultra RTX 4080", price: 5.50, fixed: false },
          { name: "PC Pack Nocturno Individual", label: "Pack Nocturno PC", price: 18.00, fixed: true },
          { name: "PC Pase 5 Horas eSports", label: "Pase 5H eSports", price: 18.50, fixed: true }
        ]
      },
      duo: {
        ps5: [
          { name: "PS5 Dúo Co-op (2 Mandos)", label: "Dúo 2 Mandos", price: 5.50, fixed: false },
          { name: "PS5 Dúo Pantallas Dobles", label: "Dúo Pantalla Doble", price: 6.50, fixed: false },
          { name: "PS5 Pack Nocturno Dúo", label: "Nocturno Dúo", price: 24.00, fixed: true },
          { name: "PS5 Dúo Torneo 3 Horas", label: "Pase Dúo 3 Horas", price: 15.00, fixed: true }
        ],
        xbox: [
          { name: "Xbox Dúo Co-op (2 Mandos)", label: "Xbox Dúo Co-op", price: 5.50, fixed: false },
          { name: "Xbox Dúo Pantallas Dobles", label: "Xbox Doble Pantalla", price: 6.50, fixed: false },
          { name: "Xbox Pack Nocturno Dúo", label: "Nocturno Dúo", price: 24.00, fixed: true },
          { name: "Xbox Dúo Batalla 3 Horas", label: "Pase Dúo 3 Horas", price: 15.00, fixed: true }
        ],
        pc: [
          { name: "PC Dúo Competitivo (2 Equipos)", label: "PC Dúo 2 Equipos", price: 7.50, fixed: false },
          { name: "PC Dúo Ultra RTX 4080", label: "PC Dúo RTX 4080", price: 9.50, fixed: false },
          { name: "PC Dúo Pack Nocturno", label: "Nocturno PC Dúo", price: 28.00, fixed: true },
          { name: "PC Dúo Maratón Rankeds (4h)", label: "Dúo 4H Rankeds", price: 26.00, fixed: true }
        ]
      },
      escuadron: {
        ps5: [
          { name: "PS5 Cuarteto Co-op (4 Mandos)", label: "Cuarteto (4 Mandos)", price: 8.50, fixed: false },
          { name: "PS5 Mini-Sala Privada VIP", label: "Sala VIP Completa", price: 12.00, fixed: false },
          { name: "PS5 Pack Nocturno Escuadrón", label: "Nocturno Escuadrón", price: 38.00, fixed: true },
          { name: "PS5 Torneo Comunitario (4h)", label: "Pase Torneo 4 Horas", price: 30.00, fixed: true }
        ],
        xbox: [
          { name: "Xbox Escuadrón 4 Jugadores", label: "Xbox Squad (4 Mandos)", price: 8.50, fixed: false },
          { name: "Xbox Cabina Fiesta Privada", label: "Cabina Privada", price: 11.50, fixed: false },
          { name: "Xbox Pack Nocturno Escuadrón", label: "Nocturno Escuadrón", price: 38.00, fixed: true },
          { name: "Xbox Torneo LAN 4 Horas", label: "Torneo Squad 4H", price: 30.00, fixed: true }
        ],
        pc: [
          { name: "PC Cabina LAN Completa (4-6 PCs)", label: "Cabina LAN (4-6 PCs)", price: 14.00, fixed: false },
          { name: "PC Escuadrón eSports Pro", label: "Escuadrón eSports", price: 18.00, fixed: false },
          { name: "PC Pack Nocturno LAN Party", label: "Nocturno LAN Party", price: 55.00, fixed: true },
          { name: "PC Pase Maratón LAN (6h)", label: "Maratón LAN (6h)", price: 65.00, fixed: true }
        ]
      }
    }
  };

  // Inicializa la interfaz con los datos cargados
  function initAppWithData(data) {
    appData = data;
    initDateField();
    renderCarousel(currentPlatform);
    renderPlanes();
    actualizarDashboard();
  }

  // ============================================================
  // CARGA DE DATOS (AJAX con fallback automático)
  // ============================================================
  $.ajax({
    url: 'data.json',
    method: 'GET',
    dataType: 'json',
    cache: false,
    success: function(data) {
      initAppWithData(data);
    },
    error: function(xhr, status, error) {
      console.warn('No se pudo cargar data.json por AJAX (típico al abrir directamente vía file:// por políticas CORS). Usando datos de respaldo integrados.');
      initAppWithData(DEFAULT_DATA);
    }
  });

  // ============================================================
  // RENDERIZADO DE UI (Anti-XSS: todo con .text())
  // ============================================================
  function renderPlanes() {
    if (!appData) return;
    const plans = appData.plansByCapacity[currentCapacityKey][currentPlatform];
    const container = $('#plan-cards-container').empty();

    plans.forEach((plan, index) => {
      const priceText = plan.fixed ? `$${plan.price.toFixed(2)}` : `$${plan.price.toFixed(2)}/h`;
      const activeClass = index === 0 ? 'active' : '';
      
      // ✅ Construcción segura con .text()
      const card = $('<div>')
        .addClass(`plan-card ${activeClass}`)
        .attr({
          'data-price': plan.price,
          'data-name': plan.name,
          'data-fixed': plan.fixed
        });

      const head = $('<div>').addClass('plan-head');
      $('<span>').text(plan.label).appendTo(head);
      $('<strong>').text(priceText).appendTo(head);
      
      card.append(head);
      container.append(card);
    });

    if (plans[0].fixed) {
      $('#group-horas').slideUp(150);
    } else {
      $('#group-horas').slideDown(150);
    }
  }

  function renderCarousel(platformKey) {
    if (!appData) return;
    const track = $('#games-carousel').empty();

    appData.platformData[platformKey].cards.forEach(card => {
      const item = $('<div>').addClass('carousel-card');

      $('<img>')
        .attr({
          src: card.img,
          alt: card.name,
          loading: 'lazy',
          decoding: 'async'
        })
        .appendTo(item);

      const body = $('<div>').addClass('carousel-body');
      $('<h4>').text(card.name).appendTo(body);
      $('<p>').text(card.desc).appendTo(body);

      const badge = $('<span>').addClass('game-badge');
      $('<i>').addClass('fa-solid fa-check').appendTo(badge);
      badge.append(' Incluido en ');
      $('<strong>').text(card.console).appendTo(badge);

      body.append(badge);
      item.append(body);
      track.append(item);
    });
  }

  // ============================================================
  // NAVEGACIÓN Y TEMAS
  // ============================================================
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

  $('.btn-theme').on('click', function() {
    if (!appData) return;
    const platformKey = $(this).attr('data-platform');
    const selectedTheme = $(this).attr('data-theme');
    currentPlatform = platformKey;
    const data = appData.platformData[platformKey];

    $('.btn-theme').removeClass('active');
    $(this).addClass('active');

    const themeMap = { ps5: 'theme-ps5', xbox: 'theme-xbox', pc: 'theme-pc' };
    $('body').removeClass('theme-ps5 theme-xbox theme-pc').addClass(themeMap[platformKey]);
    $('meta[name="theme-color"]').attr('content', themeColors[platformKey]);

    // ✅ .text() anti-XSS
    $('#hero-title').text(data.title);
    $('#hero-description').text(data.description);
    $('#featured-img').attr('src', data.image);

    renderPlanes();
    scrollPosition = 0;
    $('.carousel-track').css('transform', 'translateX(0px)');
    renderCarousel(platformKey);
    actualizarDashboard();
  });

  // ============================================================
  // MÓDULO DE RESERVAS (Anti-XSS completo)
  // ============================================================
  function initDateField() {
    const today = getTodayISO();
    $('#input-fecha').val(today).prop('min', today);
  }

  function actualizarDashboard() {
    // ✅ Sanitización del nombre
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

    // ✅ Construcción del resumen con .text() estrictamente
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

    const combosRow = $('<div>').css({
      marginTop: '4px',
      borderTop: '1px dashed var(--border-color)',
      paddingTop: '4px'
    });
    combosRow.append($('<strong>').text('Combos: '));
    const snacksText = pedidoActual.snacks.length > 0 ? pedidoActual.snacks.join(', ') : 'Sin snacks';
    combosRow.append(document.createTextNode('• ' + snacksText));
    resumen.append(combosRow);
  }

  // ✅ Captura del envío del formulario con preventDefault
  $('#calc-form').on('submit', function(e) {
    e.preventDefault();
    abrirModalConfirmacion();
  });

  $('#input-nombre, #input-fecha, #input-horas, .snack-chk').on('input change', actualizarDashboard);

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

  $('.btn-aforo').on('click', function() {
    $('.btn-aforo').removeClass('active');
    $(this).addClass('active');
    aforoSeleccionado = $(this).data('capacity');
    currentCapacityKey = $(this).data('capacity-key');
    renderPlanes();
    actualizarDashboard();
  });

  function abrirModalConfirmacion() {
    if (!pedidoActual) return;

    // ✅ Construcción del modal con .text() estrictamente
    const detalle = $('#modal-detalle-texto').empty();
    
    const addLine = (label, value) => {
      detalle.append(document.createElement('strong'));
      detalle.append(document.createTextNode(label + ' '));
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

  $('#btn-abrir-modal').on('click', function(e) {
    e.preventDefault();
    abrirModalConfirmacion();
  });

  $('#btn-cerrar-x, #btn-modal-cancelar').on('click', cerrarModal);

  // ✅ Procesar pago: cierra modal, muestra toast, ejecuta form.reset()
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
    currentCapacityKey = "individual";
    renderPlanes();
    actualizarDashboard();
  });

  // ============================================================
  // PWA: INSTALACIÓN
  // ============================================================
  let deferredPrompt = null;
  const btnInstalar = $('#btn-instalar-pwa');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length === 0) {
        console.warn('⚠️ Service Worker NO registrado.');
      } else {
        console.log('✅ Service Worker activo:', registrations[0].scope);
      }
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstalar.fadeIn(300);
  });

  btnInstalar.on('click', async function() {
    if (!deferredPrompt) {
      alert('La app ya está instalada o el navegador no soporta instalación.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') btnInstalar.fadeOut(300);
    deferredPrompt = null;
  });

  window.addEventListener('appinstalled', () => {
    btnInstalar.fadeOut(300);
    deferredPrompt = null;
  });

  if (window.matchMedia('(display-mode: standalone)').matches) {
    btnInstalar.hide();
  }
});