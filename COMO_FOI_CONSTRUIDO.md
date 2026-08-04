# Imobi — Como o front-end foi construído (catálogo do raciocínio)

Reconstrução da especificação "SaaS Imobi" (Lovable) em **HTML + CSS + JavaScript puro**,
sem frameworks. Objetivo: corrigir os "pilares mal construídos" do original
(front-end sem refinamento, CSS solto, sem hierarquia) e entregar algo que uma
pessoa entende de cabo a rabo.

---

## 1. Por que essa stack?
A doc original usa React 19 + TanStack + Tailwind + shadcn + Recharts (stack pesada).
A restrição do pedido foi: HTML/CSS/JS vanilla, "mecanismos de maior conhecimento
humano". Então cada peça da stack do Lovable foi reimplementada com o que todo dev
de frente domina:

| Lovable usava | O que fiz aqui | Por quê |
|---|---|---|
| Tailwind + tokens | `css/design.css` com `:root`/`.dark` (variáveis CSS) | Um único lugar com a "paleta e as regras" — o pilar que faltava |
| shadcn/Radix (UI) | Helpers `window.UI.*` (StatCard, Badge, Table, Tabs, EmptyState) | Componentes reutilizáveis, sem dependência de biblioteca |
| lucide-react (ícones) | `js/icons.js` (SVG inline próprio) | Sem CDN/bundle; controle total do traço |
| Recharts | `js/charts.js` (SVG puro calculado à mão) | Área/barra/linha/pizza desenhados com matemática de eixos |
| TanStack Router (file-based) | Roteador por hash (`#/imoveis`) | Funciona abrindo o `index.html` direto (file://), ideal p/ VM sem servidor |
| React Hook Form + Zod | `afterRender` com listeners simples | Validação/filtros diretos no DOM, legíveis |
| Motion (animações) | `@keyframes` CSS + stagger por `animation-delay` | Entrada dos KPIs sem JS de animação |

---

## 2. A fundação (não pular etapa)
Antes de escrever 1 componente, fixei o **design system** (seção 4 da doc) em
`css/design.css`:
- Tokens de cor light/dark, cada um com `--cor-rgb` para conseguir o efeito
  "fundo cor/10, borda cor/20" dos badges (convenção da doc).
- Tipografia Inter, escala de 4px, raios (`--r-card` 22px, `--r-xl` 18px, etc.),
  sombras soft/elevated.
- Chrome do AppShell: sidebar 256px fixa, topbar 64px sticky com blur, main com
  padding 16/32px e max-width 1600px.
- Grids responsivos: KPIs 2col→4col, blocos 3col, cards de entidade 1→2→3col.

Se eu tivesse espalhado cores hardcoded pelos arquivos, voltaria ao caos do original.

---

## 3. Estrutura de arquivos (pilares separados)
```
imobi/
├─ index.html        # bootstrap de tema no <head> (sem flash) + ordem dos scripts
├─ css/design.css    # design system (o pilar central)
└─ js/
   ├─ icons.js       # SVG inline (substituto do lucide)
   ├─ theme.js       # dark/light + localStorage
   ├─ dados.js       # mocks fiéis à seção 5 + helpers de componente (UI.*)
   ├─ charts.js      # gráficos SVG puros (area/barra/linha/pizza)
   ├─ app.js         # AppShell + roteador por hash
   └─ pages.js       # 13 páginas + fios de interação (afterRender)
```

Separação clara evita o "CSS/JS emaranhado" que o original criticava.

---

## 4. Decisões de "pessoa normal", não de máquina
- **Roteador por hash**: abre com duplo-clique no `index.html`, sem `npm install`.
- **Tema sem flash**: script inline no `<head>` aplica `.dark` antes da pintura.
- **Tooltips nativos** (`<title>` no SVG): acessíveis, zero JS extra.
- **Skeleton de loading** (seção 6): pequeno delay antes de montar a view — dá
  sensação real de carregamento mesmo com dados estáticos.
- **Microinterações discretas**: hover eleva o card (`shadow-soft → elevated`),
  linhas mudam de fundo, foco ganha ring na cor primária.
- **Estados vazios** com ícone + CTA (seção 6) em vez de tela em branco.
- **Acessibilidade**: HTML semântico (header/nav/main/section), `aria-label`,
  foco visível, contraste respeitado nos tokens.

---

## 5. Como foi verificado (não afirmei, testei)
1. `node --check` em todos os `.js` → sintaxe OK.
2. Smoke test (`_smoke.js`): simula DOM mínimo, executa as 13 rotas e o
   `afterRender` de cada uma → "TODAS AS ROTAS OK".
3. `python3 -m http.server` + `curl` → todos os assets respondem HTTP 200.

---

## 6. Como abrir e usar
- **Modo fácil**: abra `index.html` no navegador (duplo-clique).
- **Modo servidor** (recomendado p/ tema/cache): `python3 -m http.server` na pasta
  e acesse `http://localhost:8000`.
- Navegação pela sidebar; toggle de tema no sino/claro/escuro (topbar);
  em telas < 1024px a sidebar vira um "Sheet" lateral pelo botão de menu.
- Filtros de Imóveis e abas de Cobranças/Configurações funcionam ao vivo.

## 7. Pontos que a doc avisou serem "(aprox.)" / não testados
- Cores dark exatas (OKLCH do Lovable) → usei os valores aproximados informados.
- Loading/skeleton era descritivo → implementei um skeleton real simples.
- Valores monetários são strings pt-BR (mock); em produção usar
  `Intl.NumberFormat("pt-BR")` (helper `Data.BRL` já pronto).
