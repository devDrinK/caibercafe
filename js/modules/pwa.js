/**
 * Módulo PWA: captura el evento beforeinstallprompt y muestra el botón.
 */
export function initPWA() {
  let deferredPrompt = null;
  const btnInstalar = $('#btn-instalar-pwa');

  // Diagnóstico del Service Worker
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
}