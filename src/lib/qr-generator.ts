import QRCode from 'qrcode';

export function getCardUrl(cardId: string): string {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';
  return `${domain}/c/${cardId}`;
}

export async function generateQRDataURL(cardId: string): Promise<string> {
  const url = getCardUrl(cardId);
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
  const url = getCardUrl(cardId);
  return QRCode.toString(url, {
    type: 'svg',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H',
  });
}

export function generateCSV(cardIds: string[]): string {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';
  let csv = 'Card ID,URL\n';
  for (const id of cardIds) {
    csv += `${id},${domain}/c/${id}\n`;
  }
  return csv;
}
