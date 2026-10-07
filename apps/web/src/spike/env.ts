/** Datos del dispositivo que importan para interpretar la prueba de voz. */
export function describeEnvironment(): string[] {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
  return [
    `Navegador: ${navigator.userAgent}`,
    `Instalada como app (pantalla de inicio): ${standalone ? 'sí' : 'no'}`,
    `Contexto seguro (HTTPS): ${window.isSecureContext ? 'sí' : 'no'}`,
    `Síntesis de voz: ${'speechSynthesis' in window ? 'disponible' : 'NO disponible'}`,
    `Wake Lock (pantalla encendida): ${'wakeLock' in navigator ? 'disponible' : 'NO disponible'}`,
    `Portapapeles: ${navigator.clipboard ? 'disponible' : 'NO disponible'}`,
    `Pantalla: ${window.screen.width}x${window.screen.height} (ventana ${window.innerWidth}x${window.innerHeight})`,
  ];
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
