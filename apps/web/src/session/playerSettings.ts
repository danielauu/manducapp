import { isLang } from '@manducapp/core';
import { useCallback, useMemo, useState } from 'react';
import { browserStorage } from '../services/storage';

const KEY = 'manducapp:player';

export const RATE_OPTIONS = [0.8, 1, 1.2] as const;

export interface PlayerSettings {
  /** Pasa solo al siguiente paso cuando se acaba el tiempo del turno. */
  autoAdvance: boolean;
  /** La voz lee cada repetición y no solo la primera de cada oración. */
  voiceEveryRepetition: boolean;
  /** En el recitado final el texto se oculta, para decirlo de memoria; se puede mostrar al tocar. */
  hideFinalText: boolean;
  rate: number;
  /** Voz elegida para cada idioma (nombre de la voz del dispositivo); sin entrada, la predeterminada. */
  voices: Record<string, string>;
}

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  autoAdvance: true,
  voiceEveryRepetition: false,
  hideFinalText: true,
  rate: 1,
  voices: {},
};

const MAX_VOICE_NAME_LENGTH = 200;

function parseVoices(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const voices: Record<string, string> = {};
  for (const [lang, name] of Object.entries(value)) {
    if (isLang(lang) && typeof name === 'string' && name.length > 0 && name.length <= MAX_VOICE_NAME_LENGTH) {
      voices[lang] = name;
    }
  }
  return voices;
}

/** Lo guardado pudo escribirlo otra versión: solo se aceptan valores válidos. */
export function parsePlayerSettings(raw: string | null): PlayerSettings {
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PLAYER_SETTINGS;
    const { autoAdvance, voiceEveryRepetition, hideFinalText, rate, voices } = parsed as Record<string, unknown>;
    return {
      autoAdvance: typeof autoAdvance === 'boolean' ? autoAdvance : DEFAULT_PLAYER_SETTINGS.autoAdvance,
      voiceEveryRepetition:
        typeof voiceEveryRepetition === 'boolean'
          ? voiceEveryRepetition
          : DEFAULT_PLAYER_SETTINGS.voiceEveryRepetition,
      hideFinalText:
        typeof hideFinalText === 'boolean' ? hideFinalText : DEFAULT_PLAYER_SETTINGS.hideFinalText,
      rate:
        typeof rate === 'number' && (RATE_OPTIONS as readonly number[]).includes(rate)
          ? rate
          : DEFAULT_PLAYER_SETTINGS.rate,
      voices: parseVoices(voices),
    };
  } catch {
    return DEFAULT_PLAYER_SETTINGS;
  }
}

export function usePlayerSettings(): [PlayerSettings, (patch: Partial<PlayerSettings>) => void] {
  const storage = useMemo(browserStorage, []);
  const [settings, setSettings] = useState(() => parsePlayerSettings(storage.getItem(KEY)));

  const update = useCallback(
    (patch: Partial<PlayerSettings>) => {
      setSettings((previous) => {
        const next = { ...previous, ...patch };
        storage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [storage],
  );
  return [settings, update];
}
