# Repository Guidelines

## Project Structure & Module Organization
This repository is currently documentation-first. The main artifact is [docs/相机漂流小程序需求分析文档.pdf](/home/yichw/CameraBorrow/docs/%E7%9B%B8%E6%9C%BA%E6%BC%82%E6%B5%81%E5%B0%8F%E7%A8%8B%E5%BA%8F%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90%E6%96%87%E6%A1%A3.pdf), which defines the scope for the campus camera borrowing mini-program and the equipment management workflow.

When code is added, keep a simple top-level layout:
- `docs/` for requirements, design notes, and exported PDFs.
- `src/` for application code.
- `tests/` for automated tests that mirror `src/`.
- `assets/` for static images, sample UI assets, or seeded reference data.

Prefer feature-oriented folders such as `src/borrow/`, `src/inventory/`, and `src/admin/`.

## Build, Test, and Development Commands
There is no build system committed yet. Add project commands together with the first runnable code and document them in the root `README`.

Expected baseline commands once tooling exists:
- `npm install` or equivalent: install dependencies.
- `npm run dev`: start local development.
- `npm test`: run unit and integration tests.
- `npm run lint`: check formatting and style.

If you introduce another stack, keep command names conventional and update this guide in the same change.

## Coding Style & Naming Conventions
Use UTF-8 and keep source files formatted automatically by the project’s chosen formatter. Default to 2-space indentation for frontend code and JSON/YAML, and 4 spaces for Python if Python is introduced.

Use descriptive, domain-based names:
- `kebab-case` for directories.
- `camelCase` for JavaScript or TypeScript variables/functions.
- `PascalCase` for components and classes.
- Clear business terms such as `borrowRequest`, `returnRecord`, and `deviceStatus`.

## Testing Guidelines
Place tests under `tests/` or beside modules if the chosen framework prefers co-location. Name tests after the behavior they verify, for example `borrow-request.spec.ts` or `test_inventory_status.py`.

Add tests for approval flow, overdue handling, and inventory state changes before merging business logic changes.

## Commit & Pull Request Guidelines
Git history currently starts with a single `init` commit, so there is no strong convention yet. Use short, imperative commit messages such as `Add inventory schema` or `Document admin approval flow`.

Pull requests should include:
- A concise summary of the change.
- Linked requirement section or issue.
- Screenshots or flow notes for UI changes.
- Notes on new commands, config, or data model changes.

## Security & Configuration Tips
Do not commit real student data, access tokens, or internal credentials. Keep environment-specific values in ignored config files such as `.env.local`, and document required variables in `README`.
