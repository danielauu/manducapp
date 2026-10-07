import type { Lang } from '@manducapp/core';

/** Etiqueta BCP 47 que se le pide a la voz cuando no se elige una concreta. */
export const LANG_TAGS: Record<Lang, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  it: 'it-IT',
  de: 'de-DE',
  pl: 'pl-PL',
};

export const LANG_NAMES: Record<Lang, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  pl: 'Polski',
};

/** Frases inventadas para probar la voz; no son texto bíblico. La larga dura cerca de 25 a 30 segundos. */
export const SAMPLES: Record<Lang, { short: string; long: string }> = {
  es: {
    short: 'Esta es una prueba de voz de Manducapp.',
    long: 'Esta es una frase de prueba más larga. Sirve para comprobar que la voz del dispositivo puede leer un texto continuo sin cortarse a la mitad. Si la lectura se detiene antes de terminar, o si el aviso de final no llega, lo anotaremos en el informe. Seguimos leyendo palabras sencillas hasta completar más o menos medio minuto de audio.',
  },
  en: {
    short: 'This is a Manducapp voice test.',
    long: 'This is a longer test sentence. It is used to check that the device voice can read a continuous text without stopping halfway. If the reading stops before it ends, or if the end notification never arrives, we will note it in the report. We keep reading simple words until we have about half a minute of audio.',
  },
  fr: {
    short: 'Ceci est un test de voix de Manducapp.',
    long: "Voici une phrase de test plus longue. Elle sert à vérifier que la voix de l'appareil peut lire un texte continu sans s'arrêter à la moitié. Si la lecture s'interrompt avant la fin, ou si la notification de fin n'arrive pas, nous le noterons dans le rapport. Nous continuons à lire des mots simples jusqu'à obtenir environ une demi-minute d'audio.",
  },
  it: {
    short: 'Questa è una prova della voce di Manducapp.',
    long: 'Questa è una frase di prova più lunga. Serve a verificare che la voce del dispositivo possa leggere un testo continuo senza fermarsi a metà. Se la lettura si interrompe prima della fine, o se la notifica di fine non arriva, lo annoteremo nel rapporto. Continuiamo a leggere parole semplici fino a ottenere circa mezzo minuto di audio.',
  },
  de: {
    short: 'Das ist ein Stimmtest von Manducapp.',
    long: 'Dies ist ein längerer Testsatz. Er dient dazu, zu prüfen, ob die Stimme des Geräts einen fortlaufenden Text lesen kann, ohne in der Mitte aufzuhören. Wenn das Vorlesen vor dem Ende stoppt oder die Meldung über das Ende nicht ankommt, notieren wir das im Bericht. Wir lesen einfache Wörter weiter, bis etwa eine halbe Minute Audio erreicht ist.',
  },
  pl: {
    short: 'To jest próba głosu aplikacji Manducapp.',
    long: 'To jest dłuższe zdanie testowe. Służy do sprawdzenia, czy głos urządzenia potrafi przeczytać ciągły tekst bez zatrzymywania się w połowie. Jeśli czytanie zatrzyma się przed końcem albo powiadomienie o zakończeniu nie nadejdzie, zapiszemy to w raporcie. Czytamy proste słowa dalej, aż uzbieramy około pół minuty dźwięku.',
  },
};
