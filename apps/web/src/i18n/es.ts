/** Textos de la interfaz en español. Las claves de los demás idiomas se verifican contra este objeto. */
export const es = {
  'app.name': 'Manducapp',
  'lang.label': 'Idioma del evangelio',

  'home.title': '¿Qué evangelio manducar?',
  'home.today': 'Evangelio de hoy',
  'home.sunday': 'Evangelio del próximo domingo',
  'home.own': 'Mi propio texto',
  'home.ownHint': 'Pegar cualquier pasaje',
  'home.loading': 'Buscando el evangelio…',
  'home.footer':
    'Los textos del evangelio pertenecen a sus titulares. Se piden en tiempo real y solo se guardan en este dispositivo.',
  'home.diagnostics': 'Pruebas técnicas',

  'error.title': 'No se pudo cargar el evangelio',
  'error.network': 'No hay conexión con el servicio. Revisar la conexión a internet e intentar de nuevo.',
  'error.rate-limited': 'El servicio está muy ocupado. Intentar de nuevo en un minuto.',
  'error.not-found': 'La fuente no tiene evangelio para ese día.',
  'error.out-of-range': 'Esa fecha está fuera de lo que ofrece la fuente.',
  'error.bad-response': 'La fuente respondió algo inesperado. Intentar de nuevo más tarde.',
  'error.unknown': 'Ocurrió un error inesperado.',

  'common.retry': 'Reintentar',
  'common.back': 'Volver',

  'preview.title': 'Vista previa',
  'preview.sentences': 'Oraciones: {count}',
  'preview.credit': 'Traducción: {credit}',
  'preview.soon': 'El reproductor con voz llega en el siguiente paso.',
  'plan.budget': 'Tiempo disponible',
  'plan.budgetOption': '{minutes} min',
  'plan.strategy': 'Uniones',
  'strategy.pairs-and-blocks': 'Pares y bloques (recomendado)',
  'strategy.cumulative': 'Acumulativa (para textos cortos)',
  'strategy.minimal': 'Solo el recitado final',
  'plan.range': 'Memorizar hasta la oración {count} de {total}',
  'plan.estimate': 'Duración estimada: unos {minutes} min',
  'plan.fits': 'Cabe en el tiempo disponible',
  'plan.exceeds': 'Supera el tiempo disponible',
  'plan.fit': 'Ajustar al tiempo disponible',
  'plan.skipped': 'No se memoriza en esta sesión',

  'own.title': 'Mi propio texto',
  'own.language': 'Idioma del texto',
  'own.hint':
    'Pegar el pasaje, en párrafos o todo corrido. La app lo divide en oraciones fáciles de memorizar.',
  'own.placeholder': 'Pegar o escribir el texto aquí',
  'own.continue': 'Continuar',
  'own.tooShort': 'Escribir al menos unas palabras para continuar.',
} as const;

export type MessageKey = keyof typeof es;
