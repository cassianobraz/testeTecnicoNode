# Projeto backend node

<p align="left">Este projeto é uma API backend desenvolvida com Node.js e Express, utilizando Prisma como ORM para interagir com o banco de dados. A API é responsável por gerenciar a leitura individualizada de consumo de água e gás através de imagens enviadas em base64.</p>

## Estrutura do Projeto

```
├───controllers
│   ├── confirmImage.spec.ts
│   ├── confirmImage.ts
│   ├── listCustom.spec.ts
│   ├── listCustom.ts
│   └── uploadImage.spec.ts
│   ├── uploadImage.ts
├───routes
│   └── imageRoutes.ts
└───services
    └── googleGeminiService.ts
```

## Endpoints

### POST `/upload`

<p align="left">Recebe uma imagem em base64, consulta o Google Gemini para obter a medição e retorna a medida lida pela API.</p>

### Request Body

```
{
  "image": "base64",
  "customer_code": "string",
  "measure_datetime": "datetime",
  "measure_type": "WATER" ou "GAS"
}
```

### Response:

- Status Code 200 OK

```
{
  "image_url": "string",
  "measure_value": integer,
  "measure_uuid": "string"
}
```

- Status Code 400 Bad Request

```
{
  "error_code": "INVALID_DATA",
  "error_description": "Descrição do erro"
}
```

- Status Code 409 Conflict

```
{
  "error_code": "DOUBLE_REPORT",
  "error_description": "Leitura do mês já realizada"
}
```

### PATCH `/confirm`

<p align="left">Confirma ou corrige o valor lido pelo Google Gemini.</p>

### Request Body

```
{
  "measure_uuid": "string",
  "confirmed_value": integer
}
```

### Response:

- Status Code 200 OK

```
{
  "success": true
}
```
- Status Code 400 Bad Request
```
{
  "error_code": "INVALID_DATA",
  "error_description": "Descrição do erro"
}
```
- Status Code 404 Not Found
```
{
  "error_code": "MEASURE_NOT_FOUND",
  "error_description": "Leitura não encontrada"
}
```
- Status Code 409 Conflict
```
{
  "error_code": "CONFIRMATION_DUPLICATE",
  "error_description": "Leitura já confirmada"
}
```
### GET `/<customerCode>/list`

<p align="left">Lista as medidas realizadas por um cliente específico. Pode filtrar por tipo de medição.</p>

### Request Parameters:

- `customerCode`: Código do cliente.

### Query Parameters:

- `measure_type`: Tipo de medição (WATER ou GAS). A validação é case insensitive.

### Response:

- Status Code 200 OK

```
{
  "customer_code": "string",
  "measures": [
    {
      "measure_uuid": "string",
      "measure_datetime": "datetime",
      "measure_type": "string",
      "has_confirmed": boolean,
      "image_url": "string"
    },
    {
      "measure_uuid": "string",
      "measure_datetime": "datetime",
      "measure_type": "string",
      "has_confirmed": boolean,
      "image_url": "string"
    }
  ]
}
```
- Status Code 400 Bad Request

```
{
  "error_code": "INVALID_TYPE",
  "error_description": "Tipo de medição não permitida"
}
```
- Status Code 404 Not Found

```
{
  "error_code": "MEASURES_NOT_FOUND",
  "error_description": "Nenhuma leitura encontrada"
}
```

# Estrutura de Código

## Controllers

<p align="left">Os controladores lidam com a lógica das rotas:</p>

- `confirmImage.ts`: Lida com a confirmação de imagens.
- `listCustom.ts`: Lida com a listagem de leituras para um cliente.
- `uploadImage.ts`: Lida com o upload de imagens.

## Routes

<p align="left">O arquivo `imageRoutes.ts` define as rotas da API e as associa aos controladores apropriados.</p>

## Services

<p align="left">Os serviços encapsulam a lógica de negócios e interagem com APIs externas:</p>

- `googleGeminiService.ts`: Serviço para análise de imagens com o Google Gemini.

# Instalação

<p align="left">Clone o repositório e instale as dependências:</p>

```
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_DIRETORIO>
pnpm install
```

## Uso

Inicie o servidor:
```
pnpm start
```
O servidor estará disponível em `http://localhost:3333`.

## Testes

Para executar os testes, utilize:
```
pnpm test
```

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).