#!/usr/bin/env python3
"""Passo 2 do roadmap: dependências entre os cadastros globais (do legado) e a ordem de cadastro.

Uso: LEGADO=<pasta do repositório do legado LabMedsys_homol> python3 dependencias.py
Lê as definições de tabela (`*.DB/Tables/*.sql`) do legado, junta as tabelas nos conceitos de
`../cadastros-globais.csv` (coluna "Onde está no legado"), acha quem depende de quem (FOREIGN KEY e colunas
ID_ que apontam para uma tabela do mesmo módulo) e separa:
  * dependência OBRIGATÓRIA: a coluna é NOT NULL (sem o outro cadastro, não dá para gravar);
  * dependência OPCIONAL: a coluna aceita nulo (pode ser preenchida depois).
Os níveis de cadastro usam só as obrigatórias. Grava `dependencias.json`.
"""
import csv, glob, json, os, re, sys
from collections import defaultdict

LEGADO = os.environ.get('LEGADO') or sys.exit('Defina LEGADO com a pasta do repositório do legado.')
AQUI = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(AQUI, '..', 'cadastros-globais.csv')

# Colunas de auditoria (quem criou/alterou) e a empresa dona do registro não contam como dependência de negócio:
# a empresa é a base de tudo (no iLabs é o isolamento por empresa).
def ruido(col):
    return 'USUARIO' in col or col == 'ID_EMPRESA'

# Ligações do legado que NÃO levamos como dependência (e por quê). Cada uma vira linha no documento.
IGNORAR = {
    ('STQ_LOCAL', 'ID_PRODUTO_GRUPO'): 'o local de armazenagem apontava para grupo, subgrupo e item: no iLabs vira ligação "o que pode ser guardado aqui", opcional, feita depois do Item',
    ('STQ_LOCAL', 'ID_PRODUTO_SUBGRUPO'): 'idem',
    ('STQ_LOCAL', 'ID_PRODUTO'): 'idem',
    ('STQ_LOCAL', 'ID_CLIENTE'): 'idem',
    ('STQ_ENDERECO', 'ID_ITEM'): 'endereço reservado a um item: ligação feita depois do Item',
    ('ITEM_LOCAL', '*'): 'liga item a local: ligação feita depois dos dois',
    ('ITEM_ALMOXARIFADO', '*'): 'liga item a almoxarifado: ligação feita depois dos dois',
    ('CENTRO_CUSTO_ITEM', '*'): 'liga centro de custo a item: ligação feita depois dos dois',
    ('GRUPO_USUARIO_ALMOXARIFADO', '*'): 'acesso do grupo ao almoxarifado: ligação feita depois dos dois',
    ('PORTARIA_PERG_RESP', '*'): 'perguntas da Portaria 344: ligação do checklist, feita depois',
    ('SIS_LOCAL_RESPONSAVEL', '*'): 'responsável pelo setor: preenchido depois que o profissional existe (o profissional é que depende do setor)',
    ('APRESENTACAO_FORN', '*'): 'apresentação do item por fornecedor: ligação feita depois',
    ('CUIDADOS_CONSERVACAO_PRODUTO', '*'): 'texto de conservação do produto: detalhe do produto',
    ('ANEXO', '*'): 'anexo é serviço comum: não depende de nenhum cadastro de negócio',
    ('SIS_ATIVIDADE_USUARIO', '*'): 'registro automático de atividade',
}
# Tabelas que a descrição do CSV coloca em dois conceitos: quem fica com ela.
DONO_FORCADO = {('1', 'GBL_PJ'): 12, ('1', 'GBL_PJ_CONTATO'): 15}
# Listas do CQ que têm o nome parecido com o de outro cadastro, mas são "tipos de item de análise" (a chave primária
# se chama ID_TIPO_ITEM_ANALISE): ficam com os tipos de análise do CQ.
PARA_CQ = {('4', 'TIPO_AGUA'), ('4', 'TIPO_AMBIENTE'), ('4', 'TIPO_ITEM_ANALISE'), ('4', 'PONTO_AMOSTRAGEM')}
CONCEITO_CQ = 41
PARA_CQ.add(('4', 'TIPO_MATERIAL'))
# Registros de operação (programar e registrar análises) que a descrição do CSV listou junto do cadastro: não são cadastro.
OPERACAO = {('2', 'PROGRAMACAO_ANALISE_PONTOS_AGUA'), ('2', 'REGISTRO_ANALISE_PONTO_AGUA'), ('2', 'PROGRAMACAO_ANALISE_AMBIENTE'),
            ('2', 'REGISTRO_ANALISE_AMBIENTE'), ('2', 'AUTORIZACAO_PRODUCAO_PONTOAGUA'), ('2', 'DETALHE_AUTORIZACAO_PONTOAGUA'),
            ('3', 'TMP_LOCAL'), ('3', 'TMP_FORNECEDORES')}  # as duas últimas são tabelas temporárias de importação
# Tabelas de LIGAÇÃO (A × B): para existir a ligação os dois são obrigatórios, mas A pode existir sem B.
# Por isso as dependências que saem delas contam como opcionais.
LIGACAO = {'EQUIPAMENTO_AMBIENTE', 'INSTRUMENTO_AMBIENTE', 'UTILIDADE_AMBIENTE', 'EQUIPAMENTO_TIPO_MANUTENCAO',
           'CATEGORIA_EQUIPAMENTO_TIPO_MANUTENCAO', 'SIS_PERFIL_LOCAL', 'SIS_USUARIO_PERFIL', 'SIS_PERFIL_FUNCAO'}
# O Produto (Produção) é complemento do Item (Estoque): conceito próprio para ver o que cada um exige.
PRODUTO = {('2', 'PRODUTO'), ('2', 'PRODUTO_CORRELACOES')}
CONCEITO_PRODUTO = 51

# 1. índice de tabelas
tabelas = {}
for f in glob.glob(f'{LEGADO}/[1-9].*/**/Tables/*.sql', recursive=True):
    mod = os.path.relpath(f, LEGADO).split('.')[0]
    nome = re.sub(r'^TBL_', '', os.path.basename(f).replace('dbo.', '')[:-4])
    t = open(f, encoding='utf-8-sig', errors='ignore').read()
    cols = re.findall(r'^\s*\[(\w+)\]', t, re.M)
    obrig = {c.upper() for c, nn in re.findall(
        r'^\s*\[(\w+)\]\s+\[?\w+\]?(?:\([^)]*\))?[^,\n]*?\b(NOT NULL|NULL)\b', t, re.M | re.I) if nn.upper() == 'NOT NULL'}
    fks = {(c.upper(), re.sub(r'^TBL_', '', r).upper())
           for c, r in re.findall(r'FOREIGN KEY\s*\(\[(\w+)\]\)\s*REFERENCES\s*\[dbo\]\.\[(\w+)\]', t, re.I)}
    tabelas[(mod, nome.upper())] = {'cols': [c.upper() for c in cols], 'fks': fks, 'obrig': obrig}

def existe(mod, nome):
    return (mod, nome) in tabelas

# 2. conceitos e suas tabelas
conceitos = []
with open(CSV, encoding='utf-8-sig') as fh:
    for i, l in enumerate(csv.reader(fh, delimiter=';')):
        if i == 0: continue
        conceitos.append({'id': i, 'nome': l[0], 'destino': l[4], 'noIlabs': l[6], 'legado': l[2], 'tabelas': set()})
ESPECIAIS = {
    'Anexo (arquivo)': lambda m, n: n == 'ANEXO',
    'Notificações, alertas e eventos': lambda m, n: (m == '1' and n.startswith('GST_')) or n in ('NOTIFICACAO', 'NOTIFICACAO_PADRAO', 'GST_ALERTA', 'GST_MENSAGEM'),
    'Histórico de alterações (log)': lambda m, n: n.startswith('LOG_ALTERACAO'),
}
for c in conceitos:
    mod = None
    for tok in re.findall(r'(\d+):|([A-Z][A-Z0-9_]{2,})', c['legado']):
        if tok[0]: mod = tok[0]; continue
        nome = re.sub(r'^TBL_', '', tok[1])
        if mod and existe(mod, nome): c['tabelas'].add((mod, nome))
    esp = ESPECIAIS.get(c['nome'])
    if esp:
        for (m, n) in tabelas:
            if esp(m, n): c['tabelas'].add((m, n))
por_id = {c['id']: c for c in conceitos}
for t in PARA_CQ:
    for c in conceitos: c['tabelas'].discard(t)
    por_id[CONCEITO_CQ]['tabelas'].add(t)
for t, i in DONO_FORCADO.items():
    for c in conceitos: c['tabelas'].discard(t)
    por_id[i]['tabelas'].add(t)

for t in OPERACAO:
    for c in conceitos: c['tabelas'].discard(t)
for c in conceitos: c['tabelas'] -= PRODUTO
conceitos.append({'id': CONCEITO_PRODUTO, 'nome': 'Produto (complemento do material, vem da Produção)', 'destino': 'Principal (complemento do Item)',
                  'noIlabs': 'Não existe', 'legado': '', 'tabelas': set(PRODUTO)})
por_id[CONCEITO_PRODUTO] = conceitos[-1]
dono = {}
for c in conceitos:
    for t in c['tabelas']:
        dono.setdefault(t, c['id'])

# 3. dependências
def alvo(mod, coluna, fks):
    for col, ref in fks:
        if col == coluna and existe(mod, ref): return ref
    if coluna.startswith('ID_'):
        base = coluna[3:]
        for cand in (base, base + 'S', 'SIS_' + base, 'STQ_' + base, 'GBL_' + base):
            if existe(mod, cand): return cand
    return None

deps = defaultdict(lambda: defaultdict(lambda: {'obrig': False, 'origem': set()}))
ignoradas = defaultdict(set)
for c in conceitos:
    for (mod, nome) in c['tabelas']:
        info = tabelas[(mod, nome)]
        for col in info['cols']:
            if not col.startswith('ID_') or ruido(col): continue
            ref = alvo(mod, col, info['fks'])
            if not ref or ref == nome: continue
            d = dono.get((mod, ref))
            if not d or d == c['id']: continue
            motivo = IGNORAR.get((nome, col)) or IGNORAR.get((nome, '*'))
            if motivo:
                ignoradas[(nome, motivo)].add(f'{c["nome"]} → {por_id[d]["nome"]}')
                continue
            e = deps[c['id']][d]
            e['origem'].add(f'{nome}.{col}')
            if col in info['obrig'] and nome not in LIGACAO: e['obrig'] = True

ids = [c['id'] for c in conceitos]

def niveis(so_obrig):
    arestas = {i: {j for j, e in deps[i].items() if (e['obrig'] or not so_obrig)} for i in ids}
    reach = {}
    for i in ids:
        vis, pilha = set(), [i]
        while pilha:
            x = pilha.pop()
            for y in arestas[x]:
                if y not in vis: vis.add(y); pilha.append(y)
        reach[i] = vis
    ciclo = {i: sorted(j for j in reach[i] if i in reach[j] and j != i) for i in ids}
    grupo = {i: min([i] + ciclo[i]) for i in ids}
    nivel = {}
    def calc(i, vis=()):
        g = grupo[i]
        if g in nivel: return nivel[g]
        if g in vis: return 0
        ds = {grupo[j] for m in ids if grupo[m] == g for j in arestas[m] if grupo[j] != g}
        nivel[g] = 0 if not ds else 1 + max(calc(d, vis + (g,)) for d in ds)
        return nivel[g]
    return {i: calc(i) for i in ids}, ciclo

nivel_ob, ciclo_ob = niveis(True)
nivel_todas, ciclo_todas = niveis(False)

saida = []
for c in conceitos:
    i = c['id']
    saida.append({
        'id': i, 'nome': c['nome'], 'destino': c['destino'], 'noIlabs': c['noIlabs'], 'tabelas': len(c['tabelas']),
        'nivel': nivel_ob[i], 'nivelComOpcionais': nivel_todas[i],
        'obrigatorias': sorted(j for j, e in deps[i].items() if e['obrig']),
        'opcionais': sorted(j for j, e in deps[i].items() if not e['obrig']),
        'origem': {str(j): sorted(e['origem'])[:5] for j, e in deps[i].items()},
        'noCicloObrigatorio': ciclo_ob[i], 'noCicloComOpcionais': ciclo_todas[i],
    })
json.dump({
    'conceitos': saida,
    'ignoradas': [{'tabela': t, 'motivo': m, 'efeitos': sorted(v)} for (t, m), v in sorted(ignoradas.items())],
}, open(os.path.join(AQUI, 'dependencias.json'), 'w'), ensure_ascii=False, indent=1)
print(len(saida), 'conceitos;', 'níveis (só obrigatórias):', max(nivel_ob.values()) + 1,
      '; ciclos obrigatórios:', sum(1 for i in ids if ciclo_ob[i]), '; ciclos com opcionais:', sum(1 for i in ids if ciclo_todas[i]))

# Planilha da ordem de cadastro (para abrir no Excel)
nomes = {c['id']: c['nome'] for c in conceitos}
with open(os.path.join(AQUI, '..', 'ordem-de-cadastro.csv'), 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.writer(fh, delimiter=';')
    w.writerow(['Nível (com opcionais)', 'Cadastro', 'Destino proposto', 'No iLabs hoje', 'O banco do legado EXIGE antes', 'O legado deixa OPCIONAL (mas o negócio costuma precisar)', 'Usado por'])
    for c in sorted(saida, key=lambda c: (c['nivelComOpcionais'], c['id'])):
        usado = sorted(x['id'] for x in saida if c['id'] in x['obrigatorias'] + x['opcionais'])
        w.writerow([c['nivelComOpcionais'], c['nome'], c['destino'], c['noIlabs'],
                    '; '.join(nomes[j] for j in c['obrigatorias']), '; '.join(nomes[j] for j in c['opcionais']),
                    '; '.join(nomes[j] for j in usado)])
