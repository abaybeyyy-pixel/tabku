import QRCode from 'qrcode';

export function getDomain(): string {
  const env = process.env.NEXT_PUBLIC_DOMAIN;
  if (!env || env.includes('vercel.app') || env.includes('localhost')) {
    return 'https://mycarrd.com';
  }
  return env;
}

export function getCardUrl(cardId: string, isQr: boolean = false): string {
  const domain = getDomain();
  return isQr ? `${domain}/c/${cardId}?src=qr` : `${domain}/c/${cardId}`;
}

export async function generateQRDataURL(cardId: string): Promise<string> {
  const url = getCardUrl(cardId, true);
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function generateQRSVG(cardId: string): Promise<string> {
  const url = getCardUrl(cardId, true);
  return QRCode.toString(url, {
    type: 'svg',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H',
  });
}

export function generateCSV(cardIds: string[]): string {
  const domain = getDomain();
  let csv = 'Card ID,URL\n';
  for (const id of cardIds) {
    csv += `${id},${domain}/c/${id}\n`;
  }
  return csv;
}
