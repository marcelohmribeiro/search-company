# Search Company — Contexto do projeto

> Resumo das decisões tomadas até 16/10/2026, para retomar o trabalho (ou passar para outra sessão do Claude) sem perder o fio.

## Objetivo

Encontrar empresas no Google Maps que **ainda não têm site** e oferecer a criação de um site para elas. A aplicação roda **só local** e serve para buscar, filtrar e acompanhar esses leads.

## Fonte dos dados: Google Places API (New)

- Usar a **API oficial** (Text Search da Places API New), e não scraping do Google Maps. Ferramentas como Apify e Outscraper fazem scraping, o que vai contra os termos do Google.
- Busca no formato `"<categoria> em <bairro>, <cidade>"`, por exemplo `"barbearia em Aldeota, Fortaleza"`.
- Cada requisição retorna até **20 resultados**. Com paginação (`nextPageToken`), chega a no máximo **60 por busca**, e **cada página conta como uma requisição**.
- Para cobrir uma cidade, dividir as buscas por **categoria × bairro**.

### Chamada

```
POST https://places.googleapis.com/v1/places:searchText
X-Goog-Api-Key: <GOOGLE_MAPS_API_KEY>
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus,nextPageToken

{ "textQuery": "...", "languageCode": "pt-BR", "regionCode": "BR", "pageSize": 20, "pageToken": "..." }
```

Pedir **só os campos necessários**: o field mask define a faixa de preço da chamada.

### Custos

Dados da época; conferir a tabela atual antes de escalar.

- Desde 01/03/2025 não existe mais o crédito mensal de US$ 200. Agora há cotas gratuitas **por tipo de chamada (SKU)**.
- Como pedimos telefone e site, a Text Search cai na faixa **Enterprise**: **1.000 requisições grátis/mês** e depois cerca de **US$ 35 a cada 1.000** (uns R$ 0,20 por requisição).
- A cobrança é **por requisição, não por resultado**: 1.000 requisições × 20 resultados dão até ~20 mil empresas/mês sem custo.
- No cadastro do cartão, o Google faz uma **pré-autorização de R$ 125**. Ela não é cobrada e some sozinha em alguns dias (até ~1 semana, dependendo do banco).

### Proteção contra cobrança

O Google **não tem um bloqueio nativo** para quando a cota gratuita acaba, e na Places API (New) as cotas do console são **por minuto**, não por dia. A proteção fica assim:

1. **Contador mensal no backend** (principal): trava em **950 requisições/mês** e recusa novas buscas até virar o mês.
2. **Cota por minuto** do Text Search baixa no console (por exemplo 10/min), para frear um loop com bug.
3. **Alerta de orçamento** de R$ 5. Ele só manda e-mail, não bloqueia.
4. **Chave restrita** só à Places API (New), guardada no `.env` do backend. A chave nunca vai para o front nem para o git.

Existe uma solução oficial que desliga o faturamento automaticamente (budget + Pub/Sub + Cloud Function), mas ela foi descartada por ser complexa para esse uso.

## Status do Google Cloud

- [x] Projeto criado: `prospeccao-sites`
- [x] Conta de faturamento criada e vinculada (cartão cadastrado)
- [x] Questionário de onboarding do Google Maps Platform respondido
- [ ] Confirmar que a **Places API (New)** está ativada
- [ ] Chave de API criada (o onboarding pode ter gerado uma automaticamente) e **restrita** à Places API (New)
- [ ] Cota por minuto do Text Search ajustada
- [ ] Alerta de orçamento criado
- [ ] Chave salva em `base-node/.env` como `GOOGLE_MAPS_API_KEY`

Links:

- Credenciais: https://console.cloud.google.com/apis/credentials
- Places API (New): https://console.cloud.google.com/apis/library/places.googleapis.com
- Cotas: https://console.cloud.google.com/apis/api/places.googleapis.com/quotas
- Orçamentos: https://console.cloud.google.com/billing/budgets
- Docs da Text Search: https://developers.google.com/maps/documentation/places/web-service/text-search
- Preços: https://developers.google.com/maps/billing-and-pricing/pricing

## Estrutura do repositório

Monorepo `search-company` (`git@github.com-personal:marcelohmribeiro/search-company.git`):

| Pasta | Origem | Stack |
|---|---|---|
| `base-node/` | base própria de backend | Node, Express 5, Prisma 7 (`@prisma/adapter-pg`), JWT, dotenv, plop |
| `web/` | `web/` do commit `8ce3e3d` do repo `games-platform` (o "first commit", antes do Jogaí) | React 19, Vite, Tailwind CSS v4, React Router 7, Zustand, axios (bun) |

## Aplicação planejada

### Backend (`base-node`)

- Endpoint que recebe uma lista de categorias × bairros (+ cidade), roda as buscas na Places API respeitando o contador mensal e devolve quantos leads novos entraram.
- Persiste os leads com **deduplicação pelo `places.id`**: a mesma empresa pode aparecer em várias buscas.
- Classifica o `websiteUri` de cada lead:
  - vazio → **sem site**
  - `instagram.com` → **só Instagram**
  - `wa.me` / `api.whatsapp.com` → **só WhatsApp**
  - `facebook.com` → **só Facebook**
  - `linktr.ee` e similares → **agregador de links**
  - qualquer outro → **tem site**: provavelmente não é lead, mas vale conferir
- Endpoint de uso: requisições usadas e restantes no mês.
- CRUD de status e anotações de cada lead, além da exportação em CSV.

### Frontend (`web`)

- **Busca:** seleção de cidade, categorias e bairros; mostra o contador de requisições restantes no mês.
- **Leads:** tabela com filtros por situação do site, nota mínima, nº mínimo de avaliações, categoria, bairro e status.
- **Cada lead:** link para o Google Maps, botão de WhatsApp (conversa individual), anotações e status (`novo` → `contatado` → `respondeu` → `fechado` / `descartado`).
- **Exportar CSV.**

### Decisões em aberto

- **Banco:** a `base-node` usa Prisma com Postgres (`adapter-pg`). Para rodar 100% local sem subir banco, dá para trocar o provider do Prisma para **SQLite**.
- **TypeScript ou JavaScript:** a `base-node` está em JS, e o `web` mistura `.jsx`/`.tsx` com `tsconfig`.
- **Cidade:** provavelmente Fortaleza. Categorias e bairros vão ser escolhidos na interface.

## Abordagem comercial (lembretes)

- **Priorizar** empresas com nota boa e muitas avaliações: elas têm clientes e dinheiro girando.
- "Sem site no Maps" não garante que a empresa não tenha site, então **conferir antes de abordar**.
- Empresas que usam Instagram ou WhatsApp no lugar de site também são leads, e isso é um bom argumento de venda.
- **Nada de disparo em massa** no WhatsApp (bloqueio + spam). Mandar mensagem individual e personalizada.
- Tática forte: mandar um **print de uma prévia do site** já com o nome e as fotos do negócio.
