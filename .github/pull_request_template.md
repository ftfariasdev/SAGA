<!--
  EN: PR title = Conventional Commit + task ID, e.g. `refactor(erros): [F1] adiciona error handler global`.
      Target branch (Git Flow): `develop` for feature/ and bugfix/; `main` for release/ and hotfix/.
      See CONTRIBUTING.md.
  PT: Título do PR = Conventional Commit + ID da task, ex.: `refactor(erros): [F1] adiciona error handler global`.
      Branch de destino (Git Flow): `develop` para feature/ e bugfix/; `main` para release/ e hotfix/.
      Veja docs/pt-BR/CONTRIBUTING.md.
-->

## Task / Tarefa

<!--
  EN: Backlog ID (e.g. F1) and the issue this PR resolves.
  PT: ID do backlog (ex.: F1) e a issue que este PR resolve.
-->

Closes #

## What changes / O que muda

<!--
  EN: What changed and why. Mention front-end impact here (or write "none").
  PT: O que mudou e por quê. Registre aqui o impacto no front-end (ou escreva "nenhum").
-->

## How to test / Como testar

<!--
  EN: Commands or requests that prove it works.
  PT: Comandos ou requisições que comprovam que funciona.
-->

```bash

```

## Checklist

- [ ] The API starts and the affected routes work / A API sobe e as rotas afetadas funcionam
- [ ] `npm run lint` and `npm run format:check` pass (plus `npm test` once [T1] #31 lands) / `npm run lint` e `npm run format:check` passam (e `npm test` quando a [T1] #31 entrar)
- [ ] Docs updated in EN-US and PT-BR, including `docs/api-reference.md` if the contract changed / Docs atualizadas em EN-US e PT-BR, incluindo `docs/api-reference.md` se o contrato mudou
- [ ] Front-end impact recorded in the description (or "none") / Impacto no front-end registrado na descrição (ou "nenhum")
- [ ] No secrets in the diff / Nenhum segredo no diff
- [ ] No response returns `senha` / Nenhuma resposta devolve `senha`
