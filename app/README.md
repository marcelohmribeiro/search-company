# Search Company — Web

React 19 + Vite + Tailwind CSS v4 + React Router 7. Telas de busca de empresas e de acompanhamento de leads; o backend fica em `../api`.

## Scripts

```bash
bun install
bun dev
bun run build
bun run lint
```

## Variáveis de ambiente

Copie `.env.example` para `.env`:

- `VITE_APP_NAME` — nome do app
- `VITE_API_URL` — URL do backend (`http://localhost:3333`)

## Estrutura

```
src/
├── components/        # componentes compartilhados (badges, modal do lead)
├── config/            # settings a partir das env vars
├── constants/         # rótulos em português dos enums
├── css/               # entrada do Tailwind
├── hooks/
├── lib/               # helpers (telefone/WhatsApp)
├── pages/             # index.tsx (Busca), leads/ e layout.tsx
├── routes/            # createBrowserRouter
├── services/          # _api.ts (axios) e serviços por recurso
├── store/             # stores zustand (uso do mês)
└── types/
```
