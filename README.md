# AgendaFront

Frontend do projeto Agenda de Contatos em Vue.js.

O layout usa Tailwind CSS integrado ao Vite, e o estado da aplicacao usa Pinia.

## Requisitos

- Node.js
- API CoreFlow rodando localmente em `http://localhost:5062` ou via Docker em `http://localhost:5088`

## Como rodar

```bash
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

Crie um `.env` a partir do `.env.example` quando precisar mudar portas ou destinos:

```bash
cp .env.example .env
```

## Testes unitarios

```bash
npm run test:unit
```

Os testes usam Vitest, Vue Test Utils e jsdom.

## Login JWT

O login usa o endpoint real `POST /api/Auth/login` do CoreFlow e salva a sessão JWT em
`localStorage`. O guard de rotas valida sessões persistidas em `GET /api/Auth/authenticate`,
e o CRUD envia `Authorization: Bearer <token>` em todas as chamadas protegidas.

Credenciais seedadas do backend para desenvolvimento:

- E-mail: `admin@coreflow.local`
- Senha: `Admin@123456`

## API

Por padrão, o browser chama sempre `VITE_API_BASE_URL=/api`.

Essa rota é encaminhada por proxy:

- Local com Vite: `/api` -> `VITE_CORE_FLOW_LOCAL_TARGET`
- Container com Nginx: `/api` -> `VITE_CORE_FLOW_DOCKER_TARGET`

Variáveis do front:

```env
VITE_API_BASE_URL=/api
VITE_FRONTEND_PORT=5173
VITE_MAILPIT_URL=http://localhost:8025

# Backend targets for local frontend development.
VITE_CORE_FLOW_LOCAL_TARGET=http://localhost:5062
VITE_CORE_FLOW_DOCKER_HOST_TARGET=http://localhost:5088

# Active target used by the Vite dev proxy.
VITE_CORE_FLOW_DEV_TARGET=http://localhost:5088

# Target used by the frontend container/Nginx proxy.
VITE_CORE_FLOW_DOCKER_TARGET=http://host.docker.internal:5088
```

Cenários comuns:

- Front local + API local via `dotnet run`: use `VITE_CORE_FLOW_DEV_TARGET=http://localhost:5062`.
- Front local + API em Docker: use `VITE_CORE_FLOW_DEV_TARGET=http://localhost:5088`.
- Front em Docker + API em Docker publicada no host: use `VITE_CORE_FLOW_DOCKER_TARGET=http://host.docker.internal:5088`.
- Front e API no mesmo `docker-compose`/network: use `VITE_CORE_FLOW_DOCKER_TARGET=http://coreflow_api:8080`.

Manter `VITE_API_BASE_URL=/api` evita depender de CORS no backend, porque o proxy faz a ponte.

### Plataforma de e-mail de teste no toast

Depois de cadastrar, editar ou remover um contato, o toast de sucesso pode exibir o link do Mailpit (`VITE_MAILPIT_URL`) para visualizar os e-mails gerados pelo Worker. Esse link aparece apenas quando o frontend estiver rodando em ambiente local ou Docker local, como `localhost`, `127.0.0.1` ou IPs privados (`192.168.x.x`, `10.x.x.x`, `172.16.x.x` a `172.31.x.x`).

Em produção, como Render ou outro domínio público, o toast continua mostrando a confirmação positiva (`Contato cadastrado.`, `Contato atualizado.` ou `Contato removido.`), mas oculta o caminho do Mailpit.

Endpoints consumidos:

- `POST /api/Auth/login`
- `GET /api/Auth/authenticate`
- `GET /api/User`
- `GET /api/User/{id}`
- `POST /api/User`
- `PUT /api/User/{id}`
- `PATCH /api/User/me/password`
- `DELETE /api/User/{id}`

No cadastro (`POST /api/User`), o front exibe apenas `name`, `email` e `phone`, e envia
`password` internamente com o valor default `Admin@123456`.
Na edição (`PUT /api/User/{id}`), o backend recebe apenas `id`, `name`, `email` e `phone`;
alterações de contato não alteram senha.

A troca de senha usa `PATCH /api/User/me/password`, sempre com base no usuário autenticado
pelo JWT. A tela permite alterar apenas a própria senha.

No backend CoreFlow não há arquivo `.env`. Os equivalentes são:

- `CoreFlow.API/Properties/launchSettings.json`: define a porta local `http://localhost:5062`.
- `CoreFlow.API/appsettings.json`: define configurações da API, incluindo connection string.
- `docker-compose.yml` do backend: define `ASPNETCORE_URLS=http://+:8080` e publica `5088:8080`.

## Docker

Com a API CoreFlow rodando pelo `docker-compose` dela, o backend fica exposto no host em `http://localhost:5088`.

Para subir o front em container:

```bash
docker compose up --build
```

A aplicação ficará disponível em `http://localhost:5173`.

O container usa Nginx para servir o build estático e encaminha chamadas `/api` para `VITE_CORE_FLOW_DOCKER_TARGET`, que por padrão é:

```bash
http://host.docker.internal:5088
```

Se a API estiver em outro endereço, ajuste no `.env`:

```env
VITE_CORE_FLOW_DOCKER_TARGET=http://seu-host:porta
```
