import { ErroDoBanco } from './banco';

/** Texto de erro para mostrar à pessoa: mensagem do banco quando existe, senão uma frase simples. */
export function mensagemDeErro(
  erro: unknown,
  padrao = 'Não foi possível concluir. Tente de novo.',
): string {
  if (erro instanceof ErroDoBanco && erro.message) return erro.message;
  return padrao;
}
