#!/usr/bin/env python3
"""Gera docs/roadmap/classificacao-das-perguntas.md a partir de ferramentas/classificacao-perguntas-dados.py
e das perguntas das fichas. Uso (de docs/roadmap): python3 ferramentas/gerar-classificacao.py"""
import importlib.util
import re
from datetime import date

def carregar(caminho, nome):
    spec = importlib.util.spec_from_file_location(nome, caminho)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

dados = carregar("ferramentas/classificacao-perguntas-dados.py", "dados").DADOS
# reaproveita ARQUIVOS e as perguntas do gerador de pontos a validar sem regravar os arquivos dele
src = open("ferramentas/gerar-pontos-a-validar.py", encoding="utf-8").read()
ini = src.index("AREAS = [")
fim = src.index("dados = {}")
ns = {}
exec(src[ini:fim].replace("def pontos", "def pontos"), {"re": re}, ns)
ARQUIVOS, pontos = ns["ARQUIVOS"], ns["pontos"]

perguntas = {}
for arq, (modulo, cod, titulo) in ARQUIVOS.items():
    for i, p in enumerate(pontos(arq), 1):
        perguntas[f"{cod}-{i}"] = (modulo, cod, titulo, p)
desconhecidos = [c for c in dados if c not in perguntas]
if desconhecidos:
    raise SystemExit(f"Código sem pergunta: {desconhecidos}")

def tipo_base(t):
    return t.split("+")[0]

contagem = {}
for c, (t, _, _) in dados.items():
    contagem[t] = contagem.get(t, 0) + 1
total = len(perguntas)
feitas = len(dados)
L = []
L.append("# Classificação das perguntas das fichas: a norma manda, parâmetro, texto que falta ou cliente\n")
L.append(f"**Gerada em {date.today().strftime('%d/%m/%Y')} a partir de `ferramentas/classificacao-perguntas-dados.py`. Rascunho: as propostas aguardam a aprovação do responsável.** Aplica a regra do documento \"Como decidir quando não há área para perguntar\" a cada pergunta das fichas. **Cobertura: {feitas} de {total} perguntas.** As que faltam seguem nas fichas e em \"Pontos a validar, por área\".\n")
L.append("> **Como ler:** em cada pergunta, o **tipo** diz como ela se resolve e a **proposta** diz o que o iLabs faz. **Você aprova por exceção:** se concorda, nada a fazer; se discorda de uma, passe o código (por exemplo `13a-2`) e a mudança.\n")
L.append("| Tipo | O que significa | Perguntas |\n|---|---|---|")
sig = [("A", "A norma manda: comportamento fixo, conferido pelo banco"), ("B", "A norma deixa para a empresa: parâmetro configurável (sem número inventado, padrão mais rigoroso)"), ("C", "Depende de texto que não temos: padrão seguro, a confirmar"), ("D", "Depende do cliente ou do desenho do produto: flexível, definido na implantação"), ("Decidido", "Decisão já tomada pelo responsável")]
mistos = {}
for c, (t, _, _) in dados.items():
    mistos[tipo_base(t)] = mistos.get(tipo_base(t), 0) + 1
for k, desc in sig:
    L.append(f"| **{k}** | {desc} | {mistos.get(k, 0)} |")
L.append("\n*Os tipos mistos (por exemplo \"A+B\") contam no primeiro tipo: a parte fixa vem da norma e a parte configurável é da empresa.*\n")
ordem_modulos = ["Estoque", "Controle da Qualidade", "Garantia da Qualidade", "Controle de Documentos", "Produção", "Comercial", "Rastreabilidade", "OPE"]
for mod in ordem_modulos:
    fichas = [(a, v) for a, v in ARQUIVOS.items() if v[0] == mod]
    q_mod = [c for c, v in perguntas.items() if v[0] == mod]
    f_mod = [c for c in q_mod if c in dados]
    L.append(f"## {mod} ({len(f_mod)} de {len(q_mod)} classificadas)\n")
    if not f_mod:
        L.append("*Ainda não classificado.*\n")
        continue
    for arq, (m, cod, titulo) in fichas:
        itens = [c for c in dados if perguntas[c][1] == cod]
        if not itens:
            continue
        L.append(f"### Ficha {cod} · {titulo}\n")
        L.append("| Código | Tipo | Pergunta | Proposta do iLabs | Base |\n|---|---|---|---|---|")
        for c in sorted(itens, key=lambda x: int(x.split('-')[-1])):
            t, prop, base = dados[c]
            q = perguntas[c][3].replace("|", "/")
            q = re.sub(r"\s+", " ", q)
            L.append(f"| **{c}** | {t} | {q} | {prop} | {base} |")
        L.append("")
open("classificacao-das-perguntas.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print(f"{feitas} de {total} perguntas classificadas")
