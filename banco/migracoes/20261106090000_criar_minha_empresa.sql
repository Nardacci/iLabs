-- iLabs, nova versão. Migração 4: a pessoa logada cria a PRÓPRIA empresa ("Deseja se cadastrar?", 4 etapas).
-- NÃO APLICADA: depende da autorização do responsável (CLAUDE.md). Testes: banco/testes/testes_criar_empresa.mjs.
--
-- Até a migração 3 só existia ilab_interno.criar_empresa, que é interna (só o dono do banco chama).
-- Aqui entra a função pública ilab.criar_minha_empresa, que usa a interna e acrescenta:
--  - exige uma conta no Supabase Auth ainda sem empresa (o Supabase só entrega sessão depois da confirmação do e-mail);
--  - valida o CNPJ (14 dígitos e dígitos verificadores) e recusa CNPJ repetido;
--  - exige o responsável técnico (nome completo e CRF com UF e número); a AFE é opcional durante o teste;
--  - cria empresa, responsável (perfil Administrador), perfis, política e unidades padrão de forma atômica.
-- Falha do legado que isto corrige: o legado não validava o CNPJ nem impedia empresa duplicada.

-- 1. Dados da empresa que o passo a passo coleta
alter table ilab.empresas
  add column cnpj text unique check (cnpj ~ '^[0-9]{14}$'),
  add column razao_social text,
  add column nome_fantasia text,
  add column telefone text,
  add column email_contato text,
  add column cep text,
  add column logradouro text,
  add column numero text,
  add column complemento text,
  add column cidade text,
  add column uf text check (uf ~ '^[A-Z]{2}$'),
  add column afe text,
  add column responsavel_tecnico_nome text,
  add column responsavel_tecnico_crf text,
  add column responsavel_cargo text,
  add column responsavel_telefone text;

-- 2. Conferência dos dígitos verificadores do CNPJ (aceita com ou sem máscara)
create function ilab_interno.cnpj_valido(p_cnpj text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  d      text := regexp_replace(coalesce(p_cnpj, ''), '[^0-9]', '', 'g');
  pesos1 integer[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  pesos2 integer[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  soma   integer;
  dv1    integer;
  dv2    integer;
  i      integer;
begin
  if length(d) <> 14 or d ~ '^(.)\1{13}$' then return false; end if;
  soma := 0;
  for i in 1..12 loop soma := soma + substr(d, i, 1)::integer * pesos1[i]; end loop;
  dv1 := case when soma % 11 < 2 then 0 else 11 - soma % 11 end;
  soma := 0;
  for i in 1..13 loop soma := soma + substr(d, i, 1)::integer * pesos2[i]; end loop;
  dv2 := case when soma % 11 < 2 then 0 else 11 - soma % 11 end;
  return dv1 = substr(d, 13, 1)::integer and dv2 = substr(d, 14, 1)::integer;
end $$;

-- 3. A função da pessoa logada
create function ilab.criar_minha_empresa(
  p_responsavel_cargo text, p_responsavel_telefone text,
  p_razao_social text, p_nome_fantasia text, p_cnpj text, p_telefone text, p_email_contato text,
  p_cep text, p_logradouro text, p_numero text, p_complemento text, p_cidade text, p_uf text,
  p_afe text, p_responsavel_tecnico_nome text, p_responsavel_tecnico_crf text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_nome  text;
  v_cnpj  text := regexp_replace(coalesce(p_cnpj, ''), '[^0-9]', '', 'g');
  v_crf   text := upper(btrim(coalesce(p_responsavel_tecnico_crf, '')));
  v_uf    text := upper(btrim(coalesce(p_uf, '')));
  v_emp   uuid;
begin
  if v_uid is null then raise exception 'Entre com a conta criada no cadastro.'; end if;
  select x.email into v_email from auth.users x where x.id = v_uid;
  if v_email is null then raise exception 'Conta não encontrada.'; end if;
  if exists (select 1 from ilab.usuarios u where u.id = v_uid) then
    raise exception 'Esta conta já pertence a uma empresa.';
  end if;

  if length(btrim(coalesce(p_razao_social, ''))) < 3 then raise exception 'Informe a razão social.'; end if;
  if not ilab_interno.cnpj_valido(v_cnpj) then raise exception 'CNPJ inválido. Confira os 14 dígitos.'; end if;
  if v_uf !~ '^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$' then
    raise exception 'Informe a UF da fábrica.';
  end if;
  if length(btrim(coalesce(p_responsavel_tecnico_nome, ''))) < 5 or btrim(p_responsavel_tecnico_nome) !~ '\s' then
    raise exception 'Informe o nome completo do responsável técnico.';
  end if;
  if v_crf !~ '^[A-Z]{2}[ -]?[0-9]{1,8}$' then
    raise exception 'Informe o CRF do responsável técnico com a UF e o número (exemplo: SP 12345).';
  end if;
  if exists (select 1 from ilab.empresas e where e.cnpj = v_cnpj) then
    raise exception 'Este CNPJ já está cadastrado. Peça um convite ao responsável da empresa.';
  end if;

  -- nome da pessoa: o que ela digitou no cadastro (guardado pelo Supabase Auth); sem ele, a parte local do e-mail
  v_nome := nullif(btrim(coalesce(auth.jwt() -> 'user_metadata' ->> 'nome', '')), '');
  v_nome := coalesce(v_nome, split_part(v_email, '@', 1));

  v_emp := ilab_interno.criar_empresa('CNPJ-' || v_cnpj, btrim(p_razao_social), v_uid, v_nome, lower(v_email));
  update ilab.empresas set
    cnpj = v_cnpj, razao_social = btrim(p_razao_social), nome_fantasia = nullif(btrim(coalesce(p_nome_fantasia, '')), ''),
    telefone = nullif(btrim(coalesce(p_telefone, '')), ''), email_contato = nullif(btrim(coalesce(p_email_contato, '')), ''),
    cep = nullif(btrim(coalesce(p_cep, '')), ''), logradouro = nullif(btrim(coalesce(p_logradouro, '')), ''),
    numero = nullif(btrim(coalesce(p_numero, '')), ''), complemento = nullif(btrim(coalesce(p_complemento, '')), ''),
    cidade = nullif(btrim(coalesce(p_cidade, '')), ''), uf = v_uf, afe = nullif(btrim(coalesce(p_afe, '')), ''),
    responsavel_tecnico_nome = btrim(p_responsavel_tecnico_nome), responsavel_tecnico_crf = v_crf,
    responsavel_cargo = nullif(btrim(coalesce(p_responsavel_cargo, '')), ''),
    responsavel_telefone = nullif(btrim(coalesce(p_responsavel_telefone, '')), '')
   where id = v_emp;
  return v_emp;
end $$;

-- Quem pode chamar: só pessoa logada. (O padrão do Postgres daria acesso a todos; revogamos explicitamente.)
revoke execute on function ilab.criar_minha_empresa(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function ilab.criar_minha_empresa(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) to authenticated;
revoke execute on function ilab_interno.cnpj_valido(text) from public, anon, authenticated;
grant execute on function ilab_interno.cnpj_valido(text) to service_role;
