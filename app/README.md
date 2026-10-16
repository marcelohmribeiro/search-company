# Games Platform — Web

React 19 + Vite + Tailwind CSS v4 + React Router 7.

## Scripts

```bash
bun install
bun dev
bun run build
bun run lint
```

## Variáveis de ambiente

Copie `.env.example` para `.env`:

- `VITE_APP_NAME` — nome do app (também usado como chave de persistência do auth no localStorage)
- `VITE_API_URL` — URL base da API

## Estrutura

```
src/
├── components/        # componentes compartilhados
├── config/            # settings a partir das env vars
├── constants/
├── css/               # entrada do Tailwind
├── hooks/
├── lib/
├── pages/             # páginas e layouts (index.tsx / layout.tsx por pasta)
├── routes/            # createBrowserRouter
├── services/          # _api.ts (axios + interceptors) e serviços por recurso
├── store/             # stores zustand
│   └── helpers/       # loading.ts (contador global de loading)
└── types/
```
