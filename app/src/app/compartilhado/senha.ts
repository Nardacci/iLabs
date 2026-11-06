import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Orientação de senha na tela (decisão do responsável: mínimo de 12 caracteres, sem validade periódica,
 * sem regras de caixa). A conferência de verdade é do Supabase Auth e da política da empresa no banco;
 * isto só evita ir ao servidor com uma senha que já se sabe recusada.
 */
export const TAMANHO_MINIMO_DA_SENHA = 12;

const SENHAS_COMUNS = [
  '123456789012',
  'senha1234567',
  'password1234',
  'qwertyuiop12',
  'abcdefghijkl',
  'iloveyou1234',
];

export interface RegraDeSenha {
  texto: string;
  cumprida: boolean;
}

export function regrasDaSenha(senha: string, email: string): RegraDeSenha[] {
  const parteDoEmail = email.split('@')[0]?.toLowerCase() ?? '';
  return [
    {
      texto: `Pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres`,
      cumprida: senha.length >= TAMANHO_MINIMO_DA_SENHA,
    },
    {
      texto: 'Não é uma senha comum',
      cumprida: senha.length > 0 && !SENHAS_COMUNS.includes(senha.toLowerCase()),
    },
    {
      texto: 'Não contém o seu e-mail',
      cumprida:
        senha.length > 0 &&
        (parteDoEmail.length < 3 || !senha.toLowerCase().includes(parteDoEmail)),
    },
  ];
}

/** Valida a senha de um campo; `campoEmail` é o nome do campo de e-mail no mesmo formulário (opcional). */
export function validadorDeSenha(campoEmail?: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const valor = typeof c.value === 'string' ? c.value : '';
    if (valor.length === 0) return null;
    const email = campoEmail ? String(c.parent?.get(campoEmail)?.value ?? '') : '';
    const falha = regrasDaSenha(valor, email).find((r) => !r.cumprida);
    return falha
      ? {
          senhaFraca: {
            mensagem: `A senha precisa cumprir a regra: ${falha.texto.toLowerCase()}.`,
          },
        }
      : null;
  };
}

/** O campo precisa ser igual ao campo `outro` do mesmo formulário. */
export function senhasIguais(outro: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    c.value === c.parent?.get(outro)?.value
      ? null
      : { senhasDiferentes: { mensagem: 'As senhas não são iguais.' } };
}
