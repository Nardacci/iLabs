/** Uma coluna da exportação: a chave do valor na linha e o título que vai no arquivo. */
export interface ColunaDeCsv {
  chave: string;
  rotulo: string;
}

/**
 * Texto de uma célula. Valor que começa com = + - @ (ou tabulação) é lido como FÓRMULA pelas planilhas: leva um
 * apóstrofo na frente para continuar sendo só texto.
 */
function celula(valor: unknown): string {
  let texto =
    valor === null || valor === undefined
      ? ''
      : typeof valor === 'string'
        ? valor
        : typeof valor === 'number' || typeof valor === 'boolean'
          ? String(valor)
          : JSON.stringify(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * CSV no padrão que o Excel em português abre sem ajuda: separador ponto e vírgula, quebra de linha do Windows e
 * marca de UTF-8 no começo (para os acentos não virarem símbolos).
 */
export function gerarCsv(
  colunas: readonly ColunaDeCsv[],
  linhas: readonly Record<string, unknown>[],
): string {
  const titulo = colunas.map((c) => celula(c.rotulo)).join(';');
  const corpo = linhas.map((l) => colunas.map((c) => celula(l[c.chave])).join(';'));
  return '﻿' + [titulo, ...corpo].join('\r\n') + '\r\n';
}

/** Entrega o arquivo ao navegador (download). Não guarda nada no servidor. */
export function baixarArquivo(
  nome: string,
  conteudo: string,
  tipo = 'text/csv;charset=utf-8',
): void {
  const endereco = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const ancora = document.createElement('a');
  ancora.href = endereco;
  ancora.download = nome;
  document.body.appendChild(ancora);
  ancora.click();
  ancora.remove();
  URL.revokeObjectURL(endereco);
}
