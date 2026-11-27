#!/usr/bin/env python3
"""Monta o documento Word único do estudo do roadmap a partir de docs/roadmap/*.md.

Reaproveita o gerador de Word e o modelo visual do repositório do LabMedSys (capa, histórico, acrônimos, títulos
numerados em caixa cinza, tabelas com cabeçalho cinza e rodapé), SEM alterá-los: importa o gerador e troca a identidade
para iLabs. Os nomes das pessoas do modelo (tabela "Envolvidos" e metadados) não são levados para o documento.

Passos (a partir da pasta docs/roadmap):
  1. Extrair os diagramas de situação das fichas (blocos mermaid):
       python3 ferramentas/montar-word.py --extrair-estados /tmp/estados
  2. Transformá-los em imagens (mesmo renderizador dos fluxos, apontando para a outra pasta):
       cd ferramentas && PASTA_MMD=/tmp/estados MERMAID_JS=<mermaid.min.js> PLAYWRIGHT_DIR=<pasta do playwright> node renderizar-diagramas.mjs
  2b. (opcional) Exportar as telas de exemplo do site para Markdown:
       node ferramentas/exportar-praticas.mjs /tmp/praticas.md
  3. Montar o Word (acrescente --praticas /tmp/praticas.md para incluir as telas de exemplo):
       python3 ferramentas/montar-word.py --modelo "<modelo .docx do legado>" --gerador "<gerar_docx.py do legado>" \
           --estados /tmp/estados --saida "/tmp/iLabs - Estudo do roadmap.docx"
O arquivo .docx (cerca de 10 MB) não vai para o git: é gerado a cada vez a partir dos .md e do modelo do legado.
Ao abrir no Word, ele pergunta se atualiza os campos: responda Sim, para montar o sumário.

O documento é gerado; para mudar o conteúdo, edite os .md e gere de novo.

Documento de um módulo (exemplo, Garantia da Qualidade): acrescente `--modulo gq --titulo-doc "Garantia da Qualidade" --sigla GQ`
e exporte as telas de exemplo só do módulo: node ferramentas/exportar-praticas.mjs /tmp/praticas-gq.md "Garantia da Qualidade".
"""
import argparse
import importlib.util
import os
import re
import tempfile
import zipfile
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]  # raiz do repositório iLabs
PASTA = RAIZ / "docs" / "roadmap"

ACRONIMOS_ILABS = [
    ("A, B, C, D", "Tipos da classificação das perguntas", "A: a norma manda · B: parâmetro da empresa · C: depende de texto que falta · D: depende do cliente ou do desenho"),
    ("CQ", "Controle da Qualidade", "Área que analisa material e produto e emite o laudo"),
    ("GQ", "Garantia da Qualidade", "Área que cuida do sistema da qualidade: treinamento, desvios, mudanças, auditoria e registro do produto"),
    ("OPE", "Modelo do registro de lote / ordem de produção", "No Gerador, o modelo do caderno do lote; na Produção, a ordem de produção de um lote (os dois usam o mesmo nome no legado)"),
    ("IUM", "Identificador Único de Medicamento", "Número por embalagem do modelo antigo (RDC 157/2017, que consta como revogada)"),
    ("SNCM", "Sistema Nacional de Controle de Medicamentos", "Sistema criado pela Lei 11.903/2009"),
    ("GTIN", "Global Trade Item Number", "Código de barras do produto"),
    ("UDI", "Unique Device Identification", "Identificação única de dispositivos médicos"),
    ("DOU", "Diário Oficial da União", "Publicação oficial das normas"),
    ("DV", "Desvio (defeito do legado)", "Defeito encontrado nos testes do LabMedSys, identificado como DV-módulo-nnn"),
    ("RN", "Regra de Negócio", "Regra extraída do código do LabMedSys e citada nas fichas (RN001...)"),
    ("CT", "Caso de Teste", "Teste com passos e resultado esperado, identificado como CT-módulo-nnn"),
    ("RLS", "Row Level Security", "Isolamento dos dados de cada empresa no banco de dados"),
    ("Pessoa Delegada", "Pessoa Delegada pelo Sistema de Gestão da Qualidade Farmacêutica", "Pessoa que certifica cada lote antes da venda (RDC 658/2022)"),
]

INTRO = """# Como ler este documento

!!! Para quem é
Este documento é do **analista de negócios** que conduz o estudo. Reúne, em um só arquivo, **o que o sistema atual (LabMedSys) faz hoje**, **o que a norma da ANVISA exige** e **o que o iLabs precisa fazer**.

!!! Como está organizado
- **Guia do analista:** o resumo, módulo por módulo (hoje, a norma espera, o iLabs deve).
- **Matriz de permissões do iLabs** e **Segurança e acesso**: quem pode o quê, quem não pode ser a mesma pessoa e onde o banco confere.
- **Situação da norma:** os textos oficiais lidos e os que ainda faltam.
- **Os módulos e a ANVISA**, **a Garantia da Qualidade e os outros módulos**, **os cadastros globais** e **os fluxos do legado**.
- **As telas de exemplo** (Principal, Estoque, Controle da Qualidade, Garantia da Qualidade e Controle de Documentos): a teoria aplicada passo a passo, com a base na norma e as integrações.
- **As 30 fichas de fluxo**, agrupadas por módulo, cada uma com o diagrama, a tabela etapa a etapa e os pontos a decidir.
- **Como decidimos sem área para perguntar** e **a classificação das 219 perguntas**, com a proposta para cada uma.
- **O roteiro de implantação** e os **anexos** (glossário, o que a norma diz, decisões registradas).

!!! Como ler as fichas
Cada ficha tem uma imagem do fluxo no alto (laranja: o sistema confere; vermelho: bloqueio; verde: resultado), uma caixa "Em uma frase", a tabela etapa a etapa (com a coluna "Falha do legado"), o que o fluxo exige de cada cadastro e os pontos a decidir.

!!! Limites
- O que vem do **código do LabMedSys** não foi testado na tela, exceto onde há código de defeito (`DV-...`), que vem dos testes do legado.
- As **propostas** do iLabs **não foram validadas** por quem opera uma fábrica de medicamentos. Onde a norma deixa a escolha para a empresa, a proposta é um **parâmetro configurável**, e o cliente confirma na implantação.
- Foram lidos os artigos citados da RDC 658/2022, não a norma inteira. Os textos que faltam estão listados em "Situação da norma".
- Este arquivo é **gerado** a partir dos documentos do estudo (`docs/roadmap/*.md`): para mudar o conteúdo, mude esses documentos e gere de novo.
"""


def carregar_modulo(caminho, nome):
    spec = importlib.util.spec_from_file_location(nome, caminho)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def ler_ficha_arquivos():
    """Lista (arquivo, módulo, código, título) na ordem do estudo, a partir do gerador de pontos a validar."""
    src = (PASTA / "ferramentas" / "gerar-pontos-a-validar.py").read_text(encoding="utf-8")
    ini, fim = src.index("AREAS = ["), src.index("def pontos")
    ns = {}
    exec(src[ini:fim], {}, ns)
    return [(a, m, c, t) for a, (m, c, t) in ns["ARQUIVOS"].items()]


def tabelas_largas(linhas):
    """Tabela com mais de 5 colunas vira blocos: um título por linha e uma tabela de 2 colunas (cabe na página)."""
    cel = lambda l: [c.strip() for c in l.strip().strip("|").split("|")]
    corpo = [cel(l) for l in linhas if not re.fullmatch(r"\|[\s:|-]+\|?", l.strip())]
    cab, dados = corpo[0], corpo[1:]
    if len(cab) <= 5:
        return linhas
    saida = []
    for linha in dados:
        linha = linha + [""] * (len(cab) - len(linha))
        if cab[0] in ("#", "Código", "Ordem") and len(cab) > 2:
            titulo, inicio = f"{linha[0]} · {linha[1]}", 2
        else:
            titulo, inicio = linha[0], 1
        saida.append("")
        saida.append(f"!!! {titulo}")
        saida.append("| Campo | Conteúdo |")
        saida.append("|---|---|")
        for j in range(inicio, len(cab)):
            saida.append(f"| **{cab[j]}** | {linha[j]} |")
        saida.append("")
    return saida


def normalizar(md, deslocar, estados_dir=None, stem=""):
    """Prepara o Markdown do estudo para o gerador de Word (que aceita só um subconjunto)."""
    saida, tab, em_mermaid, idx_mermaid = [], [], False, 0
    primeiro_h1 = True

    def fecha_tab():
        if tab:
            saida.extend(tabelas_largas(tab))
            tab.clear()

    for bruta in md.splitlines():
        linha = bruta.rstrip()
        if linha.strip().startswith("```"):
            fecha_tab()
            if not em_mermaid and linha.strip() == "```mermaid":
                em_mermaid = True
                idx_mermaid += 1
                if estados_dir:
                    png = Path(estados_dir) / f"{stem}-estados{idx_mermaid}.png"
                    if png.exists():
                        saida.append(f"![Situações possíveis, em diagrama]({png})")
            else:
                em_mermaid = False
            continue
        if em_mermaid:
            continue
        if linha.startswith("|"):
            tab.append(linha)
            continue
        fecha_tab()
        linha = re.sub(r"^>\s?", "", linha)  # citação vira parágrafo comum
        linha = linha.replace("~~", "")
        linha = linha.replace('documento "Glossário" (grupo "Para começar" da lista do estudo)', "Anexo A (Glossário) deste documento")
        linha = re.sub(r"!\[([^\]]*)\]\(diagramas/([^)]+)\)", r"![\1](docs/roadmap/diagramas/\2)", linha)
        if re.fullmatch(r"\*[^*].*\*", linha.strip()) and "**" in linha:
            linha = linha.strip()[1:-1]  # itálico com negrito dentro: tira o itálico externo
        m = re.match(r"(#{1,6}) (.*)", linha)
        if m:
            nivel, texto = len(m.group(1)) + deslocar, m.group(2).strip()
            if nivel <= 2:
                texto = re.sub(r"^\d+(\.\d+)*\.?\s+", "", texto)
            if nivel <= 3:
                if nivel == 2 and not primeiro_h1:
                    saida.append("")
                saida.append("#" * nivel + " " + texto)
            else:
                saida.append("!!! " + texto)
            primeiro_h1 = False
            continue
        saida.append(linha)
    fecha_tab()
    return "\n".join(saida) + "\n"


def montar_fonte(estados_dir, praticas_md=None):
    partes = [INTRO]
    lido = lambda nome: (PASTA / nome).read_text(encoding="utf-8")
    cap = lambda nome, titulo=None: (
        "\\pagebreak\n" + (normalizar(lido(nome), 0).replace(normalizar(lido(nome), 0).splitlines()[0], f"# {titulo}", 1) if titulo else normalizar(lido(nome), 0))
    )
    partes.append(cap("resumo-para-o-analista.md", "Guia do analista"))
    partes.append(cap("textos-oficiais-lidos.md", "Situação da norma: textos oficiais lidos e o que falta"))
    partes.append(cap("os-modulos-e-a-anvisa.md", "Os módulos e o que a ANVISA espera"))
    partes.append(cap("garantia-da-qualidade-e-os-outros-modulos.md", "A Garantia da Qualidade e os outros módulos"))
    # cadastros globais: três documentos dentro de um capítulo
    partes.append("\\pagebreak\n# Os cadastros globais e a ordem de cadastro\n")
    for nome in ("cadastros-repetidos.md", "ordem-de-cadastro.md", "funcoes-do-profissional.md"):
        partes.append(normalizar(lido(nome), 1))
    # acesso e permissões: a matriz do iLabs e o desenho de segurança e acesso (este último está em docs/, fora de docs/roadmap)
    partes.append(cap("matriz-de-permissoes-ilabs.md", "Matriz de permissões do iLabs"))
    seg = normalizar((RAIZ / "docs" / "seguranca-e-acesso.md").read_text(encoding="utf-8"), 0).split("\n")
    seg[1:1] = [
        "",
        "!!! Atenção",
        "Este capítulo foi escrito em 02/11/2026 e atualizado em 05/11/2026. As frases sobre migrações do banco, protótipos e pendências de publicação descrevem aquele dia e **podem estar desatualizadas**. As decisões e as regras de acesso continuam valendo.",
        "",
    ]
    partes.append("\\pagebreak\n" + "\n".join(seg))
    partes.append(cap("fluxos-do-legado.md", "Os fluxos do legado e a ordem de análise"))
    fichas = ler_ficha_arquivos()
    for modulo in dict.fromkeys(m for _, m, _, _ in fichas):
        partes.append(f"\\pagebreak\n# Fichas de fluxo: {modulo}\n")
        for arq, m, cod, titulo in fichas:
            if m != modulo:
                continue
            partes.append("\\pagebreak\n" + normalizar(lido(arq), 1, estados_dir, arq.replace(".md", "")))
    if praticas_md:
        # telas de exemplo ("Na prática") dos cinco módulos em foco, geradas por exportar-praticas.mjs
        partes.append("\\pagebreak\n" + normalizar(Path(praticas_md).read_text(encoding="utf-8"), 0))
    partes.append(cap("como-decidir-sem-a-area.md", "Como decidimos sem área para perguntar"))
    partes.append(cap("classificacao-das-perguntas.md", "Classificação das 219 perguntas das fichas"))
    partes.append(cap("roteiro-de-implantacao.md", "Roteiro de implantação"))
    partes.append("\\pagebreak\n# Anexos\n")
    partes.append(normalizar(lido("glossario.md"), 1).replace("## Glossário", "## Anexo A: Glossário", 1))
    partes.append(normalizar(lido("o-que-a-norma-diz.md"), 1))
    partes.append(normalizar((RAIZ / "docs" / "decisoes.md").read_text(encoding="utf-8"), 1))
    return "\n".join(partes)


# ---------------------------------------------------------------------------------------------------------------------
# Documento por módulo (por enquanto, a Garantia da Qualidade): reúne o que o estudo tem sobre o módulo.
# ---------------------------------------------------------------------------------------------------------------------
INTRO_GQ = """# Como ler este documento

!!! Para quem é
Este documento reúne, em um só arquivo, **tudo o que o estudo produziu sobre o módulo Garantia da Qualidade (GQ)** do iLabs: para que serve, o que a ANVISA espera, os cinco fluxos (treinamento, desvios e CAPA, mudanças, autoinspeção e auditoria, assuntos regulatórios), as telas de exemplo, as permissões, as perguntas em aberto e o roteiro de implantação.

!!! Como está organizado
- **Para que serve e o que a ANVISA espera:** o resumo do módulo e os trechos da norma sobre ele.
- **A GQ e os outros módulos:** o que cada módulo entrega à GQ e recebe dela.
- **Os cinco fluxos**, cada um com diagrama, tabela etapa a etapa e pontos a decidir.
- **Telas de exemplo:** a teoria aplicada passo a passo, com base na norma e integrações.
- **Permissões:** a matriz da GQ, os perfis do banco e a matriz tela por tela do sistema atual.
- **Perguntas e reunião com a Qualidade:** as 37 perguntas classificadas e a pauta.
- **Roteiro de implantação** e **anexos** (textos oficiais lidos, glossário e decisões).

!!! Limites
- É o **modelo ideal proposto pelo iLabs**: nem tudo é exigência da ANVISA. Onde a norma deixa a escolha para a empresa, a proposta é um **parâmetro** que o cliente confirma na implantação.
- O que vem do **sistema atual (LabMedSys)** foi lido do código; só o que tem código de defeito (`DV-...`) vem de teste de tela.
- **Nada foi validado** por quem opera uma fábrica de medicamentos.
- Este arquivo é **gerado** a partir dos documentos do estudo. Para mudar o conteúdo, mude esses documentos e gere de novo.
"""


def secao(md, inicio, nivel):
    """Texto da seção cujo título (no `nivel`) começa com `inicio`, até o próximo título do mesmo nível ou acima."""
    linhas = md.splitlines()
    marca = "#" * nivel + " " + inicio
    ini = next(i for i, l in enumerate(linhas) if l.startswith(marca))
    fim = len(linhas)
    for j in range(ini + 1, len(linhas)):
        m = re.match(r"(#+) ", linhas[j])
        if m and len(m.group(1)) <= nivel:
            fim = j
            break
    return "\n".join(linhas[ini:fim]) + "\n"


def tabela_filtrada(md, padrao):
    """Todas as tabelas do texto, só com as linhas que casam com `padrao`; cada uma com o título (## ou ###) mais próximo."""
    saida, titulo, bloco = [], "", []

    def fecha():
        if not bloco:
            return
        cab, linhas = bloco[:2], [l for l in bloco[2:] if re.search(padrao, l, re.I)]
        if linhas:
            if titulo:
                saida.extend(["", titulo, ""])
            saida.extend(cab + linhas)
        bloco.clear()

    for l in md.splitlines():
        if l.startswith("|"):
            bloco.append(l)
            continue
        fecha()
        if re.match(r"#{2,3} ", l):
            titulo = l
    fecha()
    return "\n".join(saida) + "\n"


def montar_fonte_gq(estados_dir, praticas_md):
    lido = lambda nome: (PASTA / nome).read_text(encoding="utf-8")
    partes = [INTRO_GQ]
    pg = "\\pagebreak\n"

    # 1. Para que serve e o que a ANVISA espera
    partes.append(pg + "# Para que serve a Garantia da Qualidade e o que a ANVISA espera\n")
    partes.append(normalizar(secao(lido("resumo-para-o-analista.md"), "3.4 Garantia da Qualidade", 3), -1))
    partes.append(normalizar(secao(lido("os-modulos-e-a-anvisa.md"), "Garantia da Qualidade", 3), -1))
    norma = lido("o-que-a-norma-diz.md")
    for ini in ("1. Treinamento", "2. Desvios", "3. Controle de mudanças", "4. Autoinspeção", "8. Registro do produto", "10. Assinatura"):
        partes.append(normalizar(secao(norma, ini, 2), 0))

    # 2. A GQ e os outros módulos
    gq = lido("garantia-da-qualidade-e-os-outros-modulos.md")
    partes.append(pg + normalizar(gq, 0).replace(normalizar(gq, 0).splitlines()[0], "# A Garantia da Qualidade e os outros módulos", 1))

    # 3. Os cinco fluxos
    partes.append(pg + "# Os fluxos da Garantia da Qualidade\n")
    for arq in ("fluxo-13a-treinamento.md", "fluxo-13b-desvios-e-capa.md", "fluxo-13c-controle-de-mudancas.md",
                "fluxo-13d-autoinspecao-e-auditoria.md", "fluxo-13e-assuntos-regulatorios.md"):
        partes.append(pg + normalizar(lido(arq), 1, estados_dir, arq.replace(".md", "")))

    # 4. Telas de exemplo
    if praticas_md:
        partes.append(pg + normalizar(Path(praticas_md).read_text(encoding="utf-8"), 0))

    # 5. Permissões
    partes.append(pg + "# Permissões da Garantia da Qualidade\n")
    matriz = lido("matriz-de-permissoes-ilabs.md")
    for sec in ("5.1 Principal", "5.2 Estoque", "5.3 Controle da Qualidade", "5.5 Controle de Documentos"):
        matriz = matriz.replace(secao(matriz, sec, 3), "")
    matriz = matriz.replace("## 5. A matriz por módulo\n", "## 5. A matriz por módulo\n\nNesta versão aparece só a tabela da Garantia da Qualidade; as outras quatro estão no documento completo do estudo.\n", 1)
    matriz = "\n".join(matriz.splitlines()[1:])  # tira o título do documento (o capítulo já tem o seu)
    partes.append(normalizar(matriz, 0))
    partes.append(normalizar(secao(lido("funcoes-do-profissional.md"), "6. Garantia da Qualidade", 2), 0))

    # 6. Perguntas e reunião com a Qualidade
    partes.append(pg + "# Perguntas, classificação e reunião com a Qualidade\n")
    classif = lido("classificacao-das-perguntas.md")
    intro = classif.split("\n## ", 1)[0]
    intro = "\n".join(intro.splitlines()[1:])
    partes.append(normalizar("## Como ler a classificação\n" + intro, 0))
    partes.append(normalizar(secao(classif, "Garantia da Qualidade", 2), 0))
    partes.append(normalizar(secao(lido("pauta-reuniao-qualidade.md"), "Reunião 3", 2), 0))

    # 7. Roteiro de implantação
    partes.append(pg + "# Roteiro de implantação: as etapas da Garantia da Qualidade\n")
    rot = lido("roteiro-de-implantacao.md")
    for ini in ("Detalhe das etapas 1, 7 e 9: treinar", "Detalhe das etapas 1, 5, 7 e 9: desvios", "Detalhe das etapas 1, 5, 7 e 9: controle de mudanças",
                "Detalhe das etapas 1, 5, 7 e 9: autoinspeção", "Detalhe das etapas 1, 6, 7 e 9: assuntos regulatórios"):
        partes.append(normalizar(secao(rot, ini, 3), -1))

    # 8. Anexos
    partes.append(pg + "# Anexos\n")
    partes.append(normalizar(lido("textos-oficiais-lidos.md"), 1).replace("## Textos oficiais lidos e o que ainda falta", "## Anexo A: Textos oficiais lidos e o que ainda falta", 1))
    partes.append(normalizar(lido("glossario.md"), 1).replace("## Glossário", "## Anexo B: Glossário", 1))
    dec = (RAIZ / "docs" / "decisoes.md").read_text(encoding="utf-8")
    filtro = r"GQ|Garantia da Qualidade|desvio|CAPA|mudan|treinamento|auditoria|autoinspe|regulat|n[ií]veis|perfil|assinatura|segrega|elabora"
    partes.append("## Anexo C: Decisões que citam a Garantia da Qualidade ou seus temas\n\nSelecionadas do registro de decisões do projeto pelas palavras: GQ, desvio, CAPA, mudança, treinamento, auditoria, regulatório, níveis, perfil, assinatura e segregação.\n")
    partes.append(normalizar(tabela_filtrada(dec, filtro).replace("`", ""), 1))
    return "\n".join(partes)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--extrair-estados", default=None, help="só extrai os blocos mermaid das fichas para esta pasta (.mmd) e termina")
    ap.add_argument("--modelo")
    ap.add_argument("--gerador", help="caminho de gerar_docx.py (repositório do legado, somente leitura)")
    ap.add_argument("--estados", default=None, help="pasta com os .png dos diagramas de situação (um por ficha)")
    ap.add_argument("--modulo", default=None, help='gera o documento de um módulo (por enquanto: "gq")')
    ap.add_argument("--titulo-doc", default=None)
    ap.add_argument("--subtitulo", default=None)
    ap.add_argument("--sigla", default=None)
    ap.add_argument("--praticas", default=None, help="Markdown das telas de exemplo (saída de exportar-praticas.mjs)")
    ap.add_argument("--saida")
    ap.add_argument("--versao", default="0.1")
    ap.add_argument("--descricao", default="Rascunho para validação do responsável")
    ap.add_argument("--autor", default="Equipe do projeto iLabs")
    ap.add_argument("--fonte-md", default=None, help="grava também o Markdown montado neste caminho (para conferência)")
    a = ap.parse_args()
    if a.extrair_estados:
        os.makedirs(a.extrair_estados, exist_ok=True)
        n = 0
        for f in sorted(PASTA.glob("fluxo-*.md")):
            for i, bloco in enumerate(re.findall(r"```mermaid\n(.*?)```", f.read_text(encoding="utf-8"), re.S), 1):
                (Path(a.extrair_estados) / f"{f.stem}-estados{i}.mmd").write_text(bloco, encoding="utf-8")
                n += 1
        print(f"{n} diagramas extraídos para {a.extrair_estados}")
        return
    for obrigatorio in ("modelo", "gerador", "saida"):
        if not getattr(a, obrigatorio):
            ap.error(f"falta --{obrigatorio}")

    leg = carregar_modulo(a.gerador, "gerar_docx_legado")
    leg.ACRONIMOS_EXTRA = ACRONIMOS_ILABS
    fonte = montar_fonte_gq(a.estados, a.praticas) if a.modulo == "gq" else montar_fonte(a.estados, a.praticas)
    if a.fonte_md:
        Path(a.fonte_md).write_text(fonte, encoding="utf-8")

    SUMARIO = (
        '<w:p><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="28"/></w:rPr>'
        '<w:t>SUMÁRIO</w:t></w:r></w:p>'
        '<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
        '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r>'
        '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
        '<w:r><w:t>Se o sumário não aparecer, clique aqui com o botão direito e escolha "Atualizar campo" (ou aperte F9).</w:t></w:r>'
        '<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>'
        '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    )

    class DocIlabs(leg.Documento):
        def montar(self, corpo_xml, *args, **kw):
            return super().montar(SUMARIO + corpo_xml, *args, **kw)

        def capa(self, *args, **kw):
            x = super().capa(*args, **kw)
            x = x.replace("<w:t>LabMedSys</w:t>", "<w:t>iLabs</w:t>")
            # tabela "Envolvidos" do modelo: sem os nomes do modelo (não são deste projeto)
            x = x.replace('<w:t xml:space="preserve">Rogério </w:t>', "<w:t>Responsável pelo estudo</w:t>")
            for nome in ("Lúcia", "Balocco", "Cláudio"):
                x = x.replace(f"<w:t>{nome}</w:t>", "<w:t></w:t>")
            return x

    titulo_doc = a.titulo_doc or "Estudo do roadmap"
    subtitulo = a.subtitulo or "Sistema atual, normas e o que o iLabs precisa fazer"
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(a.modelo) as z:
            for item in z.infolist():
                destino = os.path.realpath(os.path.join(tmp, item.filename))
                if destino.startswith(os.path.realpath(tmp)):
                    z.extract(item, tmp)
        doc = DocIlabs(tmp, str(RAIZ))
        corpo = doc.converter(fonte)
        doc.modulo = titulo_doc
        doc.sigla = a.sigla or "PRI"
        data = date.today().strftime("%d/%m/%Y")
        doc.montar(corpo, subtitulo, a.versao, data, a.descricao, a.autor, False, False)
        # identidade: rodapé e propriedades do arquivo
        for nome in os.listdir(os.path.join(tmp, "word")):
            if nome.startswith("footer") and nome.endswith(".xml"):
                f = os.path.join(tmp, "word", nome)
                x = open(f, encoding="utf-8").read().replace(">LabMedSys</w:t>", ">iLabs</w:t>")
                open(f, "w", encoding="utf-8").write(x)
        core = os.path.join(tmp, "docProps", "core.xml")
        if os.path.exists(core):
            x = open(core, encoding="utf-8").read()
            x = re.sub(r"<dc:title>.*?</dc:title>", f"<dc:title>iLabs – {titulo_doc}</dc:title>", x)
            x = re.sub(r"<dc:creator>.*?</dc:creator>", f"<dc:creator>{a.autor}</dc:creator>", x)
            x = re.sub(r"<cp:lastModifiedBy>.*?</cp:lastModifiedBy>", f"<cp:lastModifiedBy>{a.autor}</cp:lastModifiedBy>", x)
            open(core, "w", encoding="utf-8").write(x)
        os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)
        if os.path.exists(a.saida):
            os.remove(a.saida)
        with zipfile.ZipFile(a.saida, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(os.path.join(tmp, "[Content_Types].xml"), "[Content_Types].xml")
            for pasta, _, arquivos in os.walk(tmp):
                for nome in sorted(arquivos):
                    f = os.path.join(pasta, nome)
                    rel = os.path.relpath(f, tmp)
                    if rel != "[Content_Types].xml" and not os.path.islink(f):
                        z.write(f, rel)
    print(f"Gerado: {a.saida} ({doc.figura} figuras)")


if __name__ == "__main__":
    main()
