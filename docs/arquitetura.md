# Arquitetura Atual do Frontend

Este projeto foi reorganizado para o padrão `core / shared / features`, com foco em:

- separar responsabilidades por camada;
- carregar domínios por `lazy loading`;
- manter componentes transversais em `shared`;
- deixar `app.routes.ts` como ponto de composição, e não como lugar de regra de negócio.

## Visão Geral

```text
src/app/
  core/       -> autenticação, usuário, permissões, guards e serviços base do app
  shared/     -> componentes, layouts e serviços reutilizáveis entre features
  features/    -> domínios de negócio isolados por área funcional
  app.routes.ts -> composição global de rotas
```

## Como O App Funciona

1. `app.routes.ts` define apenas as rotas principais.
2. Cada domínio expõe seu próprio `routes.ts`.
3. As rotas de feature usam `loadChildren`.
4. Componentes de página são carregados de forma preguiçosa e dependem só do que a feature precisa.
5. Layouts e componentes compartilhados vêm de `shared`.

Exemplo de fluxo:

```text
app.routes.ts -> features/planejamento/routes.ts -> pages/widgets/services da feature
```

## Responsabilidade De Cada Camada

### `core`

Contém o que é estrutural para a aplicação inteira:

- autenticação e login;
- usuário e sessão;
- permissões de rota;
- guards;
- serviços globais que não pertencem a um domínio de negócio específico.

Regra prática: se o código é usado por toda a aplicação e não representa uma feature, ele vai para `core`.

### `shared`

Contém código reutilizável entre várias features:

- componentes genéricos;
- layouts;
- navegação visual;
- serviços utilitários;
- controles transversais, como tabela dinâmica e formulário dinâmico.

Regra prática: se o componente ou serviço aparece em mais de uma feature e não carrega regra de negócio de um domínio, ele vai para `shared`.

### `features`

Cada feature isola um domínio funcional.

Estrutura esperada:

```text
features/minha-feature/
  routes.ts
  pages/
  widgets/
  components/
  stores/
  services/
  api/
  models/
```

Regra prática: regra de negócio de domínio fica dentro da feature, mesmo que seja compartilhada por várias telas daquela feature.

## Padrões De Implementação

### 1. Rotas por feature

Cada área funcional deve expor `routes.ts`.
O arquivo raiz só agrega essas rotas.

### 2. Componentes standalone

Os componentes do projeto estão organizados como `standalone` quando fazem sentido para lazy loading e reutilização explícita.

### 3. Importação por alias canônico

Use paths como:

- `@/app/core/...`
- `@/app/shared/...`
- `@/app/features/...`

Evite voltar para caminhos legados de raiz.

### 4. Serviços com responsabilidade clara

Use o nome do arquivo para indicar o papel:

- `*.api.service.ts` para integração com backend;
- `*.store.service.ts` para estado;
- `*.facade.ts` ou `*Startup.service.ts` para orquestração de tela, quando fizer sentido;
- `*.guard.ts` para controle de acesso.

### 5. Componente genérico não deve conhecer domínio

Exemplo: `table-dynamic` foi movido para `shared/components/table-dynamic`.
Ele recebe `tableModel` e `data`, mas não sabe nada sobre Planejamento, Portaria ou Estrutura.

## Boas Práticas Adotadas

- Lazy loading por feature para reduzir custo inicial.
- Separação entre estado, API e UI.
- Reutilização em `shared` sem duplicar código.
- Layouts centralizados para evitar duas árvores concorrentes.
- `app.routes.ts` curto e previsível.
- Código de domínio fora da raiz do app.

## O Que Não Deve Ser Feito

- criar novas páginas de domínio em `src/app/pages`;
- criar widgets de negócio em `src/app/widgets`;
- criar serviços de domínio em `src/app/services`;
- importar feature em outra feature por caminho profundo sem necessidade;
- colocar regra de negócio dentro de `shared`.

## Convenções De Trabalho

- Se mudar uma feature, mantenha a responsabilidade dentro dela.
- Se o componente for compartilhado entre áreas, mova para `shared`.
- Se o código for transversal e estrutural, mova para `core`.
- Se a mudança criar uma nova rota, ela deve nascer em `features/<dominio>/routes.ts`.

## Estado Atual

O projeto já está organizado em `core / shared / features` e o build passa com a nova estrutura.
Os caminhos legados de raiz foram removidos, e a navegação principal está centralizada em rotas de feature.

## Resumo Prático

Use esta regra para decidir o destino de um arquivo:

- `core`: base da aplicação;
- `shared`: reutilizável entre features;
- `features`: domínio de negócio;
- `app.routes.ts`: apenas composição.

