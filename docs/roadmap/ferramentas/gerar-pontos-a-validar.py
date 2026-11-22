#!/usr/bin/env python3
"""Junta a seção "Pontos a validar com a área" de cada ficha de fluxo em docs/roadmap/pontos-a-validar.md.
Uso (a partir da pasta docs/roadmap): python3 ferramentas/gerar-pontos-a-validar.py
Refazer sempre que uma ficha mudar; o arquivo gerado não se edita à mão."""
import glob
import re
from datetime import date

AREAS = [
    ("Estoque", "Estoque e Compras (com a Qualidade quando tocar a liberação do lote)"),
    ("Controle da Qualidade", "Controle da Qualidade"),
    ("Garantia da Qualidade", "Garantia da Qualidade"),
    ("Controle de Documentos", "Garantia da Qualidade (controle de documentos)"),
    ("Produção", "Produção (com a Qualidade)"),
    ("Comercial", "Comercial (com a Qualidade e Assuntos Regulatórios)"),
    ("Rastreabilidade", "Assuntos Regulatórios"),
    ("OPE", "Produção e Garantia da Qualidade"),
]
ARQUIVOS = {  # ficha -> (módulo, código, título)
    "fluxo-01-recebimento-quarentena.md": ("Estoque", "1", "Recebimento e quarentena"),
    "fluxo-02-compras-e-fornecedor.md": ("Estoque", "2", "Compras e fornecedor"),
    "fluxo-04-reprovado-reanalise-revalidacao.md": ("Estoque", "4", "Reprovado, reanálise e revalidação"),
    "fluxo-05-movimentacao-interna.md": ("Estoque", "5", "Movimentação interna"),
    "fluxo-06-solicitacao-separacao-atendimento.md": ("Estoque", "6", "Pedir, separar e entregar o material"),
    "fluxo-07-almoxarifado-cq.md": ("Estoque", "7", "Guardar as amostras do CQ"),
    "fluxo-08-devolucao-e-entradas.md": ("Estoque", "8", "Devolução e entradas"),
    "fluxo-09-remessa-e-expedicao.md": ("Estoque", "9", "Remessa e expedição"),
    "fluxo-10-inventario.md": ("Estoque", "10", "Inventário"),
    "fluxo-03-regras-analise-e-laudo.md": ("Controle da Qualidade", "3", "Regras de amostragem, análise e laudo"),
    "fluxo-11a-agua-e-ambiente.md": ("Controle da Qualidade", "11a", "Água e ambiente"),
    "fluxo-11b-estabilidade.md": ("Controle da Qualidade", "11b", "Estabilidade"),
    "fluxo-13a-treinamento.md": ("Garantia da Qualidade", "13a", "Treinamento"),
    "fluxo-13b-desvios-e-capa.md": ("Garantia da Qualidade", "13b", "Desvios e CAPA"),
    "fluxo-13c-controle-de-mudancas.md": ("Garantia da Qualidade", "13c", "Controle de mudanças"),
    "fluxo-13d-autoinspecao-e-auditoria.md": ("Garantia da Qualidade", "13d", "Autoinspeção e auditoria"),
    "fluxo-13e-assuntos-regulatorios.md": ("Garantia da Qualidade", "13e", "Assuntos regulatórios"),
    "fluxo-12a-ciclo-do-documento.md": ("Controle de Documentos", "12a", "Ciclo do documento"),
    "fluxo-12b-copias-externo-legado.md": ("Controle de Documentos", "12b", "Cópias, documento externo e legado"),
    "fluxo-14a-preparacao.md": ("Produção", "14a", "Preparação"),
    "fluxo-14b-produto-formula-ordem.md": ("Produção", "14b", "Produto, fórmula e ordem"),
    "fluxo-14c-autorizacao-inicio-final.md": ("Produção", "14c", "Autorização, início e final"),
    "fluxo-14d-registro-de-lote.md": ("Produção", "14d", "Registro de lote"),
    "fluxo-14e-terceirizacao-validade.md": ("Produção", "14e", "Terceirização e validade da ordem de produção"),
    "fluxo-15a-cliente-e-cadastros.md": ("Comercial", "15a", "Cliente e cadastros de venda"),
    "fluxo-15b-cotacao-requisicao-reserva.md": ("Comercial", "15b", "Cotação, requisição e reserva"),
    "fluxo-15c-fatura-remessa-cancelamento.md": ("Comercial", "15c", "Fatura, remessa e cancelamento"),
    "fluxo-16a-ium-e-agregacao.md": ("Rastreabilidade", "16a", "Identificação da embalagem e agregação"),
    "fluxo-16b-eventos-e-declaracao.md": ("Rastreabilidade", "16b", "Mapa de distribuição e declaração de eventos"),
    "fluxo-17-montagem-do-modelo.md": ("OPE", "17", "Montagem do modelo do registro de lote"),
}

def pontos(arquivo):
    t = open(arquivo, encoding="utf-8").read()
    m = re.search(r"^## \d+\. Pontos a validar[^\n]*\n(.*)", t, re.S | re.M)
    if not m:
        raise SystemExit(f"Sem seção de pontos a validar em {arquivo}")
    corpo = m.group(1)
    prox = re.search(r"^## ", corpo, re.M)
    if prox:
        corpo = corpo[: prox.start()]
    return re.findall(r"^\d+\.\s+(.*)$", corpo, re.M)

dados = {}
for arq, (modulo, cod, titulo) in ARQUIVOS.items():
    dados[arq] = pontos(arq)
total = sum(len(v) for v in dados.values())
ficheiros = set(glob.glob("fluxo-*.md"))
if ficheiros != set(ARQUIVOS):
    raise SystemExit(f"Fichas fora da lista: {sorted(ficheiros ^ set(ARQUIVOS))}")

L = []
L.append("# Pontos a validar: todas as perguntas das fichas, por área\n")
L.append(f"**Reunidos em {date.today().strftime('%d/%m/%Y')}, de forma automática, a partir da seção \"Pontos a validar com a área\" de cada uma das {len(ARQUIVOS)} fichas de fluxo.** São **{total} perguntas**. Este documento **não tem conteúdo novo**: serve para levar às reuniões, uma área por vez. Quem responde cada grupo está indicado no título. Cada pergunta tem um código (por exemplo `14d-3` = ficha 14d, pergunta 3) para você anotar a resposta no chat e eu atualizar a ficha.\n")
L.append("> **Atenção (decisão de 22/11/2026):** **não há áreas da empresa para consultar** (o sistema é feito para um cliente futuro). Por isso esta lista serve para **a implantação com o cliente**; enquanto isso, valem as **propostas** do documento \"Como decidir quando não há área para perguntar\". Quem responde cada grupo (títulos abaixo) é o **papel que o cliente terá**.\n")
L.append("## Resumo por área\n")
L.append("| Quem responde | Fichas | Perguntas |\n|---|---|---|")
for mod, quem in AREAS:
    fs = [a for a, v in ARQUIVOS.items() if v[0] == mod]
    L.append(f"| {quem} | {len(fs)} | {sum(len(dados[a]) for a in fs)} |")
L.append(f"| **Total** | **{len(ARQUIVOS)}** | **{total}** |\n")
L.append("## Antes das reuniões: textos que precisamos pedir à Qualidade\n")
L.append("Várias perguntas dependem de documentos que **não estão no repositório**. Sem eles, a resposta fica em aberto:\n")
L.append("1. **Lei 11.903/2009 (com a Lei 14.338/2022) e a regulamentação do SNCM** (identificador único de medicamento e declaração à ANVISA): fichas 16a e 16b. **Lido em 22/11/2026: a Lei 14.338/2022 mudou o modelo (mapa de distribuição por lote e destinatário) e a RDC 157/2017 consta como revogada; falta conferir o ato revogador e ler eventual regulamentação do mapa.**")
L.append("2. **RDC 430/2020** (Boas Práticas de Distribuição): licença sanitária e responsável técnico do cliente, ficha 15a.")
L.append("3. **Instrução normativa das amostras de retenção e de referência** (prazo e quantidade de guarda): ficha 7.")
L.append("4. **Norma de registro de medicamentos** (texto que proíbe vender sem registro válido e prazos de revalidação): ficha 13e.")
L.append("5. **Farmacopeia e normas específicas** (limites de água e de ambiente): ficha 11a.")
L.append("6. **Regulamento de estabilidade** (condições padronizadas dos estudos): ficha 11b.")
L.append("\nA lista vem do documento \"O que a norma diz\", seção final, e das fichas 15a, 16a e 16b.\n")
for mod, quem in AREAS:
    L.append(f"## {mod}: responde {quem}\n")
    for arq, (m, cod, titulo) in ARQUIVOS.items():
        if m != mod:
            continue
        L.append(f"### Ficha {cod} · {titulo}\n")
        for i, p in enumerate(dados[arq], 1):
            L.append(f"- **{cod}-{i}** {p}")
        L.append("")
open("pontos-a-validar.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print(f"{total} perguntas de {len(ARQUIVOS)} fichas")

# ---- Pauta da reunião com a Qualidade (mesma fonte: as perguntas das fichas) ----
def bloco(modulo):
    saida = []
    for arq, (m, cod, titulo) in ARQUIVOS.items():
        if m != modulo:
            continue
        saida.append(f"### Ficha {cod} · {titulo}\n")
        for i, p in enumerate(dados[arq], 1):
            saida.append(f"- **{cod}-{i}** {p}")
        saida.append("")
    return saida

n_docs = sum(len(dados[a]) for a, v in ARQUIVOS.items() if v[0] == "Controle de Documentos")
n_cq = sum(len(dados[a]) for a, v in ARQUIVOS.items() if v[0] == "Controle da Qualidade")
n_gq = sum(len(dados[a]) for a, v in ARQUIVOS.items() if v[0] == "Garantia da Qualidade")
P = []
P.append("# Pauta das reuniões com a Qualidade\n")
P.append(f"**Montada em {date.today().strftime('%d/%m/%Y')}, em parte de forma automática, a partir das fichas de fluxo.** Para quem conduz as reuniões: a Qualidade concentra {n_docs + n_cq + n_gq} das {total} perguntas das fichas e os textos de norma que faltam. Proponho **três reuniões**, para não cansar.\n")
P.append("> **Atenção (22/11/2026):** não há, hoje, pessoas da empresa para essas reuniões. **Use esta pauta na implantação com o cliente.** Enquanto isso, valem as propostas de \"Como decidir quando não há área para perguntar\".\n")
P.append("> **Objetivo:** sair de cada reunião com (a) as **decisões** que a norma deixa para a empresa, (b) os **textos** que precisamos, e (c) a **resposta de cada pergunta** pelo código (por exemplo `13a-3`). Resposta sem dono ou sem data fica como \"ponto para validar\".\n")
P.append("## Quem convidar\n")
P.append("- **Responsável pela Qualidade** (ou quem responde pela Garantia da Qualidade).")
P.append("- **Pessoa Delegada** (a que certifica o lote para venda), se já houver.")
P.append("- **Responsável pelo Controle da Qualidade** e **Responsável pela Produção** (aprovam treinamento e instruções, pelos arts. 41 a 43 da RDC 658/2022).")
P.append("- **Assuntos Regulatórios**, para os blocos de registro do produto, número único (SNCM) e documentos externos.")
P.append("- Quem **anota**: o responsável pelo estudo, com este documento aberto.\n")
P.append("## Como registrar\n")
P.append("Para cada pergunta, anote: **a resposta**, **quem respondeu** e **a data**. Depois me passe pelo chat, com o código (`13a-3: o treinamento vale por tarefa, resposta da Qualidade, 25/11`). Eu atualizo a ficha, refaço a lista de pontos a validar e marco o que virou decisão.\n")
P.append("## Resumo das três reuniões\n")
P.append("| Reunião | Conteúdo | Perguntas | Tempo sugerido |\n|---|---|---|---|")
P.append(f"| **1** | Decisões da empresa, textos de norma e Controle de Documentos | 8 decisões + 6 textos + {n_docs} | 1h30 |")
P.append(f"| **2** | Controle da Qualidade | {n_cq} | 1h30 |")
P.append(f"| **3** | Garantia da Qualidade | {n_gq} | 2h (ou duas reuniões de 1h) |\n")
P.append("## Reunião 1 · Decisões, textos e Controle de Documentos\n")
P.append("### 1.1 Decisões que a norma **deixa para a empresa** (30 min)\n")
P.append("A RDC 658/2022 exige o resultado, mas **não fixa** o número, o prazo ou o nome. O sistema só consegue conferir o que a empresa **decidir e escrever**:\n")
P.append("1. **Nota mínima** que torna o treinamento \"suficiente\" (e se treinamento vencido **bloqueia** ou só avisa).")
P.append("2. **Prazo** para verificar a **eficácia** de uma ação corretiva (CAPA) e de uma mudança (por exemplo, 30 ou 90 dias).")
P.append("3. O que conta como **auditor independente** (qualquer pessoa de fora da área auditada? só o responsável?) e se há **coordenador**.")
P.append("4. **Frequências**: coleta de água e ambiente, autoinspeção, revisão de documentos.")
P.append("5. O critério **\"primeiro que vence, primeiro que sai\"** é obrigatório no Estoque?")
P.append("6. **Separação de funções** (quem conta ≠ quem apura; quem escreve ≠ quem aprova; quem pede ≠ quem aprova).")
P.append("7. Lista do que é **mudança significativa** (exige validação).")
P.append("8. **Quem é a Pessoa Delegada** e se ela pertence ao CQ ou à GQ.\n")
P.append("### 1.2 Textos de norma que precisamos (10 min)\n")
P.append("1. **Lei 11.903/2009 e a regulamentação do SNCM** (identificador único e declaração à ANVISA).")
P.append("2. **RDC 430/2020** (Boas Práticas de Distribuição).")
P.append("3. **Instrução normativa das amostras de retenção e de referência.**")
P.append("4. **Norma de registro de medicamentos.**")
P.append("5. **Farmacopeia e normas de água e ambiente.**")
P.append("6. **Regulamento de estabilidade.**\n")
P.append(f"### 1.3 Perguntas do Controle de Documentos ({n_docs}, 50 min)\n")
P += bloco("Controle de Documentos")
P.append("## Reunião 2 · Controle da Qualidade\n")
P.append(f"Total: **{n_cq} perguntas** nas fichas de regras de amostragem e laudo, água e ambiente e estabilidade.\n")
P += bloco("Controle da Qualidade")
P.append("## Reunião 3 · Garantia da Qualidade\n")
P.append(f"Total: **{n_gq} perguntas** nas fichas de treinamento, desvios e CAPA, mudanças, autoinspeção e assuntos regulatórios. Se o tempo apertar, deixe **Assuntos Regulatórios (13e)** para uma conversa própria com a área regulatória.\n")
P += bloco("Garantia da Qualidade")
P.append("## Depois das reuniões\n")
P.append("1. Passar as respostas pelo chat, com o código de cada pergunta.")
P.append("2. A ficha é atualizada e a lista de pontos a validar é refeita.")
P.append("3. O que virou decisão entra no roteiro de implantação.")
P.append("4. O que continuar sem resposta volta como pendência para a reunião seguinte.")
open("pauta-reuniao-qualidade.md", "w", encoding="utf-8").write("\n".join(P) + "\n")
print("pauta da Qualidade gerada")

# ---- Pautas das reuniões com as outras áreas (Estoque e Compras, Produção, Comercial, Assuntos Regulatórios) ----
OUTRAS = [
    {
        "modulos": ["Estoque"],
        "titulo": "Estoque e Compras",
        "convidados": [
            "Responsável pelo **Almoxarifado** e pelo **recebimento**.",
            "Responsável por **Compras** (cadastro e avaliação de fornecedores).",
            "Alguém do **Controle da Qualidade**, para os pontos de liberação do lote.",
        ],
        "decisoes": [
            "O critério **\"primeiro que vence, primeiro que sai\"** vale no Estoque? É obrigatório ou só sugerido?",
            "**Separação de funções** no inventário: quem conta é diferente de quem apura?",
            "**Fornecedor** só recebe pedido se estiver qualificado? Quem qualifica?",
        ],
        "textos": ["**Instrução normativa das amostras de retenção e de referência** (ficha 7)."],
    },
    {
        "modulos": ["Produção", "OPE"],
        "titulo": "Produção",
        "convidados": [
            "**Responsável pela Produção**.",
            "Quem **monta os modelos do registro de lote** hoje (a ferramenta OPE).",
            "Alguém da **Garantia da Qualidade**, para a certificação e a liberação do lote.",
        ],
        "decisoes": [
            "Quem é a **Pessoa Delegada** que certifica o lote, e ela certifica **antes** da venda?",
            "Quem **aprova** o modelo do registro de lote e **como** se muda um modelo com produção em andamento?",
            "A empresa **terceiriza** alguma etapa? Quem avalia o terceiro?",
        ],
        "textos": ["**Farmacopeia** e as especificações de cada produto (limites do registro de lote)."],
    },
    {
        "modulos": ["Comercial"],
        "titulo": "Comercial",
        "convidados": [
            "**Responsável pelo Comercial** e quem **fatura**.",
            "Alguém de **Assuntos Regulatórios**, para licença do cliente e recolhimento.",
            "Alguém da **Qualidade**, para a certificação do lote antes da venda.",
        ],
        "decisoes": [
            "**Validade mínima** exigida pelos clientes (por cliente, convênio ou compra pública).",
            "O cliente precisa ter **licença sanitária conferida** antes de comprar? Quem confere?",
            "Como se **consulta hoje** para quem foi um lote (recolhimento) e em quanto tempo?",
        ],
        "textos": ["**RDC 430/2020** (Boas Práticas de Distribuição)."],
    },
    {
        "modulos": ["Rastreabilidade"],
        "titulo": "Assuntos Regulatórios (Rastreabilidade)",
        "convidados": [
            "**Responsável por Assuntos Regulatórios**.",
            "Quem **declara à ANVISA** hoje (se existir outro sistema, planilha ou portal).",
            "**TI**, para o certificado digital.",
        ],
        "decisoes": [
            "A empresa **precisa declarar ao SNCM**? Quais eventos, desde quando, em que prazo?",
            "Qual é o **formato exigido do número único (IUM)** e quem é o titular do registro na etiqueta?",
            "Quem **guarda e renova o certificado digital**?",
        ],
        "textos": ["**Lei 11.903/2009 e a regulamentação do SNCM**."],
    },
]
Q = []
Q.append("# Pautas das reuniões com as outras áreas\n")
Q.append(f"**Montadas em {date.today().strftime('%d/%m/%Y')}, em parte de forma automática, a partir das fichas de fluxo.** Complementam a [pauta da Qualidade](pauta-reuniao-qualidade.md): aqui ficam as áreas que **operam** o dia a dia (Estoque e Compras, Produção, Comercial e Assuntos Regulatórios). Uma reunião por área, com as decisões que só ela toma, as perguntas das fichas e os textos que ela pode fornecer.\n")
Q.append("> **Atenção (22/11/2026):** não há, hoje, pessoas da empresa para essas reuniões. **Use estas pautas na implantação com o cliente.** Enquanto isso, valem as propostas de \"Como decidir quando não há área para perguntar\".\n")
Q.append("> **Como registrar:** igual à reunião da Qualidade. Para cada pergunta, a **resposta**, **quem respondeu** e a **data**; passe pelo chat com o código (por exemplo `15b-2: 90 dias de validade mínima, resposta do Comercial, 28/11`).\n")
Q.append("## Resumo\n")
Q.append("| Área | Fichas | Perguntas | Tempo sugerido |\n|---|---|---|---|")
for a in OUTRAS:
    fs = [x for x, v in ARQUIVOS.items() if v[0] in a["modulos"]]
    n = sum(len(dados[x]) for x in fs)
    minutos = 20 + 3 * n
    Q.append(f"| {a['titulo']} | {len(fs)} | {n} | {minutos // 60}h{minutos % 60:02d} |")
Q.append("\n*O tempo é estimativa minha: 20 minutos de abertura mais 3 minutos por pergunta. Estoque e Compras tem muitas perguntas: vale dividir em duas reuniões.*\n")
for a in OUTRAS:
    fs = [x for x, v in ARQUIVOS.items() if v[0] in a["modulos"]]
    Q.append(f"## {a['titulo']}\n")
    Q.append("### Quem convidar\n")
    for c in a["convidados"]:
        Q.append(f"- {c}")
    Q.append("\n### Decisões que só esta área toma (primeiros 20 minutos)\n")
    for i, d in enumerate(a["decisoes"], 1):
        Q.append(f"{i}. {d}")
    Q.append("\n### Texto de norma que esta área pode fornecer\n")
    for t in a["textos"]:
        Q.append(f"- {t}")
    Q.append("\n### Perguntas das fichas\n")
    for arq in ARQUIVOS:
        m, cod, titulo = ARQUIVOS[arq]
        if arq not in fs:
            continue
        Q.append(f"#### Ficha {cod} · {titulo}\n")
        for i, p in enumerate(dados[arq], 1):
            Q.append(f"- **{cod}-{i}** {p}")
        Q.append("")
open("pauta-reunioes-outras-areas.md", "w", encoding="utf-8").write("\n".join(Q) + "\n")
print("pautas das outras áreas geradas")
