/**
 * Módulo de carga de datos vía AJAX.
 * Retorna una promesa con los datos parseados.
 */
export function loadAppData() {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'data.json',
      method: 'GET',
      dataType: 'json',
      success: (data) => resolve(data),
      error: (xhr, status, error) => {
        console.error('Error cargando data.json:', error);
        reject(error);
      }
    });
  });
}