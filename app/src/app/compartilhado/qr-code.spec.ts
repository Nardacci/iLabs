import { describe, expect, it } from 'vitest';
import { qrCodeParaImagem } from './qr-code';

describe('qrCodeParaImagem', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="5" height="5"/></svg>';

  it('converte o SVG em texto do Supabase para imagem em base64', () => {
    const saida = qrCodeParaImagem(`data:image/svg+xml;utf-8,${svg}`);
    expect(saida.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(atob(saida.split(',')[1]!)).toBe(svg);
  });

  it('entende o SVG codificado como URL', () => {
    const saida = qrCodeParaImagem(`data:image/svg+xml;utf-8,${encodeURIComponent(svg)}`);
    expect(atob(saida.split(',')[1]!)).toBe(svg);
  });

  it('mantém o que já está em base64', () => {
    const pronto = `data:image/svg+xml;base64,${btoa(svg)}`;
    expect(qrCodeParaImagem(pronto)).toBe(pronto);
  });

  it('não aceita outra coisa que não seja SVG (sem imagem)', () => {
    expect(qrCodeParaImagem('javascript:alert(1)')).toBe('');
    expect(qrCodeParaImagem('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(qrCodeParaImagem('data:image/svg+xml;utf-8,<script>alert(1)</script>')).toBe('');
    expect(qrCodeParaImagem(null)).toBe('');
    expect(qrCodeParaImagem('')).toBe('');
  });
});
