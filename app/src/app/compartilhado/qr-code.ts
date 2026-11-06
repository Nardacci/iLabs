/**
 * O Supabase devolve o QR code das duas etapas como `data:image/svg+xml;utf-8,<svg ...>` (texto, sem base64).
 * O Angular só aceita imagem `data:` em base64 e o `NgOptimizedImage` não aceita imagem embutida, então o QR
 * ficava quebrado. Aqui o SVG vira `data:image/svg+xml;base64,...`, que o Angular aceita sem desligar a segurança.
 * Só aceita SVG vindo desse formato; qualquer outra coisa devolve texto vazio (sem imagem).
 */
const PREFIXO_SVG = 'data:image/svg+xml';

export function qrCodeParaImagem(qrCode: string | null | undefined): string {
  if (!qrCode?.startsWith(PREFIXO_SVG)) return '';
  if (qrCode.startsWith(`${PREFIXO_SVG};base64,`)) return qrCode;
  const virgula = qrCode.indexOf(',');
  if (virgula < 0) return '';
  let svg = qrCode.slice(virgula + 1);
  try {
    svg = decodeURIComponent(svg);
  } catch {
    // já veio sem codificação de URL
  }
  if (!svg.trimStart().startsWith('<svg')) return '';
  const bytes = new TextEncoder().encode(svg);
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return `${PREFIXO_SVG};base64,${btoa(binario)}`;
}
