"""Indicações geográficas a partir das listas oficiais do INPI (PDF):
  • LISTA DAS INDICAÇÕES DE PROCEDÊNCIA RECONHECIDAS
  • LISTA DAS DENOMINAÇÕES DE ORIGEM RECONHECIDAS

Lê cada registro (número, nome, UF, produto, espécie, data, delimitação) e procura, no texto
da delimitação e no nome geográfico, os municípios das UFs da IG. Quando a delimitação não
cita municípios (coordenadas, "região de…"), a IG fica com `revisar: true` e sem municípios.

Saída: public/dados/inpi/indicacoes-geograficas.json
Uso:  python3 scripts/retrato-ig-inpi.py <lista-IP.pdf> <lista-DO.pdf>
"""
import json
import re
import subprocess
import sys
import unicodedata

ROTULOS = ['Número', 'Requerente', 'Nº de fls.', 'Nome geográfico/Gentílico', 'País/UF', 'Produto/Serviço', 'Espécie', 'Data do registro', 'Delimitação']
CHAVE = {'Número': 'numero', 'Requerente': 'requerente', 'Nome geográfico/Gentílico': 'nome', 'País/UF': 'uf', 'Produto/Serviço': 'produto', 'Espécie': 'especie', 'Data do registro': 'data', 'Delimitação': 'delimitacao'}

# nomes de município que também são palavras comuns: só contam se o texto falar em município
# nomes de estado (e de rio) que também são municípios: "Estado de São Paulo", "Rio Grande do Sul"…
UF_NOMES = ['acre', 'alagoas', 'amapa', 'amazonas', 'bahia', 'ceara', 'distrito federal', 'espirito santo', 'goias', 'maranhao',
            'mato grosso do sul', 'mato grosso', 'minas gerais', 'para', 'paraiba', 'parana', 'pernambuco', 'piaui', 'rio de janeiro',
            'rio grande do norte', 'rio grande do sul', 'rondonia', 'roraima', 'santa catarina', 'sao paulo', 'sergipe', 'tocantins']
COMUNS = {'rio grande', 'sao francisco', 'sao paulo', 'rio de janeiro', 'espirito santo', 'goias', 'amapa', 'tocantins', 'fronteira',
          'manga', 'bonito', 'mato grosso', 'paraiba', 'planalto', 'serra', 'barra', 'pinhao', 'mata', 'campo', 'planalto', 'esperanca', 'formosa', 'bonito', 'salto', 'paraiso',
          'canela', 'cacau', 'mel', 'ouro', 'cristal', 'palmas', 'arroio', 'vale', 'cerrado', 'sertao', 'pedra', 'rio', 'cruz',
          'caju', 'palmeira', 'laranjal', 'castanhal', 'mamao', 'uva', 'farinha', 'queijo', 'vinho', 'cafe', 'mate', 'lagoa',
          'alianca', 'uniao', 'bandeirantes', 'centenario', 'progresso', 'liberdade', 'brasil', 'jardim', 'ilha', 'cachoeira'}


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('’', "'").replace('-', ' ')
    return re.sub(r'\s+', ' ', s)


def registros(pdf):
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True, check=True).stdout
    regs, atual, campo = [], None, None
    for linha in txt.splitlines():
        if not linha.strip():
            continue
        rot = next((r for r in ROTULOS if linha.startswith(r)), None)
        if rot:
            valor = linha[len(rot):].strip()
            valor = re.split(r'\s{8,}', valor)[0]  # corta a coluna da direita (apresentação)
            if rot == 'Número':
                atual = {}
                regs.append(atual)
            campo = CHAVE.get(rot)
            if atual is not None and campo:
                atual[campo] = valor
            continue
        recuo = len(linha) - len(linha.lstrip())
        if atual is None or campo is None or recuo > 60 or re.fullmatch(r'\s*\d+\s*', linha):
            continue  # coluna da direita, número de página
        trecho = re.split(r'\s{8,}', linha.strip())[0]
        atual[campo] = (atual.get(campo, '') + ' ' + trecho).strip()
    return regs


def main(pdf_ip, pdf_do):
    idx = json.load(open('public/geo/municipios-index.json'))
    por_uf = {}
    for cod, nome, uf, *_ in idx:
        por_uf.setdefault(uf, []).append((cod, nome, norm(nome)))
    saida = []
    for pdf, especie in ((pdf_ip, 'IP'), (pdf_do, 'DO')):
        for r in registros(pdf):
            # quando o texto do produto transborda, a continuação cai no campo da data
            data = r.get('data', '')
            if data and not re.match(r'\d{2}/\d{2}/\d{4}', data):
                r['produto'] = (r.get('produto', '') + ' ' + data).strip()
                data = ''
            datas = re.findall(r'\d{2}/\d{2}/\d{4}', data + ' ' + r.get('especie', '') + ' ' + r.get('delimitacao', '')[:200])
            r['data'] = datas[0] if datas else None
            r['alterado'] = datas[1] if len(datas) > 1 else None
            r['delimitacao'] = re.sub(r'^(Indicação de Procedência|Denominação de Origem)?\s*(\d{2}/\d{2}/\d{4}[^A-Z]*?(?=A |O |Os |As |Área|Com|Delimita|Municíp|Abrange|Compreende|Todo|Tod|Localiza|Região|Corresponde|Constitu|Inclui|Fica)?)?', '', r.get('delimitacao', '')).strip()
            ufs = [u for u in r.get('uf', '').replace('BR/', '').split('/') if re.fullmatch(r'[A-Z]{2}', u.strip()[:2])]
            ufs = [u.strip()[:2] for u in ufs]
            if not r.get('uf', '').startswith('BR'):
                continue  # IG estrangeira
            texto = ' ' + norm(r.get('nome', '') + ' . ' + r.get('delimitacao', '')) + ' '
            # tira menções a estados e rios, que não são o município homônimo
            for uf_nome in UF_NOMES:
                texto = re.sub(r"(estados?|territorio|regiao|norte|sul|leste|oeste|centro|interior|litoral) (do|da|de|dos|das) " + uf_nome + r"(?![a-z])", ' ', texto)
            texto = re.sub(r"(rio|vale do|submedio|alto|baixo|medio) sao francisco", ' ', texto)
            todo_estado = bool(re.search(r"tod[oa]s? (o|a|os|as)? ?(territorio|estado|municipios do estado)", texto))
            em_lista = lambda n: re.search(r"(,|(?<![a-z])e|munic\w* d[eao]s?|:|;)\s*" + re.escape(n) + r"\s*(,|(?<![a-z])e(?![a-z])|\.|;|\)|$|\s(no|na|do|da|em)\s)", texto)
            achados = []
            cands = sorted((m for u in ufs for m in por_uf.get(u, [])), key=lambda m: -len(m[2]))
            for cod, nome, n in cands:
                if n in COMUNS and not em_lista(n):
                    continue  # nome que também é palavra comum/estado: só vale em lista de municípios
                padrao = r"(?<![a-z0-9])" + re.escape(n) + r"(?![a-z0-9])"
                if re.search(padrao, texto):
                    achados.append(cod)
                    texto = re.sub(padrao, ' ', texto)  # evita "Santana" dentro de "Santana do Livramento"
            # IG com o nome do próprio estado ("Paraíba", "Piauí", "Espírito Santo"): o estado inteiro
            if not achados and len(ufs) == 1 and norm(r.get('nome', '')).strip() in UF_NOMES:
                todo_estado = True
            if not achados and todo_estado and len(ufs) == 1:
                achados = [c for c, _, _ in por_uf.get(ufs[0], [])]
            saida.append({
                'numero': r.get('numero'),
                'nome': r.get('nome'),
                'produto': r.get('produto'),
                'especie': especie,
                'ufs': ufs,
                'data': r.get('data'),
                'alterado': r.get('alterado'),
                'municipios': sorted(achados),
                'revisar': not achados,
                'delimitacao': r.get('delimitacao', '')[:600],
            })
    import os
    os.makedirs('public/dados/inpi', exist_ok=True)
    json.dump({'fonte': 'INPI · listas de IP (até 27/10/2026) e DO (até 20/10/2026) reconhecidas', 'igs': saida}, open('public/dados/inpi/indicacoes-geograficas.json', 'w'), ensure_ascii=False)
    com = [i for i in saida if i['municipios']]
    print(f"{len(saida)} IGs brasileiras · {len(com)} com municípios identificados · {len(saida) - len(com)} para revisar")


if __name__ == '__main__':
    main(*sys.argv[1:3])
