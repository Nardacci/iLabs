import { assertEquals } from 'jsr:@std/assert@1';
import { criarManipuladorSenhaAlterada, type DependenciasSenha } from './manipulador.ts';

function simulacao(tokenValido = 'bom') {
  const chamadas: Array<{ usuarioId: string; ip: string | null; navegador: string | null }> = [];
  const dep: DependenciasSenha = {
    quemE: (t) => Promise.resolve(t === tokenValido ? 'usuario-1' : null),
    registrarTrocaDeSenha: (usuarioId, ip, navegador) => {
      chamadas.push({ usuarioId, ip, navegador });
      return Promise.resolve();
    },
  };
  return { dep, chamadas };
}

const chamar = (token: string | null, extra: Record<string, string> = {}) =>
  new Request('https://exemplo.test/senha-alterada', {
    method: 'POST',
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...extra },
  });

Deno.test('com sessão válida registra a troca para o dono do token, com IP e navegador', async () => {
  const s = simulacao();
  const r = await criarManipuladorSenhaAlterada(s.dep)(
    chamar('bom', { 'x-forwarded-for': '198.51.100.4', 'user-agent': 'N/1' }),
  );
  assertEquals(r.status, 200);
  assertEquals(s.chamadas, [{ usuarioId: 'usuario-1', ip: '198.51.100.4', navegador: 'N/1' }]);
});

Deno.test('sem token ou com token inválido não registra nada', async () => {
  const s = simulacao();
  const manipular = criarManipuladorSenhaAlterada(s.dep);
  assertEquals((await manipular(chamar(null))).status, 401);
  assertEquals((await manipular(chamar('ruim'))).status, 401);
  assertEquals(s.chamadas.length, 0);
});

Deno.test('erro do banco devolve mensagem simples e status 500', async () => {
  const s = simulacao();
  s.dep.registrarTrocaDeSenha = () => Promise.reject(new Error('x'));
  const r = await criarManipuladorSenhaAlterada(s.dep)(chamar('bom'));
  assertEquals(r.status, 500);
});
