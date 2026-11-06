import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { comBancoFalso, permissao } from '../../../testing/apoio';
import { destinoObrigatorio, type EstadoDaConta, SessaoService } from './sessao.service';

const estado = (m: Partial<EstadoDaConta> = {}): EstadoDaConta => ({
  usuario_id: 'u1',
  empresa_id: 'e1',
  nome: 'Ana',
  ativo: true,
  senha_a_trocar: false,
  bloqueado_ate: null,
  situacao_empresa: 'ativa',
  teste_ate: null,
  dias_restantes: null,
  ...m,
});

describe('destino obrigatório da sessão', () => {
  it('sem sessão vai para entrar', () => {
    expect(destinoObrigatorio(false, null, '/usuarios')).toBe('/entrar');
  });
  it('logada sem empresa vai para o cadastro da empresa', () => {
    expect(destinoObrigatorio(true, null, '/inicio')).toBe('/empresa');
    expect(destinoObrigatorio(true, null, '/empresa')).toBeNull();
  });
  it('empresa suspensa vai para a tela própria', () => {
    expect(destinoObrigatorio(true, estado({ situacao_empresa: 'suspensa' }), '/inicio')).toBe(
      '/empresa-suspensa',
    );
  });
  it('senha a trocar só deixa abrir Minha segurança', () => {
    const e = estado({ senha_a_trocar: true });
    expect(destinoObrigatorio(true, e, '/usuarios')).toBe('/seguranca');
    expect(destinoObrigatorio(true, e, '/seguranca')).toBeNull();
  });
  it('conta normal segue', () => {
    expect(destinoObrigatorio(true, estado(), '/usuarios')).toBeNull();
  });
});

describe('SessaoService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('pode() vem de minhas_permissoes: ação não liberada é recusada', () => {
    const banco = comBancoFalso();
    banco.respostas['meu_estado'] = [estado()];
    banco.respostas['minhas_permissoes'] = [permissao('acesso.usuarios', { incluir: true })];
    const sessao = TestBed.inject(SessaoService);
    return sessao.carregarContexto().then(() => {
      expect(sessao.pode('acesso.usuarios')).toBe(true);
      expect(sessao.pode('acesso.usuarios', 'incluir')).toBe(true);
      expect(sessao.pode('acesso.usuarios', 'excluir')).toBe(false);
      expect(sessao.pode('acesso.perfis')).toBe(false);
      expect(sessao.pode(undefined)).toBe(true);
    });
  });

  it('entrar: qualquer erro do servidor mostra a mesma mensagem e não cria sessão', async () => {
    comBancoFalso();
    const sessao = TestBed.inject(SessaoService);
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        json: () => Promise.resolve({ ok: false, mensagem: 'E-mail ou senha incorretos.' }),
      }),
    );
    const r = await sessao.entrar('a@b.com', 'x');
    expect(r).toEqual({ ok: false, mensagem: 'E-mail ou senha incorretos.' });
    expect(sessao.logado()).toBe(false);
  });

  it('entrar: falha de rede também não revela nada sobre a conta', async () => {
    comBancoFalso();
    const sessao = TestBed.inject(SessaoService);
    vi.stubGlobal('fetch', () => Promise.reject(new Error('rede')));
    const r = await sessao.entrar('a@b.com', 'x');
    expect(r.ok).toBe(false);
  });

  it('o servidor recusa por inatividade: a sessão é limpa e a pessoa vai para a entrada com o motivo', async () => {
    const banco = comBancoFalso();
    banco.respostas['meu_estado'] = [estado()];
    const navegar = vi.fn(() => Promise.resolve(true));
    TestBed.overrideProvider(Router, { useValue: { navigate: navegar } });
    const sessao = TestBed.inject(SessaoService);
    await sessao.carregarContexto();
    expect(sessao.estado()).not.toBeNull();
    banco.recusaPorInatividade.next(); // o banco devolveu o erro único de inatividade
    banco.recusaPorInatividade.next(); // uma segunda chamada recusada ao mesmo tempo não duplica
    await vi.waitFor(() => expect(navegar).toHaveBeenCalled());
    expect(navegar).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith(['/entrar'], { queryParams: { motivo: 'inatividade' } });
    expect(sessao.logado()).toBe(false);
    expect(sessao.estado()).toBeNull();
    expect(sessao.permissoes()).toEqual([]);
  });
});
