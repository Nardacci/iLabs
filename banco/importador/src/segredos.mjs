// Varredura de segredos (RN-011). REGRA: o valor achado nunca sai daqui. O resultado traz só o tipo e o número da linha.

const ENDERECO = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;

/**
 * Quatro números separados por ponto podem ser um endereço de servidor ou só um número de versão (1.2.3.4).
 * Conta como endereço: rede privada (10.x, 172.16-31.x, 192.168.x), loopback (127.x), qualquer número acima de 30,
 * ou a linha falar de servidor, host, IP ou endereço. Números pequenos soltos (versões) não contam.
 */
function temEndereco(linha) {
  for (const m of linha.matchAll(ENDERECO)) {
    const [a, b, c, d] = m[0].split('.').map(Number);
    const privado = a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
    if (privado || [a, b, c, d].some((n) => n > 30) || /(\bip\b|servidor|host|endere[cç]o)/i.test(linha)) return true;
  }
  return false;
}

const PADROES = [
  { tipo: 'senha ou chave', rx: /(password|passwd|pwd|senha)\s*[=:]\s*\S{3,}/i },
  { tipo: 'string de conexão', rx: /(data source|server|host)\s*=\s*[^;\s]{3,}.*(user id|uid|pwd|password)\s*=/i },
  { tipo: 'chave privada', rx: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { tipo: 'token', rx: /(bearer\s+[A-Za-z0-9\-_.]{20,}|api[_-]?key\s*[=:]\s*\S{12,}|secret\s*[=:]\s*\S{12,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,})/i },
  { tipo: 'endereço de servidor', confere: temEndereco },
];

export const TIPOS_DE_ACHADO = PADROES.map((p) => p.tipo);

/** Nome seguro de um tipo de achado, para usar em linha de comando (sem acento nem espaço). */
export function chaveDoTipo(tipo) {
  return tipo.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

/**
 * Procura segredos no texto. Devolve [{ tipo, linha }], no máximo 20 por tipo, sem o valor encontrado.
 * `linha` é o número da linha (a primeira é 1).
 */
export function varrer(texto) {
  const achados = [];
  const contagem = new Map();
  const linhas = texto.split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    for (const { tipo, rx, confere } of PADROES) {
      if (!(confere ? confere(linhas[i]) : rx.test(linhas[i]))) continue;
      const n = (contagem.get(tipo) ?? 0) + 1;
      contagem.set(tipo, n);
      if (n <= 20) achados.push({ tipo, linha: i + 1 });
    }
  }
  return achados;
}
