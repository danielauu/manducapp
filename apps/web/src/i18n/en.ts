import type { MessageKey } from './es';

export const en: Record<MessageKey, string> = {
  'app.name': 'Manducapp',
  'lang.label': 'Gospel language',

  'home.title': 'Which Gospel to memorize?',
  'home.today': "Today's Gospel",
  'home.sunday': "Next Sunday's Gospel",
  'home.own': 'My own text',
  'home.ownHint': 'Paste any passage',
  'home.loading': 'Looking up the Gospel…',
  'home.footer':
    'Gospel texts belong to their rights holders. They are requested live and only stored on this device.',
  'home.diagnostics': 'Technical tests',

  'error.title': 'The Gospel could not be loaded',
  'error.network': 'Cannot reach the service. Check your internet connection and try again.',
  'error.rate-limited': 'The service is very busy. Try again in a minute.',
  'error.not-found': 'The source has no Gospel for that day.',
  'error.out-of-range': 'That date is outside what the source offers.',
  'error.bad-response': 'The source replied with something unexpected. Try again later.',
  'error.unknown': 'An unexpected error occurred.',

  'common.retry': 'Try again',
  'common.back': 'Back',

  'preview.title': 'Preview',
  'preview.sentences': 'Sentences: {count}',
  'preview.minutes': 'Estimated time: about {minutes} min (one person)',
  'preview.credit': 'Translation: {credit}',
  'preview.soon': 'The voice player arrives in the next step.',

  'own.title': 'My own text',
  'own.language': 'Text language',
  'own.hint':
    'Paste the passage, in paragraphs or all in one block. The app splits it into sentences that are easy to memorize.',
  'own.placeholder': 'Paste or type the text here',
  'own.continue': 'Continue',
  'own.tooShort': 'Write at least a few words to continue.',
};
