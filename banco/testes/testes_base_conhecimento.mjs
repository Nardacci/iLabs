// Testes da migração 15: Base de conhecimento, etapa 1 (documentos e versões).
export async function rodar({ db, registrar, como, tenta, dono, A, B, X, eA, eB }) {
  const q = async (sql) => (await db.query(sql)).rows;
  console.log('\nMigração 15: Base de conhecimento (documentos e versões)');

  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const soma = (n) => String(n).padStart(64, 'a').slice(-64).replace(/[^0-9a-f]/g, 'a');   // 64 caracteres hexadecimais
  const aspas = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

  // monta a chamada de kb_criar_documento; o caminho segue a regra empresa/documento/versão.extensão
  const criar = (empresa, o) => {
    const d = {
      doc: id(1), ver: id(101), titulo: 'RDC 658/2022', legenda: 'Boas Práticas de Fabricação de Medicamentos', tipo: 'norma',
      origem: 'anvisa', conf: 'publico', dataFonte: '2022-03-30', ident: 'RDC 658/2022', consultado: '2026-11-13', lida: 'nao_verificada',
      ext: 'pdf', nome: 'rdc-658-2022.pdf', tam: 1234, soma: soma(1), ...o,
    };
    const caminho = d.caminho ?? `${empresa}/${d.doc}/${d.ver}.${d.ext}`;
    return `select ilab.kb_criar_documento(${aspas(d.doc)}, ${aspas(d.ver)}, ${aspas(d.titulo)}, ${aspas(d.legenda)}, ${aspas(d.tipo)}, ${aspas(d.origem)},
      ${aspas(d.conf)}, ${aspas(d.dataFonte)}, ${aspas(d.ident)}, ${aspas(d.consultado)}, ${aspas(d.lida)},
      ${aspas(caminho)}, ${aspas(d.nome)}, ${aspas(d.ext)}, ${d.tam}, ${aspas(d.soma)})`;
  };
  const versao = (empresa, doc, ver, o = {}) => {
    const d = { ext: 'pdf', nome: 'arquivo-v2.pdf', tam: 2000, soma: soma(2), motivo: 'Texto atualizado pela ANVISA', ...o };
    const caminho = d.caminho ?? `${empresa}/${doc}/${ver}.${d.ext}`;
    return `select ilab.kb_nova_versao(${aspas(doc)}, ${aspas(ver)}, ${aspas(caminho)}, ${aspas(d.nome)}, ${aspas(d.ext)}, ${d.tam}, ${aspas(d.soma)}, ${aspas(d.motivo)})`;
  };

  // usuários extras (como dono): D só consulta documentos; E consulta também os confidenciais
  await dono();
  const D = '00000000-0000-0000-0000-0000000000f5', E = '00000000-0000-0000-0000-0000000000f6';
  const PD = '00000000-0000-0000-0000-00000000c0f5', PE = '00000000-0000-0000-0000-00000000c0f6';
  await db.exec(`
    insert into auth.users values ('${D}','d@a.com'),('${E}','e@a.com');
    insert into ilab.usuarios (id, empresa_id, nome, email) values ('${D}','${eA}','Consulta KB','d@a.com'),('${E}','${eA}','Consulta KB conf','e@a.com');
    insert into ilab.perfis (id, empresa_id, nome) values ('${PD}','${eA}','Consulta documentos'),('${PE}','${eA}','Consulta documentos e confidenciais');
    insert into ilab.perfil_funcoes (perfil_id, funcao_chave, consultar) values
      ('${PD}','kb.documentos', true), ('${PE}','kb.documentos', true), ('${PE}','kb.documentos_confidenciais', true);
    insert into ilab.usuario_perfis values ('${D}','${PD}'), ('${E}','${PE}');
  `);

  console.log('  criar documento');
  await como(A);
  let t = await tenta(criar(eA));
  registrar('administrador envia o documento (documento + versão 1 juntos)', !t.erro, t.erro);
  registrar('o documento fica ativo', (await q(`select situacao from ilab.kb_documentos where id = '${id(1)}'`))[0]?.situacao === 'ativo');
  const v1 = (await q(`select numero, tipo_arquivo, checksum from ilab.kb_documento_versoes where documento_id = '${id(1)}'`));
  registrar('nasce com a versão 1 e o checksum guardado', v1.length === 1 && v1[0].numero === 1 && v1[0].checksum === soma(1), JSON.stringify(v1));

  t = await tenta(criar(eA, { doc: id(2), ver: id(102), titulo: '   ', ident: null, soma: soma(2) }));
  registrar('título em branco é recusado', !!t.erro, t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), tipo: 'receita', ident: null, soma: soma(2) }));
  registrar('tipo desconhecido é recusado', !!t.erro, t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), conf: 'secreto', ident: null, soma: soma(2) }));
  registrar('confidencialidade desconhecida é recusada', !!t.erro, t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), origem: 'anvisa', consultado: null, lida: null, ident: null, soma: soma(2) }));
  registrar('documento da ANVISA sem data da consulta é recusado (RN-005)', !!t.erro && /data da consulta/.test(t.erro), t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), consultado: '2999-01-01', ident: null, soma: soma(2) }));
  registrar('data da consulta no futuro é recusada', !!t.erro && /futuro/.test(t.erro), t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), origem: 'upload_proprio', consultado: null, lida: 'vigente', ident: null, soma: soma(2) }));
  registrar('situação lida sem data da consulta é recusada', !!t.erro, t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), caminho: `${eB}/${id(2)}/${id(102)}.pdf`, ident: null, soma: soma(2) }));
  registrar('caminho de arquivo de outra empresa é recusado', !!t.erro && /caminho/.test(t.erro), t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), caminho: `${eA}/${id(9)}/${id(102)}.pdf`, ident: null, soma: soma(2) }));
  registrar('caminho de outro documento é recusado', !!t.erro && /caminho/.test(t.erro), t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), ext: 'exe', nome: 'x.exe', ident: null, soma: soma(2) }));
  registrar('tipo de arquivo fora de txt, docx e pdf é recusado', !!t.erro, t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), soma: 'não-é-hexadecimal', ident: null }));
  registrar('checksum inválido é recusado', !!t.erro, t.erro);
  t = await tenta(criar(eA, { doc: id(2), ver: id(102), tam: 52428801, ident: null, soma: soma(2) }));
  registrar('arquivo acima de 50 MB é recusado', !!t.erro, t.erro);
  t = await tenta(criar(eA, { doc: id(3), ver: id(103), ident: ' rdc 658/2022 ', soma: soma(3) }));
  registrar('a mesma identificação oficial não se cadastra duas vezes', !!t.erro && /identificação/.test(t.erro), t.erro);
  registrar('nada sobrou dos envios recusados', (await q(`select count(*)::int n from ilab.kb_documentos`))[0].n === 1);

  console.log('  só pelas funções');
  t = await tenta(`insert into ilab.kb_documentos (id, titulo, tipo, origem, confidencialidade) values ('${id(4)}', 'Direto', 'outro', 'outro', 'interno')`);
  registrar('ninguém grava documento direto na tabela', !!t.erro, t.erro);
  t = await tenta(`update ilab.kb_documentos set titulo = 'Trocado' where id = '${id(1)}'`);
  registrar('ninguém altera documento direto na tabela', !!t.erro, t.erro);
  t = await tenta(`delete from ilab.kb_documentos where id = '${id(1)}'`);
  registrar('documento não tem exclusão física', !!t.erro, t.erro);
  t = await tenta(`insert into ilab.kb_documento_versoes (id, documento_id, numero, arquivo_caminho, nome_original, tipo_arquivo, tamanho_bytes, checksum)
                   values ('${id(104)}', '${id(1)}', 2, '${eA}/${id(1)}/${id(104)}.pdf', 'x.pdf', 'pdf', 10, '${soma(9)}')`);
  registrar('ninguém grava versão direto na tabela', !!t.erro, t.erro);
  await dono();
  t = await tenta(`update ilab.kb_documento_versoes set nome_original = 'outro.pdf' where documento_id = '${id(1)}'`);
  registrar('nem o dono do banco altera uma versão (RN-004)', !!t.erro && /nunca se altera/.test(t.erro), t.erro);
  t = await tenta(`delete from ilab.kb_documento_versoes where documento_id = '${id(1)}'`);
  registrar('nem o dono do banco apaga uma versão (RN-004)', !!t.erro && /nunca se altera/.test(t.erro), t.erro);

  console.log('  nova versão');
  await como(A);
  t = await tenta(versao(eA, id(1), id(104)));
  registrar('administrador envia a versão 2', !t.erro && t.r.rows[0] && Object.values(t.r.rows[0])[0] === 2, t.erro);
  const vs = await q(`select numero from ilab.kb_documento_versoes where documento_id = '${id(1)}' order by numero`);
  registrar('a versão 1 continua guardada ao lado da 2', vs.length === 2 && vs[0].numero === 1 && vs[1].numero === 2, JSON.stringify(vs));
  t = await tenta(versao(eA, id(1), id(105), { soma: soma(3), motivo: '  ' }));
  registrar('nova versão sem motivo é recusada', !!t.erro, t.erro);
  t = await tenta(versao(eA, id(1), id(105), { soma: soma(2) }));
  registrar('o mesmo arquivo não vira outra versão do mesmo documento', !!t.erro && /já é uma versão/.test(t.erro), t.erro);
  t = await tenta(versao(eA, id(1), id(105), { soma: soma(3), caminho: `${eA}/${id(1)}/${id(999)}.pdf` }));
  registrar('caminho que não confere com a versão é recusado', !!t.erro && /caminho/.test(t.erro), t.erro);
  t = await tenta(versao(eA, id(77), id(106), { soma: soma(4) }));
  registrar('versão de documento que não existe é recusada', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  const audV = (await q(`select motivo from ilab.auditoria where tabela = 'kb_documento_versoes' and acao = 'I' order by id desc limit 1`))[0];
  registrar('o motivo da nova versão vai para a auditoria', audV?.motivo === 'Texto atualizado pela ANVISA', JSON.stringify(audV));
  const dup = await q(`select * from ilab.kb_arquivo_ja_existe('${soma(1)}')`);
  registrar('o aviso de arquivo repetido acha o documento e a versão', dup.length === 1 && dup[0].documento_id === id(1) && dup[0].numero === 1, JSON.stringify(dup));

  console.log('  alterar os dados e inativar');
  t = await tenta(`select ilab.alterar_cadastro('kb_documentos', '${id(1)}', '{"legenda": "Regulamento técnico de BPF"}'::jsonb, 'Texto da legenda mais claro')`);
  registrar('altera a legenda com motivo', !t.erro, t.erro);
  t = await tenta(`select ilab.alterar_cadastro('kb_documentos', '${id(1)}', '{"legenda": "Outra"}'::jsonb, '')`);
  registrar('alteração sem motivo é recusada', !!t.erro, t.erro);
  t = await tenta(`select ilab.alterar_cadastro('kb_documentos', '${id(1)}', '{"empresa_id": "${eB}"}'::jsonb, 'Tentativa')`);
  registrar('a empresa do documento não se altera', !!t.erro, t.erro);
  t = await tenta(`select ilab.alterar_cadastro('kb_documentos', '${id(1)}', '{"consultado_em": null}'::jsonb, 'Tirar a data')`);
  registrar('não dá para tirar a data da consulta de documento da ANVISA', !!t.erro && /data da consulta/.test(t.erro), t.erro);
  const audA = (await q(`select antes->>'legenda' antes, depois->>'legenda' depois, motivo from ilab.auditoria where tabela = 'kb_documentos' and acao = 'A' order by id desc limit 1`))[0];
  registrar('a auditoria guarda o antes, o depois e o motivo', audA?.depois === 'Regulamento técnico de BPF' && audA.motivo === 'Texto da legenda mais claro', JSON.stringify(audA));
  t = await tenta(`select ilab.mudar_situacao('kb_documentos', '${id(1)}', 'excluido', 'Tentar excluir')`);
  registrar('documento não se exclui (já tem versões)', !!t.erro, t.erro);
  t = await tenta(`select ilab.mudar_situacao('kb_documentos', '${id(1)}', 'inativo', 'Norma substituída')`);
  registrar('documento se inativa, com motivo', !t.erro, t.erro);
  t = await tenta(versao(eA, id(1), id(107), { soma: soma(5) }));
  registrar('documento inativo não recebe versão nova', !!t.erro && /não está ativo/.test(t.erro), t.erro);
  t = await tenta(`select ilab.mudar_situacao('kb_documentos', '${id(1)}', 'ativo', 'Norma voltou a valer')`);
  registrar('documento inativo se reativa, com motivo', !t.erro, t.erro);

  console.log('  confidencialidade (RN-007)');
  t = await tenta(criar(eA, { doc: id(5), ver: id(115), titulo: 'Contrato interno', origem: 'upload_proprio', consultado: null, lida: null, ident: null, tipo: 'outro', conf: 'confidencial', soma: soma(15) }));
  registrar('administrador cadastra documento confidencial', !t.erro, t.erro);
  const verA = (await q(`select count(*)::int n from ilab.kb_documentos`))[0].n;
  registrar('administrador vê os dois documentos', verA === 2, String(verA));
  await como(D);
  registrar('quem só consulta vê o documento comum (1)', (await q(`select count(*)::int n from ilab.kb_documentos`))[0].n === 1);
  registrar('quem só consulta não vê o confidencial', (await q(`select count(*)::int n from ilab.kb_documentos where id = '${id(5)}'`))[0].n === 0);
  registrar('quem não vê o documento também não vê as versões dele', (await q(`select count(*)::int n from ilab.kb_documento_versoes where documento_id = '${id(5)}'`))[0].n === 0);
  registrar('a regra do arquivo (leitura) acompanha a versão visível',
    (await q(`select ilab_interno.kb_pode_ler_arquivo('${eA}/${id(1)}/${id(101)}.pdf') ok`))[0].ok === true
    && (await q(`select ilab_interno.kb_pode_ler_arquivo('${eA}/${id(5)}/${id(115)}.pdf') ok`))[0].ok === false);
  t = await tenta(criar(eA, { doc: id(6), ver: id(116), ident: null, soma: soma(16) }));
  registrar('quem só consulta não envia documento', !!t.erro && /permissão/.test(t.erro), t.erro);
  t = await tenta(versao(eA, id(1), id(108), { soma: soma(6) }));
  registrar('quem só consulta não envia nova versão', !!t.erro && /permissão/.test(t.erro), t.erro);
  t = await tenta(`select ilab.alterar_cadastro('kb_documentos', '${id(1)}', '{"titulo": "Mudou"}'::jsonb, 'Sem permissão')`);
  registrar('quem só consulta não altera dados', !!t.erro, t.erro);
  await como(E);
  registrar('quem tem a função dos confidenciais vê os dois (2)', (await q(`select count(*)::int n from ilab.kb_documentos`))[0].n === 2);
  registrar('e lê o arquivo do confidencial',
    (await q(`select ilab_interno.kb_pode_ler_arquivo('${eA}/${id(5)}/${id(115)}.pdf') ok`))[0].ok === true);
  t = await tenta(criar(eA, { doc: id(6), ver: id(116), conf: 'confidencial', origem: 'upload_proprio', consultado: null, lida: null, ident: null, soma: soma(16) }));
  registrar('consulta de confidenciais sem permissão de incluir não envia', !!t.erro, t.erro);
  await como(X);
  registrar('usuário sem perfil não vê documentos', (await q(`select count(*)::int n from ilab.kb_documentos`))[0].n === 0);
  t = await tenta(criar(eA, { doc: id(6), ver: id(116), ident: null, soma: soma(16) }));
  registrar('usuário sem perfil não envia documento', !!t.erro, t.erro);
  await como('anon');
  t = await tenta(`select count(*)::int n from ilab.kb_documentos`);
  registrar('visitante sem login não lê documentos', !!t.erro || t.r.rows[0].n === 0, t.erro);

  console.log('  isolamento entre empresas');
  await como(B);
  registrar('administrador B não vê documentos da empresa A', (await q(`select count(*)::int n from ilab.kb_documentos`))[0].n === 0);
  registrar('B não vê versões da empresa A', (await q(`select count(*)::int n from ilab.kb_documento_versoes`))[0].n === 0);
  registrar('B não vê o arquivo da empresa A', (await q(`select ilab_interno.kb_pode_ler_arquivo('${eA}/${id(1)}/${id(101)}.pdf') ok`))[0].ok === false);
  t = await tenta(criar(eA, { doc: id(7), ver: id(117), ident: null, soma: soma(17) }));
  registrar('B não envia arquivo para a pasta da empresa A', !!t.erro && /caminho/.test(t.erro), t.erro);
  t = await tenta(versao(eB, id(1), id(118), { soma: soma(18) }));
  registrar('B não envia versão para documento da empresa A', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  t = await tenta(`select ilab.alterar_cadastro('kb_documentos', '${id(1)}', '{"titulo": "Invasão"}'::jsonb, 'Tentativa')`);
  registrar('B não altera documento da empresa A', !!t.erro && /não encontrado/.test(t.erro), t.erro);
  registrar('B não acha o arquivo da empresa A pelo aviso de repetido', (await q(`select count(*)::int n from ilab.kb_arquivo_ja_existe('${soma(1)}')`))[0].n === 0);
  t = await tenta(criar(eB, { doc: id(1), ver: id(101) }));
  registrar('B não consegue reaproveitar os identificadores da empresa A', !!t.erro, t.erro);
  t = await tenta(criar(eB, { doc: id(21), ver: id(121), soma: soma(1) }));
  registrar('B pode ter a mesma identificação oficial e o mesmo arquivo (empresas diferentes)', !t.erro, t.erro);

  console.log('  regra do caminho no Storage');
  await como(A);
  const ok = async (nome) => (await q(`select ilab_interno.kb_pode_gravar_arquivo('${nome}') ok`))[0].ok;
  registrar('administrador A grava na pasta da própria empresa', await ok(`${eA}/${id(30)}/${id(130)}.pdf`) === true);
  registrar('administrador A não grava na pasta da empresa B', await ok(`${eB}/${id(30)}/${id(130)}.pdf`) === false);
  registrar('nome fora do padrão empresa/documento/versão é recusado', await ok(`${eA}/arquivo.pdf`) === false && await ok(`${eA}/${id(30)}/${id(130)}.exe`) === false);
  await como(D);
  registrar('quem só consulta não grava arquivo', await ok(`${eA}/${id(30)}/${id(130)}.pdf`) === false);
}
