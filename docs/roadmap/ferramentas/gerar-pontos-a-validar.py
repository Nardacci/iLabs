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
    "fluxo-16a-ium-e-agregacao.md": ("Rastreabilidade", "16a", "Geração do IUM e agregação"),
    "fluxo-16b-eventos-e-declaracao.md": ("Rastreabilidade", "16b", "Eventos e declaração à ANVISA"),
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
L.append("> **Como usar:** escolha a área, leve a lista de perguntas, anote a resposta e a pessoa que a deu. Pergunta sem resposta fica como \"ponto para validar\". Resposta de quem manda na área vira decisão e entra na ficha.\n")
L.append("## Resumo por área\n")
L.append("| Quem responde | Fichas | Perguntas |\n|---|---|---|")
for mod, quem in AREAS:
    fs = [a for a, v in ARQUIVOS.items() if v[0] == mod]
    L.append(f"| {quem} | {len(fs)} | {sum(len(dados[a]) for a in fs)} |")
L.append(f"| **Total** | **{len(ARQUIVOS)}** | **{total}** |\n")
L.append("## Antes das reuniões: textos que precisamos pedir à Qualidade\n")
L.append("Várias perguntas dependem de documentos que **não estão no repositório**. Sem eles, a resposta fica em aberto:\n")
L.append("1. **Lei 11.903/2009 e a regulamentação do SNCM** (identificador único de medicamento e declaração à ANVISA): fichas 16a e 16b.")
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
