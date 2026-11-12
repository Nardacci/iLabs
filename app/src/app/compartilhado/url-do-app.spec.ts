import { urlDoApp } from './url-do-app';

describe('urlDoApp', () => {
  it('mantém a pasta do site publicado (GitHub Pages)', () => {
    expect(urlDoApp('/redefinir', 'https://nardacci.github.io/iLabs/')).toBe(
      'https://nardacci.github.io/iLabs/redefinir',
    );
  });

  it('funciona na raiz (desenvolvimento) e aceita caminho sem barra', () => {
    expect(urlDoApp('convite', 'http://localhost:4200/')).toBe('http://localhost:4200/convite');
  });

  it('preserva o fragmento do convite', () => {
    expect(urlDoApp('/convite#token=abc', 'https://nardacci.github.io/iLabs/')).toBe(
      'https://nardacci.github.io/iLabs/convite#token=abc',
    );
  });
});
