# Lições da homologação da versão nova do LabMedSys: requisitos corrigidos para o iLabs

**Origem:** testes de tela do módulo Principal da versão nova do LabMedSys (17/10 a 09/11/2026), 54 defeitos registrados (`DV-PRI-N-001` a `054`) no repositório privado `LabMedsys_homol`, em `homologacao/versao-nova/1.principal/defeitos/`. O portal de homologação mostra cada ficha com evidência. **Falha de outro sistema não vira requisito: vira requisito corrigido** (regra do projeto). Esta lista é o ponto de partida; cada item deve entrar nos requisitos e nos testes do banco (`banco/testes/`) antes da tela correspondente.

| # | Requisito corrigido para o iLabs | Defeitos de origem | Onde mora (regra de negócio nunca no front) |
|---|---|---|---|
| LH-01 | O servidor confere a **função e a ação** em toda gravação e leitura; esconder o botão não basta. Quem só consulta não grava. | N-011, N-035 | Banco: `ilab.tem_permissao` em toda função e RLS |
| LH-02 | **Inativar perfil ou conta tira o acesso na hora**; token e sessão antigos deixam de valer ao sair, ao inativar e ao trocar a senha. | N-036, N-004 | Banco e função de login |
| LH-03 | **Separação de funções:** ninguém altera o próprio perfil, inativa ou reativa a si mesmo, nem reseta a própria senha; quem cria um perfil não concede o que não tem. | N-045 | Banco (gatilho e função de perfil) |
| LH-04 | **Justificativa obrigatória** em alteração, inativação e exclusão, **gravada e mostrada no histórico**, em todas as telas. | N-001, N-007, N-015, N-029, N-030 | Banco (`ilab.alterar_cadastro`, `mudar_situacao`) |
| LH-05 | O histórico mostra **sempre quem fez**, quando, valor antigo e valor novo, com acentos corretos; nenhuma coluna em branco. | N-002, N-014 | Banco (trilha de auditoria por gatilho) |
| LH-06 | **Integridade referencial:** não excluir nem inativar item em uso sem aviso e sem recusa clara (mensagem diz o que o usa); filho ativo sob pai inativo é tratado. | N-012, N-023, N-024, N-032, N-041, N-042 | Banco (conta quem aponta; recusa com mensagem) |
| LH-07 | **Identificação confiável:** CPF e CNPJ com dígito verificado, sem repetição; datas coerentes (nascimento, emissão, fabricação não no futuro). | N-016, N-020, N-047 | Banco (restrições e funções) |
| LH-08 | **Tamanho máximo igual** na tela e no servidor; recusa com mensagem que diz o limite; nada é cortado ou limpo em silêncio (telefone, nome longo). | N-026, N-046, N-048 | Banco (restrições) e contrato dos tipos |
| LH-09 | **Valores numéricos exatos:** nenhum valor muda ao salvar (o legado multiplicava por 10); taxas e porcentagens com faixa válida. | N-013, N-032 | Banco (tipo numérico e restrição) |
| LH-10 | **Duplicidade por regra única:** nome, código, tag e sigla únicos onde o negócio exige, com mensagem clara. | N-007, N-053 | Banco (índices únicos por empresa) |
| LH-11 | **Mensagens** ficam visíveis até a pessoa fechar, com acento, e são da tela certa; nenhuma tela mostra o texto de outra. | N-003, N-018, N-024, N-027 | Front só apresenta; texto vem do contrato do banco |
| LH-12 | **Senha:** política única e escrita (tamanho, tipos, validade **máxima**, reuso); a provisória nunca aparece em texto numa mensagem de tela comum. | N-017, N-021, N-049 | Banco e função de login |
| LH-13 | **Sessão:** expira com **mensagem**, renova sem derrubar quem está em uso, volta ao ponto onde estava; token não fica legível por script da página. | N-005, N-043 | Função de login e app |
| LH-14 | **Relatórios e exportações respeitam o filtro** da tela e levam a logomarca e o cabeçalho da empresa. | N-025, N-028, N-039 | Função de servidor de relatório |
| LH-15 | **Busca ignora acento e caixa**; seletores listam **todos** os registros (paginação ou busca no servidor), sem limite oculto. | N-009, N-006, N-038 | Banco (busca normalizada) e componente de lista |
| LH-16 | **Confirmação consistente:** toda inclusão, edição e exclusão pergunta antes de gravar, do mesmo jeito em todas as telas. | N-008 | Componente único de cadastro |
| LH-17 | **Empresa e estabelecimento corretos:** a caixa "Empresa" lista empresas (não fornecedores); endereço com todas as UF e municípios. | N-052, N-054 | Banco (cadastro corporativo) |
| LH-18 | **Perfil sem função** é recusado (ou avisa que a conta ficará sem acesso a nada). | N-051 | Banco (função de perfil) |

## Como usar
- Ao começar um módulo novo, conferir a tabela e transformar os itens que valem para ele em requisitos e em testes do banco.
- Quando um item for atendido, registrar no diário de bordo com o teste que o prova.
- Os números `N-0xx` são das fichas do portal de homologação (repositório `LabMedsys_homol`, privado); o conteúdo de cada uma não é copiado para cá.
