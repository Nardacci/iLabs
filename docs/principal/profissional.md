# Profissional: especificação da tela e do banco

**Origem:** `01-profissional.md` e `paginas/01-profissional/` do repositório do legado (documentação de 24/10/2026) e as capturas da tela entregues pelo responsável em 13/11/2026. **Regra deste documento:** mantemos as **regras de negócio** do legado; o **layout** do legado não é requisito. Toda falha do legado vira requisito corrigido, citando o achado.

Situação (13/11/2026): **etapas 1 a 3 construídas e testadas; migrações 15 e 16 NÃO aplicadas no Supabase** (dependem da autorização do responsável). Banco: `banco/migracoes/20261115090000_profissional_completo.sql` e `20261115100000_dados_de_apoio_profissional.sql`, testes 635 de 635. App: formulário próprio em `app/src/app/cadastros/profissional/`, testes 95 de 95 e ponta a ponta 26 de 26. **Etapa 4 (impressão, exportação e CPF mascarado na lista) ainda não feita.** Nada é aplicado no Supabase sem a autorização do responsável.

## 1. O que é
O cadastro das **pessoas** que executam e assinam. Separado da Conta de usuário (a conta é opcional e se liga ao profissional). Os outros módulos usam o cadastro para saber quem é a pessoa, em que setor e grupo está e **que funções exerce** (quem pode assinar o quê).

## 2. Campos (regra do legado, valor do iLabs)

### 2.1 Dados pessoais
| Campo | Obrigatório | Regra (legado) | O que muda no iLabs |
|---|---|---|---|
| Código | Sim | (já existe) | Mantém |
| Nome | Sim | Maiúsculas, sem espaços repetidos; até 255 | Limite do campo = limite do banco (legado: tela 270, coluna 255) |
| Data de nascimento | Sim | De 01/01/1900 até hoje | O banco confere |
| Sexo | Sim | Lista | Lista fechada no banco |
| Nome da mãe | Sim | Maiúsculas, até 255 | **Volta** (decisão de 13/11) |
| Nome do pai | Não | Maiúsculas, até 255 | **Volta** |
| UF e naturalidade | Sim | Listas encadeadas | Município da base de apoio |
| CPF | Sim | Dígitos conferidos, único | Já existe; o banco recusa repetido **também de excluído** (legado deixava o CPF de excluído voltar: RN-PRI-ADM01-005, ponto a validar) |
| Data de cadastro | n/a | Preenchida pelo sistema | Só leitura (`criado_em`) |

### 2.2 Documentos
Identidade (letras e números, até 15), órgão emissor, data de emissão (depois do nascimento e até hoje). **Identidade profissional** (números, até 15) e **órgão da classe**: se há identidade profissional, o órgão da classe é obrigatório (RN-PRI-ADM01-010). Relevante para quem assina (por exemplo o CRF do farmacêutico).

### 2.3 Contatos
Dois telefones (DDI, DDD, número), dois celulares (DDI, DDD, número e operadora; a operadora só vale com DDD e número), e-mail (formato conferido, minúsculas).
**Correção:** o DDI não é preenchido sozinho com 55 e gravado como se o usuário o tivesse mexido (DV-PRI-004). Sem número, DDI e DDD ficam vazios.

### 2.4 Endereço
CEP (busca preenche logradouro, UF, município e bairro), logradouro, número (`S/N` se não houver), complemento, país, UF, município (lista oficial do IBGE), **bairro digitado** (maiúsculas; não existe base de bairros acessível e exigir um bairro de lista vazia travaria todos os cadastros). **Fora do Brasil**: código postal e cidade no lugar de CEP, UF, município e bairro. **Correção:** sem padrão fixo "Brasil, RJ, Rio de Janeiro" (era de um cliente). Limite do complemento igual no campo e no banco (legado: campo 255, coluna 60).

### 2.5 Trabalho
Setor (já existe), cargo (texto, até 100), matrícula (letras e números, até 12, sem espaços, maiúsculas), especialização (até 100), grupo (já existe). **Grupo obrigatório só quando a empresa usa o Estoque** (RN-PRI-ADM01-011): a conferência mora no banco; depende de o banco saber se o módulo Estoque está ativo (ver pendências).

### 2.6 Ocupações (CBO) e funções profissionais: **várias**
- Uma pessoa tem **várias ocupações** (código CBO e descrição) e **várias funções profissionais**, sem repetir (RN-PRI-ADM01-012). Uma função pode ser marcada **cargo principal** (o legado tinha a coluna e nunca preenchia; decisão de 06/11/2026: manter).
- **Correção (RN-PRI-ADM01-013):** o legado apagava e regravava todos os itens a cada salvamento, perdendo data e autor originais. Aqui cada vínculo guarda **quem pôs e quando**, e retirar um item **inativa o vínculo** (não apaga), com motivo e na auditoria.
- O campo `cbo` único atual é **substituído** pela lista de ocupações (a coluna antiga é mantida só até migrar os dados existentes).

### 2.7 Situação e justificativas
Ativo ou inativo (inativação exige justificativa), excluído lógico (nunca físico). Alterar exige justificativa/motivo. **Correção (DV-PRI-049):** o inativo pode ser reativado e, se preciso, excluído, sem travar a tela inteira.

## 3. Dados de apoio (novas tabelas compartilhadas)
País, UF, município, logradouro (CEP), órgão emissor (e da classe), operadora de telefonia, ocupação (CBO).
- Tabelas **globais** (iguais para todas as empresas), só leitura para o app; a manutenção é carga controlada.
- **CBO:** 2.538 ocupações no legado (`dml.sql`). **Órgãos emissores:** 33. **Operadoras:** TIM, CLARO, VIVO, OI, NEXTEL, OUTRAS. **Países:** lista do legado.
- **UF (27) e municípios (5.571, com o código do IBGE): carregados** a partir da lista oficial do IBGE (edição 2026), obtida pelo pacote público `@br-geo-kit/ibge` 1.0.0, porque o legado só trazia o Rio de Janeiro.
- **Logradouro por CEP: no legado só há 1 logradouro (amostra do RJ).** Decisão do responsável: base própria no banco, como no legado. **Falta a carga completa** (pendência 1); sem ela a busca por CEP diz "não encontrado" e o endereço é digitado.

## 4. Regras que moram no banco (nunca só na tela)
Obrigatórios; limites de tamanho; datas (nascimento, emissão); CPF (dígitos, único); e-mail; órgão da classe obrigatório com identidade profissional; operadora só com DDD e número; endereço do Brasil exige CEP, UF, município e bairro, e do exterior exige código postal e cidade; ocupações e funções sem repetição; grupo obrigatório quando o Estoque está ativo; inativação e exclusão com justificativa; ninguém exclui o próprio cadastro; conta ligada impede a exclusão do profissional (DV-PRI-006); **toda gravação confere permissão** (DV-PRI-025, DV-PRI-023); auditoria por gatilho, **campo a campo, com valor antigo e novo corretos** (DV-PRI-004), **incluindo grupo** (RN-PRI-ADM01-017) e **a exclusão** (DV-PRI-014).

## 5. Layout novo (não segue o legado)
Cadastro A (página inteira, rodapé fixo com Cancelar e Salvar) com seções navegáveis em vez de uma coluna longa: **Dados pessoais · Documentos · Contatos · Endereço · Trabalho · Ocupações e funções · Histórico**. Ocupações e funções como lista com busca e botão de adicionar, mostrando quem adicionou e quando. Campos agrupados por afinidade, rótulos claros, acessibilidade WCAG AA, funciona no celular. O front só apresenta e coleta; o aviso rápido vem do mesmo contrato do banco.
**Lista (Pesquisa A):** filtros por nome, CPF, grupo, situação e função profissional; CPF mascarado na lista; **a impressão e a exportação respeitam o filtro e a permissão** (N-039; RN-PRI-ADM01-020); mãe, pai, identidade e endereço **não** saem em lista nem exportação.

## 6. Etapas de construção
1. **Banco** (migração 15): tabelas de apoio, novas colunas, ocupações e funções com vínculo auditável, regras e permissões; testes em `banco/testes/`.
2. **Carga dos dados de apoio** (CBO, órgãos, operadoras, países, UF e a base de CEP definida na pendência 1).
3. **Tela nova** (Cadastro A com seções) e a lista com os filtros.
4. **Impressão e exportação** com filtro e permissão; relatório sem dados em excesso.
Cada etapa termina com testes, entrada no `DIARIO-DE-BORDO.md` e, só com autorização, aplicação no Supabase.

## 7. Pendências para o responsável
1. **Base de CEP (logradouros):** de onde vem a carga? Municípios e UF já estão completos (IBGE); faltam os logradouros por CEP (e, se quiserem, uma lista de bairros). Hoje a busca por CEP só acha a amostra do RJ.
2. **Estoque ativo:** como o banco sabe que a empresa usa o Estoque (hoje não há esse parâmetro)? Proposta: parâmetro da empresa.
3. **CPF de excluído:** pode ser reaproveitado (legado permitia) ou continua único para sempre (proposta)?
4. **Lista de sexo e órgão da classe:** confirmar as opções (legado: lista fixa e a mesma tabela de órgãos).
5. **Mãe e pai:** com a reversão, confirmar se a mãe segue obrigatória (como no legado) ou só o pai opcional.
