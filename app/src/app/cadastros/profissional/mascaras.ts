/** Só os dígitos de um texto. */
export function soDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/** 12345678909 → 123.456.789-09 (enquanto digita, mostra o que já tem). */
export function mascaraCpf(texto: string): string {
  const d = soDigitos(texto).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

/** 22631003 → 22.631-003. */
export function mascaraCep(texto: string): string {
  const d = soDigitos(texto).slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2-$3');
}

/** Iniciais para o avatar: primeira e última palavra do nome ("Ana Maria Souza" → "AS"). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primeira + ultima).toUpperCase();
}

/** Um matiz estável (0 a 359) para a cor do avatar, calculado do nome. */
export function matizDoNome(nome: string): number {
  let h = 0;
  for (const c of nome.trim().toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
