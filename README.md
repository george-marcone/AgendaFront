# AgendaFront

Frontend do projeto Agenda de Contatos em Vue.js.

## Requisitos

- Node.js
- API CoreFlow rodando em `http://localhost:5062`

## Como rodar

```bash
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

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
