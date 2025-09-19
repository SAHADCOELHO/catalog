
# Allô Kapri — Catálogo (Server + Web)

## Como rodar
```bash
cd server
npm install
npm run dev
# abre http://127.0.0.1:5050  (e /web/index.html)
```

O servidor Express expõe:
- **/api/health** — teste
- **/api/catalog?market=AO|US** — catálogo derivado do Excel

## Onde colocar o teu Excel
Substitui o ficheiro em `server/data/allo-kapri-catalog-SPLIT.xlsx` pelo **teu** Excel.
**Requisitos das abas**:
- `prices_usados`: colunas mínimas: `model`, `market` (AO/US), `storage_gb`, `price`, `currency`
- `prices_novos`: mesmas colunas
- `products` (opcional): `model`, `image` (ex: `/products/iphone-11.jpg`)
- `colors` (opcional): `model`, `color_hex` (até 4 cores)
- `storages` (opcional)

## Imagens
Coloca as imagens em `web/public/products/` com nomes coerentes com a coluna `image` (ou `/products/<id>.jpg`). 
Há um `placeholder.png` para faltantes.

## Percentuais por cor
Edita `server/config/color-modifiers.json`. Padrão:
- gold: 8%
- titanium/silver/white/red/blue/green: 5–7%
- black: 0
- default: 5%

## Observações
- Modelos **sem preço** para a condição/GB/mercado escolhidos retornam como **Indisponível**.
- Reviews são limitados a **250** no front. 
- Selo “Desbloqueado para todas operadoras” apenas para iPhones.
- Botão “Encomendar no WhatsApp” abre uma mensagem com os detalhes selecionados.
