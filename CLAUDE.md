# Notes for Claude sessions

- Read STATUS.md first; it says which build stage is next. Update it and commit at the end of every stage.
- `src/sim` must stay free of React/UI imports. Every handling rule from the Bicknell manual
  (docs/manual-notes.md) should have a direction test in `src/sim/*.test.ts`.
- Run `npm run typecheck && npm test` before committing.
