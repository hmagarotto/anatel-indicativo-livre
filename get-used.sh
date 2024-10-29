wget 'https://www.anatel.gov.br/dadosabertos/paineis_de_dados/outorga_e_licenciamento/estacoes_licenciadas.zip'
mkdir estacoes_licenciadas
unzip estacoes_licenciadas.zip -d estacoes_licenciadas
cat estacoes_licenciadas/Estacoes_PY.csv | sed '1d'  | cut -d';' -f6 | egrep '^P[A-Z][0-9][A-Z]{2,3}' | sort -u > used.txt
rm -rf estacoes_licenciadas estacoes_licenciadas.zip
