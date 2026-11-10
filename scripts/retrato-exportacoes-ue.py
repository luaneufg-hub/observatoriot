"""Exportações das MPE para a União Europeia em 2025 (estudo especial do Observatório).

Lê os dados embarcados no painel "Exportações MPE → UE 2025" (mapa_exportacoes_mpe_ue_2025.html,
UCOMP NA · Sebrae), que vêm do arquivo exp_porte_ue_sh2_2025.xlsx (SECEX/MDIC, Comex Stat):
valor FOB em US$ milhões, por capítulo SH2 e UF, para a UE e para os demais destinos.
Porte: MEI, ME e EPP. O total geral ("todos") inclui linhas sob sigilo que não aparecem por produto.

Saída: lib/dados/retratos/exportacoes-mpe-ue-2025.json
Uso:   python3 scripts/retrato-exportacoes-ue.py <painel.html>
"""
import json
import sys


def bloco(s, nome, prox):
    i = s.index(f'var {nome}')
    j = s.index(f'var {prox}', i)
    js = s[i:j]
    js = js[js.index('=') + 1:]
    return json.loads(js[:js.rindex('}') + 1])


def main(html):
    s = open(html, encoding='utf-8').read()
    dados = bloco(s, 'DATASET', 'SH2_LABELS')
    nomes = bloco(s, 'SH2_LABELS', 'SH2_ICONS')
    todos = dados['todos']
    ufs = todos['ufs']
    produtos = {}
    for cod, d in dados.items():
        if cod == 'todos':
            continue
        assert d['ufs'] == ufs
        produtos[cod] = {'nome': nomes.get(cod, cod), 'ue': d['ue'], 'demais': d['demais']}
    soma_ue = round(sum(sum(p['ue']) for p in produtos.values()), 2)
    saida = {
        'fonte': 'SECEX/MDIC (Comex Stat) · exp_porte_ue_sh2_2025.xlsx · painel "Exportações MPE → UE 2025" (Observatório Setorial Territorial, UCOMP NA)',
        'ano': 2025,
        'unidade': 'US$ milhões (FOB)',
        'porte': 'MEI, ME e EPP',
        'destino': 'União Europeia (EU27) e demais países do Espaço Econômico Europeu: 30 países',
        'ufs': ufs,
        'todos': {'ue': todos['ue'], 'demais': todos['demais']},
        'sigiloUE': round(sum(todos['ue']) - soma_ue, 2),
        'produtos': produtos,
    }
    json.dump(saida, open('lib/dados/retratos/exportacoes-mpe-ue-2025.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    ue = sum(todos['ue'])
    dm = sum(todos['demais'])
    print(f'{len(produtos)} capítulos SH2 · UE US$ {ue:.1f} mi · demais US$ {dm:.1f} mi · parcela UE {ue / (ue + dm) * 100:.1f}% · sigilo US$ {saida["sigiloUE"]} mi')


if __name__ == '__main__':
    main(sys.argv[1])
