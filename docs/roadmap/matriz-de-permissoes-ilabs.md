# Matriz de permissões do iLabs: quem pode o quê, quem não pode ser a mesma pessoa e onde o banco confere

> **Em uma frase:** a lista de **quem pode fazer cada ação importante** nos cinco módulos em foco (Principal, Estoque, Controle da Qualidade, Garantia da Qualidade e Controle de Documentos), de **quem não pode ser a mesma pessoa** que outra na mesma ação, e de **onde o banco confere** isso.
>
> **Exemplo do dia a dia (ilustrativo, os nomes são inventados):** a Marina registra o recebimento de um saco de açúcar. Quem confere o recebimento não pode ser a Marina, e quem autoriza não pode ser quem conferiu. Mesmo que a Marina tente pelo endereço da tela, o banco recusa.
>
> **Por que importa:** a norma pede que cada ação tenha um dono identificado. No sistema antigo, o acesso era conferido só na tela: o usuário só de consulta aprovava laudo e gravava em 12 telas.

**Análise de 26/11/2026. Rascunho para validação do responsável.** Reúne, em um lugar só, o que estava espalhado em [Funções do profissional](funcoes-do-profissional.md) (o que cada função autoriza no sistema atual), no desenho de segurança e acesso (`docs/seguranca-e-acesso.md`, capítulo próprio no Word) e nas fichas de fluxo (coluna "Quem faz"). **O que mostra o código do sistema atual e o que é proposta do iLabs estão separados** abaixo.

## 1. Como o acesso funciona no iLabs (decidido e proposto)
- **Decidido (02/11/2026): a regra mora no banco.** Perfil é um conjunto de **função × ação** (consultar, incluir, alterar, excluir, imprimir, histórico). **O banco recusa** em toda gravação, não só a tela esconde o botão.
- **Decidido (06/11/2026): sem cadastro "Grupos de perfil".** Os **níveis 1, 2 e 3 da Garantia da Qualidade do sistema atual viram papéis da matriz** (seção 4.2).
- **Decidido (02/11/2026): segunda etapa de verificação (2FA) só para quem aprova** (aprovar, reprovar, liberar e anular). **Decidido (05/11/2026): assinatura eletrônica com senha conferida de novo.** O desenho propõe gravar também o significado da assinatura (autor, revisor, aprovador), a data, a hora e o motivo.
- **Decidido: nada se apaga.** Usuário, perfil e empresa se inativam. Ninguém inativa nem muda o próprio perfil. **Inativar encerra as sessões na hora.**
- **Decidido (05/11/2026): quem elabora não aprova o próprio registro.** Aplicado aqui a quem pré-aprova e quem aprova, e a quem escreve e quem aprova um plano (é a aplicação da decisão, não um artigo da ANVISA).
- **O catálogo de funções é da empresa.** Os nomes dos papéis abaixo são **exemplos propostos**; a empresa cadastra os seus, sem números fixos no código (no sistema atual, o código procurava números fixos como 34, 39, 41, 48 e 71).

## 2. Regras que valem para todos os módulos
| Regra | De onde vem |
|---|---|
| Cada ação tem **autor, data e hora** do servidor. | RDC 658/2022, arts. 124 e 125 |
| **Alteração assinada, datada e com o original legível**; motivo registrado. | RDC 658/2022, art. 125 |
| **Papéis e responsabilidades definidos e lista de pessoas autorizadas.** | Guia 33/2020, item 11.12 |
| **Quem aprova assina de novo** (senha) e tem 2FA. | Decisões do responsável de 02/11/2026 (2FA) e 05/11/2026 (senha conferida de novo) |
| **Ninguém aprova o que elaborou.** | Decisão do responsável de 05/11/2026 (não é artigo da ANVISA) |
| **Histórico por gatilho do banco, que ninguém apaga.** | Decisão do responsável; Guia 33/2020, itens 9.8.1.3.9 e 11.14 |

## 3. Quem não pode ser a mesma pessoa (segregação de funções)
| Par de ações | Regra | Base |
|---|---|---|
| Registrar o recebimento e conferi-lo | Quem registra não confere. | Proposta do iLabs (apoio: arts. 124 e 125) |
| Conferir o recebimento e autorizá-lo | O autorizador é outra pessoa, com função própria. | Proposta do iLabs |
| Pedir material e aprovar o pedido | Quem pede não aprova. | Decisão de 05/11/2026 |
| Amostrar e verificar a amostragem | Amostrador e verificador são pessoas diferentes. | Proposta do iLabs (art. 247 pede amostragem por procedimento) |
| Digitar o resultado e decidir o laudo | Quem decide o laudo não digitou ensaio. | Proposta do iLabs (apoio: art. 125) |
| Avaliar o fornecedor e aprovar a qualificação | Quem avaliou não aprova. | Proposta do iLabs (apoio: art. 179) |
| Elaborar, pré-aprovar e aprovar um documento | Três pessoas diferentes. | Art. 119 (documento aprovado por pessoa autorizada) e decisão de 05/11/2026 |
| Escrever, aprovar e monitorar um plano de ação | Pessoas diferentes. | Decisão de 05/11/2026 |
| Inspecionar e ser a área inspecionada | O inspetor é independente da área auditada. | Art. 363 |
| Executar uma ação e escrever o plano | Quem escreveu o plano não o executa. | Decisão de 05/11/2026 |

## 4. Os papéis que já estão no banco e os níveis da Garantia da Qualidade
### 4.1 Os 22 perfis de teste do banco (papéis em proposta)
O banco já traz **22 perfis de teste** (prefixo `T-`), um por papel da matriz proposta, na migração `20261105090000_login_seguranca.sql`. **São uma proposta em validação com a Qualidade**, só para dados de teste. A coluna "Assina como" usa os seis tipos de assinatura do banco: autor, revisor, aprovador, reprovador, liberador e anulador.

| Papel | O que faz | Assina como | Observação |
|---|---|---|---|
| Administrador do sistema | Gerencia usuários, perfis e política | Nenhuma | **Não aprova nada na Qualidade** (a validar); vê auditoria e administra o acesso |
| Responsável pelo cadastro | Mantém os cadastros base | Autor | Único com escrita nos cadastros |
| Recebimento | Recebe materiais | Autor | |
| Almoxarife | Armazena e movimenta materiais | Autor | |
| Inventário | Conta e ajusta o estoque | Autor | |
| Amostrador | Coleta amostras | Autor | |
| Analista do CQ | Executa análises | Autor | |
| Verificador | Verifica o trabalho do analista | Revisor | |
| Chefe do CQ | Decide a aprovação do Controle da Qualidade | Aprovador e reprovador | Vê auditoria |
| Responsável pela estabilidade | Conduz estudos de estabilidade | Autor | |
| Qualquer usuário (registra desvio) | Registra desvios | Autor | |
| Área envolvida | Responde a desvios da sua área | Autor | |
| Analista da GQ | Revisa registros da Garantia da Qualidade | Revisor | Vê auditoria |
| Gestor da GQ | Decide na Garantia da Qualidade | Aprovador, reprovador e anulador | Vê auditoria |
| Inspetor | Consulta tudo, sem gravar | Nenhuma | Vê auditoria |
| Pessoa Delegada | Libera lotes por delegação do responsável técnico | Liberador e reprovador | |
| Autor | Elabora documentos | Autor | |
| Revisor | Revisa documentos | Revisor | |
| Aprovador | Aprova documentos | Aprovador e reprovador | |
| Responsável pela vigência | Torna o documento vigente | Liberador | |
| Administrador de documentos | Administra documentos | Autor | |
| Usuário de consulta | Só consulta | Nenhuma | |

**O que ainda não existe nesses perfis:** hoje só há funções de cadastro, acesso e assinatura. **As funções da cadeia do lote** (por exemplo, **conferente** e **autorizador** do recebimento, aprovador de pedido, função de estabilidade) **entram com a migração seguinte.** Por isso a matriz da seção 5 usa esses nomes como papéis futuros.

### 4.2 Os níveis da Garantia da Qualidade do sistema atual
No sistema atual, a GQ **não usa a função profissional**: usa o **Nível 1, 2 ou 3** do grupo de perfil (`funcoes-do-profissional.md`, seção 6). Pela decisão de 06/11/2026, **os níveis viram papéis da matriz**, e os perfis de teste acima já seguem essa ideia.

| Nível no sistema atual | Papel no banco | O que fazia no sistema atual |
|---|---|---|
| Nível 1 | **Qualquer usuário** (registra desvio, solicita mudança) e **Área envolvida** | Vê só o que é da sua área; solicita; não revisa nem avalia. |
| Nível 2 | **Analista da GQ** (assina como revisor) | Revisa o que lhe foi designado e avalia as áreas em que é responsável. |
| Nível 3 | **Gestor da GQ** (aprova, reprova e anula) | Libera avaliações e planos, define áreas, aprova produto. |

**Ponto para validar:** se o cliente quer essa divisão de dois papéis de decisão (Analista e Gestor) ou outra. A diferença que o sistema atual conferia só na tela passa a ser conferida pelo banco.

## 5. A matriz por módulo
**Como ler:** *Quem faz* é o papel proposto. *Quem não pode ser a mesma pessoa* é a segregação (seção 3). *Base na norma* mostra o artigo da RDC 658/2022 conferido no texto, ou diz que é proposta do iLabs. *O banco confere* é a trava que não pode depender da tela.

### 5.1 Principal
| Ação | Quem faz | Quem não pode ser a mesma pessoa | Base na norma | O banco confere |
|---|---|---|---|---|
| Criar e alterar perfis e permissões | Administrador do sistema, que **não aprova nada na Qualidade** (a validar) | Ninguém muda o próprio perfil | Arts. 124 e 125; Guia 33, item 11.12 | Toda gravação confere função e ação; histórico com antes, depois e motivo |
| Convidar, inativar e reativar usuários | Administrador | Ninguém inativa a si mesmo | Guia 33, item 11.12 | Convite por link que expira; a senha nunca aparece; inativar encerra as sessões |
| Cadastrar profissional e suas funções | Administrador | — | Arts. 124 e 125 | A função vale em toda gravação dos outros módulos |
| Cadastrar empresa, material, equipamento, locais | Quem tem a função de cadastro (Estoque, Qualidade ou Compras) | — | Arts. 110, 157, 159 e 179 | Só o ativo é oferecido; nada se exclui |
| Consultar histórico e registro de acessos | Administrador e Garantia da Qualidade, só leitura | Ninguém altera nem apaga | Guia 33, itens 9.8.1.3.9 e 11.14 | Gatilho do banco; registro imutável |
| Assinar (aprovar, reprovar, liberar, anular) | Quem tem a função da ação, com 2FA | — | Arts. 124 e 125 | Senha conferida de novo; significado, data e hora gravados |

### 5.2 Estoque
| Ação | Quem faz | Quem não pode ser a mesma pessoa | Base na norma | O banco confere |
|---|---|---|---|---|
| Registrar o recebimento | Estoque | — | Arts. 157 e 179 | Fornecedor qualificado para o material; lote e validade obrigatórios |
| Conferir o recebimento | Conferente | Quem registrou o recebimento | Arts. 124 e 125; separação é proposta | Função conferida na gravação; diferente de quem cadastrou |
| Autorizar o recebimento | Autorizador | Quem conferiu | Proposta do iLabs; art. 8º, XV trata da certificação do lote | Função própria, conferida na gravação; assinatura |
| Pedir material | Produção, Qualidade ou outro setor | — | Art. 137 (registro de produção do lote); a origem na ordem de produção é proposta | Almoxarifado do grupo de quem pede; tipo Produção só nasce da ordem |
| Aprovar o pedido | Aprovador, do grupo do almoxarifado | Quem pediu | Decisão de 05/11/2026 | Conferido na gravação; decisão assinada; cancelar exige justificativa |
| Separar o lote | Estoque | — | Arts. 159 e 189 | Só lote disponível e dentro da validade; o que vence primeiro é sugerido, não obrigatório; a justificativa da escolha é parâmetro |
| Pesar o material | Estoque, com treinamento em dia | — | Arts. 110 e 160 | Balança calibrada; soma dos volumes confere |
| Movimentar entre endereços e estornar | Estoque; estorno só por função própria | — | Arts. 125 e 159 | Uma só transação; estorno com motivo e assinatura; nada se apaga |
| Dar destino ao lote reprovado | Estoque e Qualidade | — | Arts. 124, 125 e 189 | Só refugo; destino final registrado e assinado |
| Revalidar a validade de um lote | Estoque pede; Qualidade conclui | — | Art. 189 | A validade só muda com laudo |
| Dar saída de amostra antes do prazo de guarda | Qualidade | — | IN 139/2022, arts. 10 e 11 (lida só pela orientação da ANVISA); art. 14, VIII | Exige justificativa assinada pela Qualidade |
| Qualificar o fornecedor | Garantia da Qualidade | Quem avaliou | Arts. 179 e 8º, VI | Decisão com validade e assinatura; histórico de cada decisão |

### 5.3 Controle da Qualidade
| Ação | Quem faz | Quem não pode ser a mesma pessoa | Base na norma | O banco confere |
|---|---|---|---|---|
| Cadastrar as regras de amostragem e de análise | Controle da Qualidade | — | Art. 247; art. 14, I | Uma regra ativa por material e tipo de análise; limites coerentes |
| Aprovar a versão da regra | Chefe do Controle da Qualidade | A validar se pode ser quem escreveu | Art. 119 | Só vale depois de aprovada; a análise guarda a versão usada |
| Registrar a amostragem | Amostrador, com função conferida | O verificador | Art. 247 | Função conferida na gravação; datas não futuras; baixa do saldo |
| Programar a análise | Controle da Qualidade; analista com a função | — | Arts. 12 e 14 | Analista treinado no método; solicitação cancelada não se programa |
| Digitar os resultados | Só o analista programado | — | Arts. 110, 124 e 245 | Fora do limite abre investigação, com observação obrigatória |
| Decidir e emitir o laudo | Chefe do Controle da Qualidade (revisor do laudo) | Quem digitou ensaio | Arts. 125 e 189; segregação é proposta | Função conferida na gravação; reprovar exige motivo; o laudo muda a situação do lote |
| Abrir e acompanhar a estabilidade | Função de estabilidade | — | Arts. 275 a 277 | Só abre com protocolo aprovado |
| Interromper ou concluir o estudo de estabilidade | Função de estabilidade e Qualidade | Segunda assinatura na conclusão (parâmetro) | Arts. 125 e 276 | Interromper com análise pendente é recusado; não conclui aprovado com laudo reprovado |
| Aprovar laudo de água ou de ambiente | Quem tem a função de aprovar | O analista | Arts. 198 e 245 | Acima do limite de ação abre desvio |
| Liberar o ponto de água ou a sala na Produção | A Produção só consulta; o dono do dado é o CQ | — | Decisão de 02/11/2026 | Exige laudo aprovado e dentro do prazo |

### 5.4 Garantia da Qualidade
| Ação | Quem faz | Quem não pode ser a mesma pessoa | Base na norma | O banco confere |
|---|---|---|---|---|
| Solicitar uma mudança | Qualquer usuário (equivalente ao Nível 1 em diante) | — | Art. 8º, XII | Só vê as da sua área |
| Revisar a solicitação | Analista da GQ designado (equivalente ao Nível 2) | Quem é só solicitante não revisa | Art. 8º, XII; art. 125 | Aceitar ou não aceitar com motivo assinado |
| Avaliar a mudança pela área | Responsável da área escolhida | Quem não é da área | Art. 8º, XII | Parecer imutável depois de gravado; nova versão com justificativa |
| Liberar a avaliação e finalizar o plano | Gestor da GQ (equivalente ao Nível 3) | — | Art. 8º, XII e XIII | Só com todas as áreas avaliadas; "não aceito" impede aprovar (exceção por parâmetro) |
| Aprovar o plano de ação | Gestor da GQ | Quem escreveu o plano | Decisão de 05/11/2026 | Aprovação antes de executar |
| Executar uma ação do plano | Responsável da ação | Quem é de outra área | Art. 8º, XII e XIII | Só o responsável conclui; data não futura |
| Registrar um desvio | Qualquer área | — | Art. 332 | Número sequencial; data do servidor; lote ligado ao desvio |
| Avaliar o desvio pela área | Quem é da área envolvida | Quem não é da área | Art. 332, V | Conferido na gravação; parecer com conteúdo |
| Aprovar e monitorar a ação corretiva e a preventiva | Gestor da GQ | Quem escreveu o plano | Art. 341; decisão de 05/11/2026 | Só aprova com ações concluídas; eficácia provada |
| Liberar um lote retido por desvio | Qualidade, com assinatura | — | Art. 332, II; art. 8º, XV | Só depois da contenção ou da conclusão |
| Aprovar o programa de treinamento | Responsável da Produção ou do CQ, conforme a área | — | Art. 42 | Aprovação antes da turma |
| Concluir o treinamento | Instrutor designado | Quem não é o instrutor | Arts. 41 e 43 | Nota e presença; ausente não fica suficiente; assinatura |
| Programar e responder a autoinspeção | Inspetor designado | Quem é da área auditada | Arts. 363 e 364 | Independência conferida pelo banco |
| Enviar o pedido de registro à ANVISA | Assuntos Regulatórios | — | Art. 125; RDC 753/2022 (lida só na tradução) | Só com todos os documentos do check-list concluídos |

### 5.5 Controle de Documentos
| Ação | Quem faz | Quem não pode ser a mesma pessoa | Base na norma | O banco confere |
|---|---|---|---|---|
| Definir o tipo de documento | Qualidade documental | — | Art. 119 | Caminho com ao menos uma aprovação |
| Incluir o documento | Autor | — | Art. 119, §1º | Anexo, revisor e aplicação obrigatórios |
| Revisar (análise crítica) | Setor revisor | — | Art. 119 | Decisão com senha; devolver volta ao autor |
| Pré-aprovar | Aprovador inicial | O autor | Art. 119; decisão de 05/11/2026 | Anexo final obrigatório |
| Aprovar | Aprovador final | O autor e quem pré-aprovou | Art. 119; decisão de 05/11/2026 | Conferido na gravação; senha e assinatura |
| Pôr em vigor | Quem tem a função | — | Art. 119, §2º | Emissão e validade calculadas pelo sistema; treinamento em dia (parâmetro) |
| Abrir nova revisão | Autor | — | Art. 121 | Só de documento vigente; os dois ficam ligados |
| Obsoletar | Quem tem a função própria | — | Art. 121 | Justificativa obrigatória; recolhe as cópias |
| Pedir, imprimir e recolher cópias controladas | Qualidade documental; o setor dá a baixa | — | Art. 121, parágrafo único | Só de documento vigente; baixa assinada |
| Aceitar um documento externo | Quem tem a função | — | Art. 119 | Análise de aceitação antes do uso |
| Cadastrar um documento legado | Só a Qualidade, com senha | — | Art. 125 | Original assinado anexado; marcado como legado |
| Consultar | Todos | — | Art. 121 | Só o vigente, da aplicação do usuário |

## 6. Pontos para validar (quando houver cliente)
1. **Nomes e número de papéis:** o catálogo de funções é da empresa; os papéis acima são exemplos.
2. **Níveis da GQ:** manter a divisão do banco (Qualquer usuário, Analista da GQ e Gestor da GQ) ou outra.
3. **Empresa pequena:** a regra de que ninguém aprova o que elaborou continua valendo com poucas pessoas? Se houver exceção, deve ser parâmetro com assinatura da Qualidade. **Não decidido.**
4. **2FA para administradores:** hoje só para quem aprova; incluir os administradores é recomendação a validar.
5. **Aprovação da versão da regra do CQ:** pode ser quem escreveu? **Não decidido.**
6. **Administrador sem poder de aprovar:** numa empresa nova com uma só pessoa, ninguém aprova até existir um segundo perfil com a função de aprovar. Está assim no banco; validar com a Qualidade.
7. **Funções da cadeia do lote** (conferente, autorizador, aprovador de pedido, função de estabilidade): ainda não existem nos perfis de teste; confirmar os nomes e quem as ocupa.
8. **Tipo de revisão no Controle de Documentos:** ciclo completo para todos os tipos (padrão) ou ciclo básico para algum tipo, por decisão do cliente.

## 7. Limites
- O que vem do **sistema atual** foi lido do código do LabMedSys e **não foi testado tela a tela** aqui. Os nomes de função com números (34, 39, 41, 48, 71) vêm do código e estão em [Funções do profissional](funcoes-do-profissional.md).
- A coluna **"Base na norma"** cita artigos da RDC 658/2022 conferidos no texto (tradução oficial em inglês). Onde diz "proposta do iLabs", **a norma não exige** o que está escrito; é escolha de desenho a validar.
- A IN 139/2022 e a RDC 753/2022 foram lidas só pela orientação da ANVISA e pela tradução, respectivamente.
- **Nenhuma regra foi validada** por quem opera uma fábrica de medicamentos.
