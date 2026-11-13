/**
 * Utilidades de seguridad y helpers reutilizables.
 * Tree-shakeable: solo se importa lo que se usa.
 */

// Sanitiza un string eliminando caracteres peligrosos (defensa en profundidad)
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>"'&]/g, (char) => {
    const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
    return map[char];
  });
}

// Formatea fecha ISO (YYYY-MM-DD) a formato legible (DD/MM/YYYY)
export function formatDate(isoDate) {
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

// Obtiene la fecha de hoy en formato ISO para inputs tipo date
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

// Mapeo de colores por plataforma (PWA theme-color)
export const themeColors = {
  ps5: '#0072ce',
  xbox: '#107c10',
  pc: '#ff0055'
};