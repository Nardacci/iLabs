# Resumo para a diretoria: o iLabs, os módulos e o que a ANVISA espera

**21/11/2026. Rascunho para validação do responsável. Leitura de 5 minutos, sem números de artigos.**

## O que é este estudo
Antes de construir o iLabs, analisamos **como o sistema atual (LabMedSys) funciona** e **o que a ANVISA espera de cada fase da fabricação**. Fizemos **30 fichas de fluxo** que cobrem todos os módulos. **Tudo vem da leitura do código do sistema atual e do texto da norma de Boas Práticas de Fabricação (RDC 658/2022) e do Guia 33/2020.** **Nada foi testado ainda nas telas** e as respostas da área ainda não foram colhidas: o que está aqui é **hipótese bem fundamentada**, e não fato confirmado.

## Para que serve cada módulo

| Módulo | Em uma frase | O que a ANVISA quer ver |
|---|---|---|
| **Principal** | Cadastros e acesso: quem é quem e quem pode o quê | Cada ação tem dono e fica registrada |
| **Estoque** | Recebe, guarda e entrega material e produto | Material usado estava liberado, no prazo e identificado |
| **Controle da Qualidade** | Analisa e decide se está bom | Resultado fora do limite é investigado |
| **Garantia da Qualidade** | Cuida do sistema: treinamento, desvios, mudanças, auditoria | O que deu errado e o que mudou foi tratado e avaliado |
| **Controle de Documentos** | Mantém as instruções escritas, com versão | A instrução em uso é a aprovada e vigente |
| **Produção** | Fabrica o lote e registra cada passo | Fabricação seguiu a fórmula, registro completo |
| **OPE** | Monta o formulário do registro de lote | Instruções de fabricação aprovadas e só mudam com aprovação |
| **Comercial** | Vende e registra para quem foi cada lote | Só se vende lote certificado, e dá para achar o cliente |
| **Rastreabilidade** | Dá um número a cada caixinha e declara à ANVISA | Dá para recolher só a caixa com problema |

**A ideia que une tudo:** o remédio tem de ser produzido de forma consistente, conforme o registro, com **regra escrita, pessoa treinada, registro rastreável e liberação do lote por uma pessoa responsável (a Pessoa Delegada)**. Cada módulo é uma peça dessa corrente.

## O que o estudo encontrou no sistema atual
Os módulos existem, mas **as ligações entre eles quase não funcionam**. Os pontos de maior risco, todos a confirmar em teste:

1. **O lote é vendido sem a certificação da Pessoa Delegada.** Nenhum módulo registra essa certificação antes da venda, e a norma a exige.
2. **A declaração à ANVISA não acontece.** O envio é simulado, a tela diz "enviado com sucesso" sem ter enviado, e não há certificado digital. **Atenção (confirmado no texto da lei):** em 2022 a lei **mudou o modelo**: o que ela exige hoje é um **mapa de distribuição por lote e destinatário**, e não a declaração de cada evento ao sistema central. A tela dizer "enviado" sem ter enviado continua sendo registro falso.
3. **O recolhimento de um lote é frágil.** O relatório que mostra para quem foi o lote fica fora do menu, exige período e esconde as vendas canceladas.
4. **As instruções de fabricação mudam sem aprovação nem histórico**, e um ajuste de texto pode apagar campos do registro de lote sem aviso.
5. **Um desvio não retém o lote**, e **o treinamento vencido não impede** a pessoa de executar a tarefa. Cada tela da qualidade é uma ilha.
6. **Defeitos de integridade de dados:** o mesmo número de série de embalagem pode se repetir; datas digitadas à mão em lugar de datas do sistema; registros alteráveis sem histórico.
7. **Sem separação de funções:** muitas vezes quem pede, confirma e aprova pode ser a mesma pessoa.

## O que o iLabs faz diferente
- **A regra mora no banco, não na tela:** o que a norma exige é conferido **em toda gravação**, e não depende de quem digita.
- **As ligações viram regra:** desvio retém o lote, treinamento bloqueia a tarefa, documento só entra em vigor com as pessoas treinadas, lote só é vendido se certificado.
- **Tudo fica registrado e não se apaga:** quem fez, o quê, quando e por quê.
- **Cada falha do sistema atual vira um requisito corrigido**, citando o achado de origem.

## O que precisamos para avançar

Não há hoje pessoas da empresa para consultar: o sistema foi comprado de um fornecedor que faliu e está sendo feito **para um cliente**. Por isso:

**Do responsável pelo projeto:** aprovar as **propostas de decisão** do documento "Como decidir quando não há área para perguntar" (o que a norma manda fica fixo; o que a norma deixa para a empresa vira **parâmetro configurável**, com o padrão mais rigoroso).

**Buscar nas fontes públicas da ANVISA e do Planalto**, para completar o estudo:
- Lei 11.903/2009 e a regulamentação do SNCM (número único da embalagem e declaração);
- Boas Práticas de Distribuição (RDC 430/2020);
- norma de registro de medicamentos;
- instrução normativa das amostras de retenção e referência;
- Farmacopeia e normas de água e ambiente;
- regulamento de estabilidade.

**Do cliente, na implantação:** indicar a **Pessoa Delegada** e os responsáveis pela Produção e pelo Controle da Qualidade, e **confirmar os parâmetros** (notas, prazos, frequências). As **219 perguntas** das fichas, reunidas em "Pontos a validar, por área", viram o roteiro dessa implantação.

## Próximos passos
1. **Classificar cada pergunta** das fichas (a norma manda, parâmetro da empresa, depende de texto, depende do cliente) e propor um padrão.
2. **Obter os textos públicos que faltam** e atualizar as fichas.
3. **Testar as telas do sistema atual** nos casos de maior risco para confirmar os achados.
4. **Começar a construção**, na ordem que o estudo definiu (cadastros globais primeiro).

## Ressalvas
- A leitura jurídica final é da Qualidade e da área regulatória. O estudo cita a norma, mas **não a interpreta como parecer**.
- Onde a norma deixa a decisão para a empresa (por exemplo, a nota mínima de um treinamento), o estudo **não decide**: leva a pergunta para a área.
