"""Calendário Sebrae DITEC 2026 (planilha enviada pela equipe, nov. 2026) -> JSON para o site.

Uso: python3 scripts/retrato-calendario-ditec.py scripts/fontes/Calendario_Sebrae_DITEC_2026.xlsx
Gera lib/dados/retratos/calendario-ditec-2026.json.
Datas: "03 - 04 jun" (intervalo), "13 out" (um dia) ou "Novembro" (só o mês, dia a definir).
Local: "Cidade - UF", só o estado ("Acre") ou "-" (a definir).
Correções de grafia: só acentos e ordinais (Conferencia -> Conferência, 2° -> 2º); os nomes ficam como na planilha.
"""
import json, re, sys
import openpyxl

ANO = 2026
MESES = {m: i + 1 for i, m in enumerate(['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'])}
MESES_LONGOS = {'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12}
UF_NOME = {'acre': 'AC'}
CORRIGE = [(r'\bConferencia\b', 'Conferência'), (r'(\d)°', r'\1º')]


def datas(txt):
    t = str(txt).strip().lower()
    if t in MESES_LONGOS:
        m = MESES_LONGOS[t]
        return {'inicio': f'{ANO}-{m:02d}-01', 'fim': None, 'soMes': m}
    r = re.match(r'^(\d{1,2})\s*(?:-\s*(\d{1,2}))?\s+([a-zç]{3})', t)
    if not r:
        raise ValueError(f'data não reconhecida: {txt!r}')
    d1, d2, mes = int(r.group(1)), int(r.group(2) or r.group(1)), MESES[r.group(3)]
    return {'inicio': f'{ANO}-{mes:02d}-{d1:02d}', 'fim': f'{ANO}-{mes:02d}-{d2:02d}'}


def local(txt):
    t = str(txt or '').strip()
    if t in ('', '-'):
        return {'cidade': None, 'uf': None}
    r = re.match(r'^(.*?)\s*-\s*([A-Z]{2})$', t)
    if r:
        return {'cidade': r.group(1).strip(), 'uf': r.group(2)}
    return {'cidade': None, 'uf': UF_NOME.get(t.lower())}


def main(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True).active
    eventos = []
    for i, (cat, nome, loc, data, publico) in enumerate(ws.iter_rows(min_row=2, values_only=True)):
        if not nome:
            continue
        for a, b in CORRIGE:
            nome = re.sub(a, b, nome)
        r = re.match(r'^(.*)\(([A-Z]+)\)\s*$', cat.strip())
        unidade, sigla = (r.group(1).strip(), r.group(2)) if r else (cat.strip(), 'GERAL')
        eventos.append({'id': i + 1, 'categoria': sigla, 'unidade': unidade, 'nome': nome.strip(), **local(loc), 'local': str(loc).strip(), **datas(data), 'dataTexto': str(data).strip(), 'publico': (publico or '').strip()})
    eventos.sort(key=lambda e: (e['inicio'], e['nome']))
    out = {'fonte': 'Sebrae · DITEC · Calendário de eventos 2026 (planilha, nov. 2026)', 'ano': ANO, 'eventos': eventos}
    with open('lib/dados/retratos/calendario-ditec-2026.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(len(eventos), 'eventos;', sorted({e['categoria'] for e in eventos}))


if __name__ == '__main__':
    main(sys.argv[1])
