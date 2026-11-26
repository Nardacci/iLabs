#!/usr/bin/env python3
"""Gera a planilha Excel da matriz de permissões do iLabs a partir de docs/roadmap/matriz-de-permissoes-ilabs.md.

O documento Markdown é a fonte: a planilha só reorganiza as tabelas dele (nada é digitado à mão aqui).
Uso:  python3 gerar-matriz-excel.py <saida.xlsx>
O .xlsx não vai para o git: é gerado a cada vez.
"""
import re
import sys
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

FONTE = Path(__file__).resolve().parents[1] / "matriz-de-permissoes-ilabs.md"

CINZA = PatternFill("solid", fgColor="D9D9D9")
AZUL = PatternFill("solid", fgColor="DCE6F1")
BORDA = Border(*(Side(style="thin", color="999999"),) * 4)


def limpar(t):
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"`([^`]*)`", r"\1", t)
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    return t.replace("<br>", "\n").strip()


def ler_tabelas(md):
    """Devolve [(titulo da seção, cabeçalho, linhas)] para cada tabela, na ordem do documento."""
    titulo, saida, atual = "", [], []
    for linha in md.splitlines() + [""]:
        if linha.startswith("|"):
            atual.append(linha)
            continue
        if atual:
            cel = lambda l: [limpar(c) for c in l.strip().strip("|").split("|")]
            corpo = [cel(l) for l in atual if not re.fullmatch(r"\|[\s:|-]+\|?", l.strip())]
            saida.append((titulo, corpo[0], corpo[1:]))
            atual = []
        m = re.match(r"#{2,3} (.*)", linha)
        if m:
            titulo = limpar(m.group(1))
    return saida


def lista_numerada(md, secao):
    """Itens numerados ("1. **Texto:** ...") de uma seção ## que começa com `secao`."""
    ini = md.index(f"## {secao}")
    fim = md.index("\n## ", ini + 5)
    itens = []
    for l in md[ini:fim].splitlines():
        m = re.match(r"(\d+)\. (.*)", l)
        if m:
            itens.append((int(m.group(1)), limpar(m.group(2))))
    return itens


def folha(wb, nome, cab, linhas, larguras, tabela=True):
    ws = wb.create_sheet(nome)
    ws.append(cab)
    for l in linhas:
        ws.append(l + [""] * (len(cab) - len(l)))
    for j, c in enumerate(ws[1], 1):
        c.font = Font(bold=True)
        c.fill = CINZA
        c.alignment = Alignment(wrap_text=True, vertical="center")
        ws.column_dimensions[get_column_letter(j)].width = larguras[j - 1]
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
            c.border = BORDA
    ws.freeze_panes = "A2"
    if tabela and linhas:
        ref = f"A1:{get_column_letter(len(cab))}{len(linhas) + 1}"
        t = Table(displayName="T_" + re.sub(r"\W", "", nome), ref=ref)
        t.tableStyleInfo = TableStyleInfo(name="TableStyleLight1", showRowStripes=False)
        ws.add_table(t)
    ws.sheet_view.zoomScale = 100
    return ws


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    md = FONTE.read_text(encoding="utf-8")
    tabelas = ler_tabelas(md)
    por_titulo = {t: (c, l) for t, c, l in tabelas}

    wb = Workbook()
    wb.remove(wb.active)

    # 1. Leia-me
    ws = wb.create_sheet("Leia-me")
    linhas = [
        ("Matriz de permissões do iLabs", True),
        (f"Gerada em {date.today().strftime('%d/%m/%Y')} a partir de docs/roadmap/matriz-de-permissoes-ilabs.md. Rascunho para validação do responsável.", False),
        ("", False),
        ("O que é", True),
        ("Quem pode fazer cada ação importante nos cinco módulos em foco (Principal, Estoque, Controle da Qualidade, Garantia da Qualidade e Controle de Documentos), quem não pode ser a mesma pessoa que outra na mesma ação e o que o banco confere.", False),
        ("", False),
        ("Abas", True),
        ("Matriz por módulo: uma linha por ação, com filtro por módulo. As colunas \"Situação\" e \"Observação do responsável\" estão em branco para a revisão.", False),
        ("Papéis (perfis do banco): os 22 perfis de teste que já existem no banco e como cada um pode assinar.", False),
        ("Níveis da GQ: como os níveis 1, 2 e 3 do sistema atual viram papéis.", False),
        ("Segregação de funções: os pares de ações que não podem ser da mesma pessoa.", False),
        ("Regras para todos: o que vale em todos os módulos.", False),
        ("Pontos a validar: o que depende de decisão do responsável ou do cliente.", False),
        ("", False),
        ("Limites", True),
        ("A coluna \"Base na norma\" cita artigos da RDC 658/2022 conferidos no texto (tradução oficial em inglês). Onde diz \"proposta do iLabs\", a norma não exige o que está escrito: é escolha de desenho a validar.", False),
        ("Os nomes dos papéis são exemplos propostos; o catálogo de funções é da empresa.", False),
        ("Nenhuma regra foi validada por quem opera uma fábrica de medicamentos.", False),
        ("Esta planilha é gerada do documento da matriz. Para mudar o conteúdo, mude o documento e gere de novo.", False),
    ]
    for t, negrito in linhas:
        ws.append([t])
        c = ws.cell(row=ws.max_row, column=1)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        if negrito:
            c.font = Font(bold=True, size=14 if ws.max_row == 1 else 11)
    ws.column_dimensions["A"].width = 120

    # 2. Matriz por módulo (as cinco tabelas de 5.x juntas)
    cab_final = ["Módulo", "Ação", "Quem faz", "Quem não pode ser a mesma pessoa", "Base na norma", "O banco confere", "Situação", "Observação do responsável"]
    linhas = []
    for titulo, cab, ls in tabelas:
        m = re.match(r"5\.\d (.*)", titulo)
        if m and cab[0] == "Ação":
            for l in ls:
                linhas.append([m.group(1)] + l + ["Proposta", ""])
    folha(wb, "Matriz por módulo", cab_final, linhas, [24, 36, 34, 30, 38, 46, 14, 36])

    # 3. Papéis (perfis do banco)
    cab, ls = por_titulo["4.1 Os 22 perfis de teste do banco (papéis em proposta)"]
    folha(wb, "Papéis (perfis do banco)", cab, ls, [34, 46, 30, 52])

    # 4. Níveis da GQ
    cab, ls = por_titulo["4.2 Os níveis da Garantia da Qualidade do sistema atual"]
    folha(wb, "Níveis da GQ", cab, ls, [26, 50, 60])

    # 5. Segregação
    cab, ls = por_titulo["3. Quem não pode ser a mesma pessoa (segregação de funções)"]
    folha(wb, "Segregação de funções", cab, ls, [46, 50, 52])

    # 6. Regras para todos
    cab, ls = por_titulo["2. Regras que valem para todos os módulos"]
    folha(wb, "Regras para todos", cab, ls, [70, 60])

    # 7. Pontos a validar
    pontos = [[str(n), t, "", ""] for n, t in lista_numerada(md, "6.")]
    folha(wb, "Pontos a validar", ["#", "Ponto", "Decisão", "Quem decidiu e quando"], pontos, [6, 100, 30, 28])

    # filtros e impressão
    for ws in wb.worksheets[1:]:
        ws.page_setup.orientation = "landscape"
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.sheet_properties.pageSetUpPr.fitToPage = True
    wb.properties.title = "iLabs - Matriz de permissões"
    wb.properties.creator = "Equipe do projeto iLabs"
    wb.save(sys.argv[1])
    print(f"{len(linhas)} ações na matriz; planilha gravada em {sys.argv[1]}")


if __name__ == "__main__":
    main()
