// Códigos IBGE das UFs
// Metadados das 27 UFs.
// pop: população (milhões, Censo IBGE 2022, arredondado).
// biomas: participação de cada bioma no território (%), calculada a partir dos polígonos
//   IBGE (Biomas 2019, via geobr/IPEA) cruzados com a malha das UFs.
// ATENÇÃO: valores de empresas/indicadores em indicadores.js são ILUSTRATIVOS.

export const REGIOES = {
  N: 'Norte',
  NE: 'Nordeste',
  CO: 'Centro-Oeste',
  SE: 'Sudeste',
  S: 'Sul',
};

export const UFS = [
  { sigla: 'AC', nome: 'Acre', regiao: 'N', capital: 'Rio Branco', pop: 0.83, biomas: { amazonia: 100 } },
  { sigla: 'AL', nome: 'Alagoas', regiao: 'NE', capital: 'Maceió', pop: 3.13, biomas: { mataAtlantica: 53, caatinga: 47 } },
  { sigla: 'AP', nome: 'Amapá', regiao: 'N', capital: 'Macapá', pop: 0.73, biomas: { amazonia: 100 } },
  { sigla: 'AM', nome: 'Amazonas', regiao: 'N', capital: 'Manaus', pop: 3.94, biomas: { amazonia: 100 } },
  { sigla: 'BA', nome: 'Bahia', regiao: 'NE', capital: 'Salvador', pop: 14.14, biomas: { caatinga: 62, mataAtlantica: 19, cerrado: 18 } },
  { sigla: 'CE', nome: 'Ceará', regiao: 'NE', capital: 'Fortaleza', pop: 8.79, biomas: { caatinga: 100 } },
  { sigla: 'DF', nome: 'Distrito Federal', regiao: 'CO', capital: 'Brasília', pop: 2.82, biomas: { cerrado: 100 } },
  { sigla: 'ES', nome: 'Espírito Santo', regiao: 'SE', capital: 'Vitória', pop: 3.83, biomas: { mataAtlantica: 100 } },
  { sigla: 'GO', nome: 'Goiás', regiao: 'CO', capital: 'Goiânia', pop: 7.06, biomas: { cerrado: 98, mataAtlantica: 2 } },
  { sigla: 'MA', nome: 'Maranhão', regiao: 'NE', capital: 'São Luís', pop: 6.78, biomas: { cerrado: 68, amazonia: 32 } },
  { sigla: 'MT', nome: 'Mato Grosso', regiao: 'CO', capital: 'Cuiabá', pop: 3.66, biomas: { amazonia: 57, cerrado: 37, pantanal: 6 } },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'CO', capital: 'Campo Grande', pop: 2.76, biomas: { cerrado: 62, pantanal: 27, mataAtlantica: 10 } },
  { sigla: 'MG', nome: 'Minas Gerais', regiao: 'SE', capital: 'Belo Horizonte', pop: 20.54, biomas: { cerrado: 54, mataAtlantica: 40, caatinga: 6 } },
  { sigla: 'PA', nome: 'Pará', regiao: 'N', capital: 'Belém', pop: 8.12, biomas: { amazonia: 99, cerrado: 1 } },
  { sigla: 'PB', nome: 'Paraíba', regiao: 'NE', capital: 'João Pessoa', pop: 3.97, biomas: { caatinga: 93, mataAtlantica: 7 } },
  { sigla: 'PR', nome: 'Paraná', regiao: 'S', capital: 'Curitiba', pop: 11.44, biomas: { mataAtlantica: 98, cerrado: 2 } },
  { sigla: 'PE', nome: 'Pernambuco', regiao: 'NE', capital: 'Recife', pop: 9.06, biomas: { caatinga: 84, mataAtlantica: 16 } },
  { sigla: 'PI', nome: 'Piauí', regiao: 'NE', capital: 'Teresina', pop: 3.27, biomas: { cerrado: 53, caatinga: 47 } },
  { sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'SE', capital: 'Rio de Janeiro', pop: 16.05, biomas: { mataAtlantica: 100 } },
  { sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'NE', capital: 'Natal', pop: 3.30, biomas: { caatinga: 96, mataAtlantica: 4 } },
  { sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'S', capital: 'Porto Alegre', pop: 10.88, biomas: { pampa: 67, mataAtlantica: 33 } },
  { sigla: 'RO', nome: 'Rondônia', regiao: 'N', capital: 'Porto Velho', pop: 1.58, biomas: { amazonia: 99, cerrado: 1 } },
  { sigla: 'RR', nome: 'Roraima', regiao: 'N', capital: 'Boa Vista', pop: 0.64, biomas: { amazonia: 100 } },
  { sigla: 'SC', nome: 'Santa Catarina', regiao: 'S', capital: 'Florianópolis', pop: 7.61, biomas: { mataAtlantica: 100 } },
  { sigla: 'SP', nome: 'São Paulo', regiao: 'SE', capital: 'São Paulo', pop: 44.41, biomas: { mataAtlantica: 81, cerrado: 19 } },
  { sigla: 'SE', nome: 'Sergipe', regiao: 'NE', capital: 'Aracaju', pop: 2.21, biomas: { caatinga: 55, mataAtlantica: 45 } },
  { sigla: 'TO', nome: 'Tocantins', regiao: 'N', capital: 'Palmas', pop: 1.51, biomas: { cerrado: 91, amazonia: 9 } },
];

export const UF_BY_SIGLA = Object.fromEntries(UFS.map((u) => [u.sigla, u]));
