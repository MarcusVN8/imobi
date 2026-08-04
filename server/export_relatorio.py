#!/usr/bin/env python3
"""Serviço Python específico: exporta relatório do Imobi em PDF.
Recebe path de um JSON com {fluxo, pizza, ocupacao} e gera um PDF via
pandoc + xelatex (pipeline já usado nos labs do Marcus). Sem libs externas.
Uso: python3 export_relatorio.py <arquivo.json>
Imprime o caminho absoluto do PDF gerado (stdout) para o Node fazer download.
"""
import sys, json, os, tempfile, subprocess
from datetime import date

BRL = lambda n: f"R$ {float(n):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def main():
    if len(sys.argv) < 2:
        print("Uso: export_relatorio.py <arquivo.json>", file=sys.stderr); sys.exit(1)
    with open(sys.argv[1], encoding="utf-8") as f:
        data = json.load(f)

    fluxo = data.get("fluxo", [])
    pizza = data.get("pizza", [])
    ocup = data.get("ocupacao", [])

    md = []
    md.append("# Relatório Imobi — Gestão Imobiliária")
    md.append(f"**Gerado em:** {date.today():%d/%m/%Y}\n")

    md.append("## Fluxo de caixa (Receita × Despesa)")
    md.append("| Mês | Receita | Despesa | Saldo |")
    md.append("|---|---|---|---|")
    for r in fluxo:
        rec = float(r.get("receita", 0)); desp = float(r.get("despesa", 0))
        md.append(f"| {r.get('mes')} | {BRL(rec)} | {BRL(desp)} | {BRL(rec-desp)} |")

    md.append("\n## Distribuição do portfólio")
    md.append("| Categoria | % |")
    md.append("|---|---|")
    for p in pizza:
        md.append(f"| {p.get('label')} | {p.get('valor')}% |")

    md.append("\n## Ocupação mensal")
    md.append("| Mês | Ocupação |")
    md.append("|---|---|")
    for o in ocup:
        md.append(f"| {o.get('mes')} | {o.get('valor')}% |")

    md.append("\n> Documento fictício gerado para demonstração (dados de exemplo).")

    tmpdir = tempfile.mkdtemp(prefix="imobi_")
    md_path = os.path.join(tmpdir, "relatorio.md")
    pdf_path = os.path.join(tmpdir, "relatorio-imobi.pdf")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    try:
        subprocess.run(
            ["pandoc", md_path, "-o", pdf_path, "--pdf-engine=xelatex",
             "-V", "geometry:margin=2cm", "-V", "lang=pt-BR"],
            check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print("ERRO pandoc:\n" + e.stderr, file=sys.stderr); sys.exit(1)

    # stdout = caminho do PDF (Node faz r.download)
    print(pdf_path)

if __name__ == "__main__":
    main()
