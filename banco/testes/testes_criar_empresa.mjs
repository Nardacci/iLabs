// Testes da migração 4: a pessoa logada cria a própria empresa (ilab.criar_minha_empresa).
// Chamado por rodar_com_pglite.mjs, no mesmo banco de teste das migrações anteriores.
export async function rodar({ db, registrar, como, tenta, dono }) {
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const P = '00000000-0000-0000-0000-0000000000f1'; // conta nova, sem empresa
  const P2 = '00000000-0000-0000-0000-0000000000f2';
  const P3 = '00000000-0000-0000-0000-0000000000f3';
  const CNPJ_BOM = '11.222.333/0001-81';
  const dados = (o = {}) => ({
    cargo: 'Diretora técnica', tel: '11900000000', razao: 'Laboratório Teste Ltda', fantasia: 'Lab Teste', cnpj: CNPJ_BOM,
    telEmp: '1130000000', emailEmp: 'contato@lab.com.br', cep: '01001000', log: 'Rua A', num: '10', comp: '', cidade: 'São Paulo',
    uf: 'SP', afe: '', rt: 'Carla Dias Souza', crf: 'SP 12345', ...o,
  });
  const chamar = (d) =>
    tenta(`select ilab.criar_minha_empresa($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) id`.replace(/\$(\d+)/g, (_, i) => {
      const v = [d.cargo, d.tel, d.razao, d.fantasia, d.cnpj, d.telEmp, d.emailEmp, d.cep, d.log, d.num, d.comp, d.cidade, d.uf, d.afe, d.rt, d.crf][i - 1];
      return `'${String(v).replace(/'/g, "''")}'`;
    }));

  console.log('\nMigração 4: criar a própria empresa');
  await dono();
  await db.exec(`insert into auth.users (id, email) values ('${P}', 'carla@lab.com.br'), ('${P2}', 'outra@lab.com.br'), ('${P3}', 'terceira@lab.com.br')`);

  registrar('CNPJ válido com máscara é aceito pela conferência', (await q(`select ilab_interno.cnpj_valido('${CNPJ_BOM}') ok`))[0].ok === true);
  registrar('CNPJ com dígito errado é recusado pela conferência', (await q(`select ilab_interno.cnpj_valido('11.222.333/0001-82') ok`))[0].ok === false);
  registrar('CNPJ de dígitos repetidos é recusado pela conferência', (await q(`select ilab_interno.cnpj_valido('11111111111111') ok`))[0].ok === false);

  await como('anon');
  let t = await chamar(dados());
  registrar('sem login a função é recusada', !!t.erro);

  await como(P);
  t = await chamar(dados({ cnpj: '11.222.333/0001-82' }));
  registrar('CNPJ inválido é recusado com mensagem clara', !!t.erro && /CNPJ inválido/.test(t.erro), t.erro);
  t = await chamar(dados({ rt: 'Carla' }));
  registrar('responsável técnico sem nome completo é recusado', !!t.erro && /nome completo/.test(t.erro), t.erro);
  t = await chamar(dados({ crf: '12345' }));
  registrar('CRF sem UF é recusado', !!t.erro && /CRF/.test(t.erro), t.erro);
  t = await chamar(dados({ uf: 'XX' }));
  registrar('UF inexistente é recusada', !!t.erro && /UF/.test(t.erro), t.erro);
  t = await chamar(dados({ razao: 'ab' }));
  registrar('razão social curta é recusada', !!t.erro, t.erro);
  await dono();
  registrar('as recusas não criaram empresa nenhuma', (await q(`select count(*)::int n from ilab.empresas where cnpj is not null`))[0].n === 0);

  await como(P);
  t = await chamar(dados());
  registrar('conta nova cria a empresa', !t.erro && !!t.r?.rows?.[0]?.id, t.erro);
  const emp = t.r?.rows?.[0]?.id;

  await dono();
  const e = (await q(`select * from ilab.empresas where id = '${emp}'`))[0];
  registrar('CNPJ gravado só com dígitos, UF e responsável técnico gravados', e.cnpj === '11222333000181' && e.uf === 'SP' && e.responsavel_tecnico_nome === 'Carla Dias Souza' && e.responsavel_tecnico_crf === 'SP 12345');
  registrar('empresa nasce em teste, com prazo do parâmetro do banco', e.situacao_acesso === 'teste' && e.teste_ate !== null);
  const u = (await q(`select * from ilab.usuarios where id = '${P}'`))[0];
  registrar('quem cadastrou virou usuário da empresa', u?.empresa_id === emp && u.email === 'carla@lab.com.br');
  registrar('quem cadastrou tem o perfil Administrador', (await q(`select count(*)::int n from ilab.usuario_perfis up join ilab.perfis p on p.id = up.perfil_id where up.usuario_id = '${P}' and p.nome = 'Administrador' and p.empresa_id = '${emp}'`))[0].n === 1);
  registrar('política de segurança e unidades padrão foram criadas', (await q(`select (select count(*) from ilab.politica_seguranca where empresa_id = '${emp}')::int a, (select count(*) from ilab.unidades_medida where empresa_id = '${emp}')::int b`))[0].a === 1);

  await como(P);
  t = await chamar(dados({ cnpj: '11222333000181' }));
  registrar('a mesma conta não cria uma segunda empresa', !!t.erro && /já pertence/.test(t.erro), t.erro);
  await como(P2);
  t = await chamar(dados());
  registrar('CNPJ repetido (mesmo com outra máscara) é recusado', !!t.erro && /já está cadastrado/.test(t.erro), t.erro);
  registrar('a recusa de CNPJ repetido não cita o nome da outra empresa', !/Teste/.test(t.erro ?? ''));

  await como(P3);
  t = await chamar(dados({ cnpj: '45.723.174/0001-10', razao: 'Outra Empresa SA', afe: '' }));
  registrar('segunda empresa com outro CNPJ é criada', !t.erro, t.erro);
  const emp2 = t.r?.rows?.[0]?.id;
  await como(P3);
  registrar('a empresa nova não enxerga a primeira (isolamento)', (await q(`select count(*)::int n from ilab.empresas`))[0].n === 1);
  await dono();
  registrar('a auditoria registrou a criação do usuário da empresa', (await q(`select count(*)::int n from ilab.auditoria where empresa_id = '${emp2}'`))[0].n > 0);
}
