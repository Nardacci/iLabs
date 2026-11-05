import { FormControl, FormGroup } from '@angular/forms';
import { regrasDaSenha, senhasIguais, validadorDeSenha } from './senha';

describe('regras de senha', () => {
  it('pede 12 caracteres', () => {
    expect(regrasDaSenha('curta', '')[0]?.cumprida).toBe(false);
    expect(regrasDaSenha('uma-senha-longa-1', '')[0]?.cumprida).toBe(true);
  });

  it('recusa senha comum e senha com o e-mail', () => {
    expect(regrasDaSenha('123456789012', '').every((r) => r.cumprida)).toBe(false);
    expect(regrasDaSenha('carla.dias-2026-xx', 'carla.dias@lab.com').every((r) => r.cumprida)).toBe(
      false,
    );
    expect(
      regrasDaSenha('cavalo-bateria-grampo', 'carla.dias@lab.com').every((r) => r.cumprida),
    ).toBe(true);
  });

  it('o validador devolve a regra que falhou, em português', () => {
    const grupo = new FormGroup({
      email: new FormControl('a@b.com'),
      senha: new FormControl('curta', validadorDeSenha('email')),
    });
    expect(grupo.controls.senha.errors?.['senhaFraca']).toBeTruthy();
    grupo.controls.senha.setValue('cavalo-bateria-grampo');
    expect(grupo.controls.senha.errors).toBeNull();
  });

  it('a confirmação precisa ser igual', () => {
    const grupo = new FormGroup({
      senha: new FormControl('abc'),
      confirmacao: new FormControl('abd', senhasIguais('senha')),
    });
    expect(grupo.controls.confirmacao.errors?.['senhasDiferentes']).toBeTruthy();
    grupo.controls.confirmacao.setValue('abc');
    expect(grupo.controls.confirmacao.errors).toBeNull();
  });
});
