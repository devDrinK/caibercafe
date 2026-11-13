/**
 * Renderizado de UI: carrusel de juegos, tarjetas de planes, cambio de tema.
 * Usa .text() estrictamente para prevenir XSS.
 */
import { themeColors } from './utils.js';

let scrollPosition = 0;
const cardWidth = 215;

// Renderiza las tarjetas de planes según capacidad y plataforma
export function renderPlanes(appData, currentCapacityKey, currentPlatform) {
  const plans = appData.plansByCapacity[currentCapacityKey][currentPlatform];
  const container = $('#plan-cards-container');
  container.empty();

  plans.forEach((plan, index) => {
    const priceText = plan.fixed ? `$${plan.price.toFixed(2)}` : `$${plan.price.toFixed(2)}/h`;
    const activeClass = index === 0 ? 'active' : '';
    
    // Construcción segura: data-attributes con valores numéricos/booleanos controlados
    const card = $('<div>')
      .addClass(`plan-card ${activeClass}`)
      .attr('data-price', plan.price)
      .attr('data-name', plan.name)
      .attr('data-fixed', plan.fixed);

    const head = $('<div>').addClass('plan-head');
    $('<span>').text(plan.label).appendTo(head);      // ✅ .text() anti-XSS
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

// Renderiza el carrusel de juegos con lazy loading
export function renderCarousel(appData, platformKey) {
  const track = $('#games-carousel');
  track.empty();

  appData.platformData[platformKey].cards.forEach(card => {
    const item = $('<div>').addClass('carousel-card');

    // Imagen con lazy loading nativo
    $('<img>')
      .attr('src', card.img)
      .attr('alt', card.name)
      .attr('loading', 'lazy')
      .attr('decoding', 'async')
      .appendTo(item);

    const body = $('<div>').addClass('carousel-body');
    $('<h4>').text(card.name).appendTo(body);         // ✅ .text() anti-XSS
    $('<p>').text(card.desc).appendTo(body);          // ✅ .text() anti-XSS

    const badge = $('<span>').addClass('game-badge');
    $('<i>').addClass('fa-solid fa-check').appendTo(badge);
    badge.append(` Incluido en `);
    $('<strong>').text(card.console).appendTo(badge); // ✅ .text() anti-XSS

    body.append(badge);
    item.append(body);
    track.append(item);
  });
}

// Lógica de navegación del carrusel
export function initCarouselNav(appData, currentPlatform) {
  $('.next-btn').on('click', function() {
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
}

export function resetCarousel() {
  scrollPosition = 0;
  $('.carousel-track').css('transform', 'translateX(0px)');
}

// Cambio de tema/plataforma
export function applyTheme(platformKey, data) {
  const themeMap = { ps5: 'theme-ps5', xbox: 'theme-xbox', pc: 'theme-pc' };
  $('body').removeClass('theme-ps5 theme-xbox theme-pc').addClass(themeMap[platformKey]);
  $('meta[name="theme-color"]').attr('content', themeColors[platformKey]);

  // ✅ .text() en lugar de .html() para prevenir XSS
  $('#hero-title').text(data.title);
  $('#hero-description').text(data.description);
  $('#featured-img').attr('src', data.image);
}