/** Copia al portapapeles. Devuelve `false` si el navegador no lo permite. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function canShare(): boolean {
  return typeof navigator.share === 'function';
}

/** Abre el menú de compartir del sistema. `false` si no existe o el usuario lo cancela. */
export async function shareText(title: string, text: string): Promise<boolean> {
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}

/** Descarga un archivo generado en el dispositivo; no se envía nada a ningún servidor. */
export function downloadFile(filename: string, mimeType: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
