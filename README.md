# AgendaFront

Frontend do projeto Agenda de Contatos em Vue.js.

O layout usa Tailwind CSS integrado ao Vite, e o estado da aplicacao usa Pinia.

## Requisitos

- Node.js
- API CoreFlow rodando em `http://localhost:5062`

## Como rodar

```bash
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

## Testes unitarios

```bash
npm run test:unit
```

Os testes usam Vitest, Vue Test Utils e jsdom.

## Login mockado

- E-mail: `gmarcone@gmail.com`
- Senha: `123456`

## API

Por padrão, o front usa `VITE_API_BASE_URL=/api` e o Vite encaminha as chamadas para `http://localhost:5062`.

Endpoints consumidos:

- `GET /api/User`
- `GET /api/User/{id}`
- `POST /api/User`
- `PUT /api/User/{id}`
- `DELETE /api/User/{id}`

Para mudar o destino do backend, crie um arquivo `.env` com base no `.env.example`.

## Docker

Com a API CoreFlow rodando pelo `docker-compose` dela, o backend fica exposto em `http://localhost:5088`.

Para subir o front em container:

```bash
docker compose up --build
```

A aplicação ficará disponível em `http://localhost:5173`.

O container usa Nginx para servir o build estático e encaminha chamadas `/api` para `API_PROXY_TARGET`, que por padrão é:

```bash
http://host.docker.internal:5088
```

Se a API estiver em outro endereço, ajuste no `docker-compose.yml`:

```yaml
environment:
  API_PROXY_TARGET: http://seu-host:porta
```
