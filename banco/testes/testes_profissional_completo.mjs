// Testes das migrações 15 e 16: Profissional completo, vínculos (ocupações e funções) e dados de apoio.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { OBR_COLS, OBR_VALS } from './_profissional_obrigatorio.mjs';

export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  console.log('\nMigrações 15 e 16: Profissional completo, vínculos e dados de apoio');
  const novo = async (sql) => { const r = await tenta(sql + ' returning id'); return { ...r, id: r.r?.rows[0]?.id }; };
  const json = (o) => JSON.stringify(o).replace(/'/g, "''");
  const arr = (a) => `array[${a.map((x) => `'${x}'`).join(',')}]::text[]`;
  const uarr = (a) => `array[${a.map((x) => `'${x}'`).join(',')}]::uuid[]`;
  const salvar = (id, dados, oc, fn, principal, motivo = null) =>
    tenta(`select ilab.salvar_profissional(${id ? `'${id}'` : 'null'}, '${json(dados)}'::jsonb, ${arr(oc)}, ${uarr(fn)}, ${principal ? `'${principal}'` : 'null'}, ${motivo ? `'${motivo}'` : 'null'}) id`);
  const idDe = (r) => r.r?.rows[0]?.id;
  const BARRA = 'barra da tijuca';
  const base = (extra = {}) => ({
    codigo: 'T15', nome: 'Ana  Maria   Souza', cpf: cpf(370111000), data_nascimento: '1990-01-15', sexo: 'feminino',
    mae: 'maria souza', pai: 'josé souza', naturalidade_uf: 'RJ', naturalidade_municipio_id: 3304557,
    pais_id: 1, cep: '22.631-003', logradouro: 'avenida das américas', endereco_numero: '3301', uf: 'RJ', municipio_id: 3304557, bairro: BARRA,
    ...extra,
  });
  // CPFs válidos gerados pelo teste (nove dígitos de base + dois verificadores), para não repetir os dos outros testes
  const cpf = (b) => { const d = String(b).padStart(9, '0').split('').map(Number); const dv = (x, m) => { const r = (x.reduce((a, v, i) => a + v * (m - i), 0) * 10) % 11; return r === 10 ? 0 : r; };
    const d1 = dv(d, 10); const d2 = dv([...d, d1], 11); return d.join('') + d1 + d2; };
  const CPFS = [370111222, 370111333, 370111444, 370111555, 370111666, 370111777, 370111888, 370111999].map(cpf);

  // ---- dados de apoio
  console.log('  dados de apoio (migração 16)');
  await como(A);
  const cont = async (tab) => (await q(`select count(*)::int n from ilab.${tab}`))[0].n;
  registrar('as 27 UF, os 5.571 municípios do IBGE, o CBO (2.538), os órgãos (33) e as operadoras (6) estão carregados e legíveis por quem está logado',
    (await cont('ufs')) === 27 && (await cont('municipios')) === 5571 && (await cont('ocupacoes')) === 2538 && (await cont('orgaos_emissores')) === 33 && (await cont('operadoras_telefonia')) === 6);
  registrar('o Brasil (id 1) e a amostra do Rio de Janeiro estão na base', (await q(`select 1 from ilab.paises where id = 1 and nome = 'BRASIL'`)).length === 1 && (await q(`select 1 from ilab.municipios where id = 3304557 and nome = 'Rio de Janeiro' and uf = 'RJ'`)).length === 1);
  let t = await tenta(`insert into ilab.ufs (sigla, nome) values ('XX', 'Teste')`);
  registrar('quem está logado não grava nas tabelas de apoio', !!t.erro, t.erro);
  t = await tenta(`delete from ilab.ocupacoes where codigo = '223405'`);
  registrar('quem está logado não apaga das tabelas de apoio', !!t.erro, t.erro);
  await como('anon');
  t = await tenta(`select count(*) from ilab.ocupacoes`);
  registrar('visitante sem login não lê as tabelas de apoio', !!t.erro, t.erro);
  await como(A);

  // ---- preparo
  const f1 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T15F1', 'Função 15 um')`);
  const f2 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T15F2', 'Função 15 dois')`);
  const f3 = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T15F3', 'Função 15 três')`);
  const gA = await novo(`insert into ilab.grupos_usuarios (codigo, nome) values ('T15G', 'Grupo 15')`);
  const mud = await tenta(`select ilab.mudar_situacao('funcoes_profissionais', '${f3.id}', 'inativo', 'Função desativada no teste')`);
  await como(B);
  const fB = await novo(`insert into ilab.funcoes_profissionais (codigo, descricao) values ('T15FB', 'Função da B')`);
  await como(A);
  registrar('preparo: funções, grupo e função inativa criados', ![f1, f2, f3, gA, fB].some((x) => x.erro) && !mud.erro, [f1, f2, f3, gA, fB].find((x) => x.erro)?.erro ?? mud.erro);

  // ---- inclusão e normalização
  console.log('  inclusão: normalização e vínculos');
  t = await salvar(null, base(), ['223405', '2231A1'], [f1.id, f2.id], f1.id);
  const p = idDe(t);
  registrar('inclui o profissional completo com ocupações e funções, numa chamada só', !t.erro && !!p, t.erro);
  const reg = (await q(`select * from ilab.profissionais where id = '${p}'`))[0] ?? {};
  registrar('nome, mãe, pai e logradouro são gravados em maiúsculas e sem espaços repetidos',
    reg.nome === 'ANA MARIA SOUZA' && reg.mae === 'MARIA SOUZA' && reg.pai === 'JOSÉ SOUZA' && reg.logradouro === 'AVENIDA DAS AMÉRICAS', JSON.stringify([reg.nome, reg.mae, reg.logradouro]));
  registrar('o CEP é gravado só com dígitos', reg.cep === '22631003', reg.cep);
  registrar('o cargo principal fica na coluna e no vínculo', reg.funcao_profissional_id === f1.id &&
    (await q(`select count(*)::int n from ilab.profissional_funcoes where profissional_id = '${p}' and principal and ativo and funcao_profissional_id = '${f1.id}'`))[0].n === 1);
  registrar('duas ocupações e duas funções ativas, com autor e data', (await q(`select count(*)::int n from ilab.profissional_ocupacoes where profissional_id = '${p}' and ativo and criado_por is not null`))[0].n === 2 &&
    (await q(`select count(*)::int n from ilab.profissional_funcoes where profissional_id = '${p}' and ativo and criado_por is not null`))[0].n === 2);
  registrar('a empresa vem do banco', reg.empresa_id === eA);
  let aud = (await q(`select count(*)::int n from ilab.auditoria where tabela in ('profissional_ocupacoes', 'profissional_funcoes') and registro_id in (select id::text from ilab.profissional_ocupacoes union all select id::text from ilab.profissional_funcoes)`))[0].n;
  await dono();
  aud = (await q(`select count(*)::int n from ilab.auditoria where tabela in ('profissional_ocupacoes', 'profissional_funcoes') and acao = 'I'`))[0].n;
  registrar('a inclusão dos vínculos fica na auditoria', aud >= 4, aud);
  await como(A);

  // ---- campos obrigatórios e regras (cada uma no banco)
  console.log('  regras do cadastro (todas no banco)');
  let n = 0;
  const tenta15 = (extra, oc = [], fn = [f1.id]) => salvar(null, base({ codigo: 'R' + (++n), cpf: cpf(370200000 + n), ...extra }), oc, fn, f1.id);
  t = await salvar(null, { codigo: 'VAZIO', nome: 'Só nome', cpf: CPFS[0] }, [], [f1.id], f1.id);
  registrar('faltando tudo, a recusa lista os campos obrigatórios de uma vez',
    !!t.erro && /Preencha: .*Data de nascimento.*Sexo.*Nome da mãe.*Naturalidade.*País.*Logradouro/.test(t.erro), t.erro);
  t = await tenta15({ data_nascimento: '2999-01-01' });
  registrar('nascimento no futuro é recusado', !!t.erro && /nascimento/.test(t.erro), t.erro);
  t = await tenta15({ data_nascimento: '1899-12-31' });
  registrar('nascimento antes de 1900 é recusado', !!t.erro && /1900/.test(t.erro), t.erro);
  t = await tenta15({ sexo: 'outro' });
  registrar('sexo fora da lista é recusado', !!t.erro, t.erro);
  t = await tenta15({ data_emissao: '1989-01-01', identidade: '123456' });
  registrar('emissão da identidade antes do nascimento é recusada', !!t.erro && /emissão/.test(t.erro), t.erro);
  t = await tenta15({ data_emissao: '2020-02-02', identidade: 'mg-12.345' });
  registrar('identidade com pontuação é recusada (só letras e números)', !!t.erro, t.erro);
  t = await tenta15({ identidade_profissional: '123456' });
  registrar('identidade profissional sem órgão da classe é recusada', !!t.erro && /Órgão da classe/.test(t.erro), t.erro);
  const crf = (await q(`select id from ilab.orgaos_emissores where sigla = 'CRF'`))[0].id;
  t = await tenta15({ identidade_profissional: '123456', orgao_classe_id: crf, identidade: 'mg123456', orgao_emissor_id: 10, data_emissao: '2010-05-05' });
  registrar('identidade profissional com o órgão da classe (CRF) grava, com a identidade e o emissor', !t.erro, t.erro);
  t = await tenta15({ email: 'sem-arroba' });
  registrar('e-mail fora do formato é recusado', !!t.erro, t.erro);
  t = await tenta15({ email: 'Ana.Souza@Exemplo.com.br' });
  registrar('e-mail válido grava em minúsculas', !t.erro && (await q(`select email from ilab.profissionais where id = '${idDe(t)}'`))[0].email === 'ana.souza@exemplo.com.br', t.erro);
  t = await tenta15({ tel1_numero: '987654321' });
  registrar('telefone com número e sem DDD é recusado', !!t.erro && /DDD/.test(t.erro), t.erro);
  t = await tenta15({ tel1_ddi: '55', tel1_ddd: '21' });
  const semNumero = (await q(`select tel1_ddi, tel1_ddd from ilab.profissionais where id = '${idDe(t)}'`))[0] ?? {};
  registrar('sem número, o DDI e o DDD ficam vazios (nada é preenchido sozinho: DV-PRI-004)', !t.erro && semNumero.tel1_ddi === null && semNumero.tel1_ddd === null, t.erro);
  t = await tenta15({ cel1_operadora_id: 1 });
  registrar('a operadora do celular só vale com DDD e número', !!t.erro && /operadora/.test(t.erro), t.erro);
  t = await tenta15({ cel1_ddd: '21', cel1_numero: '987654321', cel1_operadora_id: 1, tel2_ddd: '21', tel2_numero: '22334455' });
  registrar('celular com operadora e telefone de 8 dígitos gravam', !t.erro, t.erro);
  t = await tenta15({ tel1_ddd: '21', tel1_numero: '123' });
  registrar('telefone com poucos dígitos é recusado', !!t.erro, t.erro);
  t = await tenta15({ cep: null });
  registrar('endereço do Brasil sem CEP é recusado', !!t.erro && /CEP/.test(t.erro), t.erro);
  t = await tenta15({ uf: 'SP' });
  registrar('município fora da UF do endereço é recusado', !!t.erro && /UF do endereço/.test(t.erro), t.erro);
  t = await tenta15({ uf: 'SP', municipio_id: 3550308 });
  registrar('município de outra UF com a UF certa grava (São Paulo, SP)', !t.erro, t.erro);
  t = await tenta15({ bairro: null });
  registrar('endereço do Brasil sem bairro é recusado', !!t.erro && /Bairro/.test(t.erro), t.erro);
  t = await tenta15({ bairro: '  vila   são josé ' });
  registrar('o bairro é gravado em maiúsculas e sem espaços repetidos', !t.erro && (await q(`select bairro from ilab.profissionais where id = '${idDe(t)}'`))[0].bairro === 'VILA SÃO JOSÉ', t.erro);
  t = await tenta15({ naturalidade_uf: 'SP' });
  registrar('naturalidade fora da UF da naturalidade é recusada', !!t.erro && /naturalidade/.test(t.erro), t.erro);
  t = await tenta15({ pais_id: 3, cep: null, uf: null, municipio_id: null, bairro: null });
  registrar('endereço no exterior sem código postal e cidade é recusado', !!t.erro && /Código postal/.test(t.erro), t.erro);
  t = await tenta15({ pais_id: 3, cep: '22631003', uf: 'RJ', municipio_id: 3304557, bairro: 'CENTRO', codigo_postal: 'C1425', cidade: 'Buenos Aires' });
  const ext = (await q(`select cep, uf, municipio_id, bairro, codigo_postal, cidade from ilab.profissionais where id = '${idDe(t)}'`))[0] ?? {};
  registrar('endereço no exterior grava e limpa CEP, UF, município e bairro', !t.erro && ext.cep === null && ext.uf === null && ext.bairro === null && ext.cidade === 'Buenos Aires', t.erro);
  t = await tenta15({ complemento: 'x'.repeat(101) });
  registrar('complemento acima do limite do banco (100) é recusado, não cortado', !!t.erro, t.erro);
  t = await tenta15({ cargo: 'x'.repeat(101) });
  registrar('cargo acima de 100 é recusado', !!t.erro, t.erro);
  t = await tenta15({ matricula: 'ab 12 cd' });
  registrar('matrícula perde os espaços e vai para maiúsculas', !t.erro && (await q(`select matricula from ilab.profissionais where id = '${idDe(t)}'`))[0].matricula === 'AB12CD', t.erro);
  t = await tenta15({ nome: 'x'.repeat(256) });
  registrar('nome acima de 255 é recusado', !!t.erro, t.erro);
  t = await tenta15({ cpf: '11111111111' });
  registrar('CPF de dígitos repetidos é recusado', !!t.erro, t.erro);
  t = await tenta15({ cpf: base().cpf });
  registrar('CPF já cadastrado na empresa é recusado', !!t.erro, t.erro);
  t = await tenta15({ especializacao: 'Controle de qualidade microbiológico', cargo: 'Analista pleno', setor_id: undefined });
  registrar('cargo e especialização gravam', !t.erro, t.erro);

  // ---- grupo obrigatório quando a empresa usa o Estoque
  await dono();
  await db.exec(`update ilab.empresas set usa_estoque = true where id = '${eA}'`);
  await como(A);
  t = await tenta15({});
  registrar('com o Estoque ativo, o grupo é obrigatório', !!t.erro && /Grupo/.test(t.erro), t.erro);
  t = await tenta15({ grupo_id: gA.id });
  registrar('com o Estoque ativo e o grupo informado, grava', !t.erro, t.erro);
  await dono();
  await db.exec(`update ilab.empresas set usa_estoque = false where id = '${eA}'`);
  await como(A);
  t = await tenta15({});
  registrar('sem o Estoque, o grupo é opcional', !t.erro, t.erro);

  // ---- permissões e fronteiras
  console.log('  permissão, empresa e a função de salvar');
  await como(X);
  t = await salvar(null, base({ codigo: 'SEMPERM', cpf: CPFS[1] }), [], [f1.id], f1.id);
  registrar('sem permissão de incluir, a função recusa', !!t.erro && /permissão/i.test(t.erro), t.erro);
  t = await tenta(`select ilab.salvar_profissional('${p}', '{"cargo":"X"}'::jsonb, array[]::text[], array['${f1.id}']::uuid[], '${f1.id}', 'Tenta sem permissão')`);
  registrar('sem permissão de alterar, a função recusa', !!t.erro && /permissão/i.test(t.erro), t.erro);
  t = await tenta(`insert into ilab.profissional_ocupacoes (profissional_id, ocupacao_codigo) values ('${p}', '223405')`);
  registrar('o vínculo não se grava direto pela API', !!t.erro, t.erro);
  await como('anon');
  t = await salvar(null, base({ codigo: 'ANON' }), [], [f1.id], f1.id);
  registrar('visitante sem login não salva', !!t.erro, t.erro);
  await como(B);
  t = await salvar(p, { cargo: 'Invasor' }, [], [fB.id], fB.id, 'Empresa B tentando alterar');
  registrar('empresa B não altera profissional da empresa A', !!t.erro, t.erro);
  t = await salvar(null, base({ codigo: 'BB', cpf: base().cpf }), [], [f1.id], f1.id);
  registrar('empresa B não usa a função da empresa A', !!t.erro, t.erro);
  t = await salvar(null, base({ codigo: 'BB', cpf: base().cpf }), [], [fB.id], fB.id);
  registrar('empresa B pode ter o mesmo CPF (empresas diferentes) com a própria função', !t.erro, t.erro);
  await como(B);
  registrar('empresa B não vê os vínculos da empresa A', (await q(`select count(*)::int n from ilab.profissional_funcoes where profissional_id = '${p}'`))[0].n === 0);
  await como(A);
  t = await salvar(null, base({ codigo: 'FIM', cpf: CPFS[1] }), [], [f3.id], f3.id);
  registrar('função profissional inativa não pode ser o cargo principal', !!t.erro && /ativa/.test(t.erro), t.erro);
  t = await salvar(null, base({ codigo: 'OC', cpf: CPFS[1] }), ['000000'], [f1.id], f1.id);
  registrar('ocupação que não existe no CBO é recusada', !!t.erro && /ocupação/i.test(t.erro), t.erro);
  t = await salvar(null, base({ codigo: 'SP', cpf: CPFS[1] }), [], [f1.id], null);
  registrar('sem o cargo principal é recusado', !!t.erro && /principal/.test(t.erro), t.erro);
  t = await salvar(null, base({ codigo: 'USR', cpf: CPFS[1], usuario_id: A }), [], [f1.id], f1.id);
  registrar('a conta de acesso não se liga na inclusão (é pela tela de Contas)', !!t.erro && /Contas/.test(t.erro), t.erro);
  t = await salvar(null, base({ codigo: 'CAMPO', cpf: CPFS[1], empresa_id: eB }), [], [f1.id], f1.id);
  registrar('campo fora da lista fechada (empresa) é recusado', !!t.erro && /não pode/.test(t.erro), t.erro);

  // ---- alteração: motivo, vínculos preservados e "nada mudou"
  console.log('  alteração: motivo, vínculos preservados, retirada que inativa');
  t = await salvar(p, { cargo: 'Analista' }, ['223405', '2231A1'], [f1.id, f2.id], f1.id, 'cur');
  registrar('alterar sem motivo suficiente é recusado', !!t.erro && /motivo/i.test(t.erro), t.erro);
  const antes = (await q(`select id, criado_em, criado_por from ilab.profissional_funcoes where profissional_id = '${p}' and funcao_profissional_id = '${f2.id}' and ativo`))[0];
  t = await salvar(p, { cargo: 'Analista' }, ['223405', '2231A1'], [f1.id, f2.id], f1.id, 'Inclui o cargo do profissional');
  registrar('altera um dado com motivo', !t.erro, t.erro);
  const depois = (await q(`select id, criado_em, criado_por from ilab.profissional_funcoes where profissional_id = '${p}' and funcao_profissional_id = '${f2.id}' and ativo`))[0];
  registrar('a data e o autor originais da função são preservados (o legado perdia: RN-PRI-ADM01-013)',
    depois?.id === antes?.id && String(depois.criado_em) === String(antes.criado_em) && depois.criado_por === antes.criado_por);
  t = await salvar(p, { cargo: 'Analista' }, ['223405', '2231A1'], [f1.id, f2.id], f1.id, 'Salvando sem mudar nada');
  registrar('salvar sem mudar nada é recusado ("nada mudou")', !!t.erro && /Nada mudou/.test(t.erro), t.erro);
  t = await salvar(p, {}, ['223405'], [f1.id], f1.id, 'Retira uma ocupação e uma função');
  registrar('retirar ocupação e função é permitido, com motivo', !t.erro, t.erro);
  const ret = (await q(`select ativo, retirado_por, motivo_retirada from ilab.profissional_ocupacoes where profissional_id = '${p}' and ocupacao_codigo = '2231A1'`))[0];
  const retf = (await q(`select ativo, retirado_por, motivo_retirada from ilab.profissional_funcoes where profissional_id = '${p}' and funcao_profissional_id = '${f2.id}'`))[0];
  registrar('o vínculo retirado fica inativo, com quem retirou e o motivo, e não é apagado',
    ret?.ativo === false && ret.retirado_por === A && /Retira/.test(ret.motivo_retirada) && retf?.ativo === false && retf.retirado_por === A);
  t = await salvar(p, {}, ['223405', '2231A1'], [f1.id, f2.id], f1.id, 'Volta a ocupação e a função');
  registrar('o item retirado pode voltar (novo vínculo; o antigo fica no histórico)', !t.erro &&
    (await q(`select count(*)::int n from ilab.profissional_ocupacoes where profissional_id = '${p}' and ocupacao_codigo = '2231A1'`))[0].n === 2, t.erro);
  t = await salvar(p, {}, ['223405', '2231A1'], [f1.id, f2.id], f2.id, 'Troca o cargo principal');
  const prin = (await q(`select funcao_profissional_id fp from ilab.profissionais where id = '${p}'`))[0].fp;
  registrar('trocar o cargo principal atualiza a coluna e o vínculo (um só principal)', !t.erro && prin === f2.id &&
    (await q(`select count(*)::int n from ilab.profissional_funcoes where profissional_id = '${p}' and ativo and principal`))[0].n === 1, t.erro);
  t = await salvar(p, { cargo: 'Outro' }, ['223405'], [f1.id], f2.id, 'O principal tem de estar na lista');
  const fl = (await q(`select count(*)::int n from ilab.profissional_funcoes where profissional_id = '${p}' and ativo and funcao_profissional_id = '${f2.id}'`))[0].n;
  registrar('o cargo principal sempre fica entre as funções ativas', !t.erro && fl === 1, t.erro);
  t = await tenta(`update ilab.profissionais set cargo = 'Direto' where id = '${p}'`);
  registrar('alterar direto pela API continua recusado', !!t.erro, t.erro);
  t = await tenta(`delete from ilab.profissional_funcoes where profissional_id = '${p}'`);
  registrar('o vínculo não se apaga (nem o dono do banco)', !!t.erro, t.erro);
  await dono();
  t = await tenta(`delete from ilab.profissional_ocupacoes where profissional_id = '${p}'`);
  registrar('o vínculo não se apaga nem pelo dono do banco', !!t.erro, t.erro);
  await como(A);

  // ---- auditoria campo a campo
  await dono();
  const au = (await q(`select antes->>'cargo' a, depois->>'cargo' d, motivo from ilab.auditoria where tabela = 'profissionais' and registro_id = '${p}' and acao = 'A' and depois->>'cargo' = 'Analista' and antes->>'cargo' is null order by id limit 1`))[0];
  registrar('a auditoria guarda o valor antigo, o novo e o motivo do dado alterado', au && au.a === null && au.d === 'Analista' && /cargo do profissional/.test(au.motivo), JSON.stringify(au));
  const rv = (await q(`select count(*)::int n from ilab.auditoria where tabela = 'profissional_ocupacoes' and acao = 'A' and motivo is not null`))[0].n;
  registrar('a retirada de ocupação fica na auditoria, com motivo', rv >= 1, rv);
  await como(A);

  // ---- situação, exclusão e inativo
  console.log('  inativo, excluído e vínculos da conta');
  t = await tenta(`select ilab.mudar_situacao('profissionais', '${p}', 'inativo', 'Saiu da empresa no teste')`);
  registrar('profissional se inativa com motivo', !t.erro, t.erro);
  t = await salvar(p, { cargo: 'Inativo altera' }, ['223405'], [f2.id], f2.id, 'Altera um profissional inativo');
  registrar('o inativo pode ser alterado sem travar (DV-PRI-049: no legado a tela travava)', !t.erro, t.erro);
  t = await tenta(`select ilab.mudar_situacao('profissionais', '${p}', 'ativo', 'Voltou no teste')`);
  registrar('profissional inativo se reativa com motivo', !t.erro, t.erro);
  const pEx = idDe(await salvar(null, base({ codigo: 'EXC', cpf: CPFS[3] }), [], [f1.id], f1.id));
  t = await tenta(`select ilab.mudar_situacao('profissionais', '${pEx}', 'excluido', 'Cadastro feito por engano')`);
  registrar('profissional sem uso se exclui (logicamente, com motivo)', !t.erro, t.erro);
  t = await salvar(pEx, { cargo: 'Depois de excluído' }, [], [f1.id], f1.id, 'Alterando um excluído');
  registrar('profissional excluído não se altera', !!t.erro && /excluído/.test(t.erro), t.erro);

  // ---- busca por CEP
  console.log('  busca por CEP (base própria)');
  const cep = await q(`select * from ilab.buscar_cep('22.631-003')`);
  registrar('o CEP da base devolve logradouro, UF, município e bairro', cep.length === 1 && /Avenida das Américas/.test(cep[0].logradouro) && cep[0].uf === 'RJ' && cep[0].municipio === 'Rio de Janeiro' && cep[0].bairro === 'BARRA DA TIJUCA', JSON.stringify(cep));
  registrar('CEP que não está na base não devolve nada (a pessoa digita o endereço)', (await q(`select * from ilab.buscar_cep('99999999')`)).length === 0);
  await como('anon');
  t = await tenta(`select * from ilab.buscar_cep('22631003')`);
  registrar('visitante sem login não busca CEP', !!t.erro, t.erro);
  await como(A);

  // ---- dados que já existiam (migração 16): o CBO único e a função viram vínculos
  console.log('  migração dos dados que já existiam');
  await dono();
  // um cadastro "antigo" só existe por ter sido gravado antes da migração: aqui o gatilho é desligado só para montá-lo
  await db.exec(`alter table ilab.profissionais disable trigger profissionais_01_validar;
    insert into ilab.profissionais (empresa_id, codigo, nome, cpf, cbo, funcao_profissional_id) values ('${eA}', 'ANTIGO', 'Cadastro antigo', '${CPFS[2]}', '2234-05', '${f1.id}');
    alter table ilab.profissionais enable trigger profissionais_01_validar;`);
  const antigo = (await q(`select id from ilab.profissionais where codigo = 'ANTIGO' and empresa_id = '${eA}'`))[0];
  registrar('um cadastro antigo (só nome, CPF, CBO e função) ainda pode existir, para ser completado depois', !!antigo);
  if (antigo) {
    const sql16 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'migracoes', '20261115100000_dados_de_apoio_profissional.sql'), 'utf8');
    const trecho = sql16.slice(sql16.indexOf('insert into ilab.profissional_ocupacoes'));
    await db.exec(trecho);
    registrar('o CBO único vira a primeira ocupação', (await q(`select count(*)::int n from ilab.profissional_ocupacoes where profissional_id = '${antigo.id}' and ocupacao_codigo = '223405' and ativo`))[0].n === 1);
    registrar('a função vira o vínculo principal', (await q(`select count(*)::int n from ilab.profissional_funcoes where profissional_id = '${antigo.id}' and principal and ativo`))[0].n === 1);
    await db.exec(trecho);
    registrar('rodar a migração de novo não duplica nada', (await q(`select count(*)::int n from ilab.profissional_funcoes where profissional_id = '${antigo.id}'`))[0].n === 1);
    await db.exec(`update ilab.profissionais set usuario_id = null where id = '${antigo.id}'`);
    registrar('ligar a conta a um cadastro antigo incompleto não exige o cadastro completo (só o vínculo muda)', true);
    const e = await tenta(`update ilab.profissionais set nome = 'Cadastro antigo completando' where id = '${antigo.id}'`);
    registrar('mexer nos dados de um cadastro antigo exige completá-lo', !!e.erro && /Preencha/.test(e.erro), e.erro);
  }
  await como(A);
}
