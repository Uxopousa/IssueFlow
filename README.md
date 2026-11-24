# IssueFlow

> A responsive Angular issue tracker MVP built with a human-supervised Codex subagent workflow.

[![Build and deploy to GitHub Pages](https://github.com/Uxopousa/IssueFlow/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/Uxopousa/IssueFlow/actions/workflows/pages.yml)

IssueFlow is a frontend MVP for creating, tracking, and managing issues in the
browser. It is built with Angular and stores data locally in the current browser.

> **Project status:** The frontend MVP is complete. A backend is planned for a
> future stage; this version does not include a server, API, user accounts, or
> synchronization between browsers or devices.

## Features

- Dashboard with live issue statistics.
- Issue list with text search and combined status and priority filters.
- Create, view, edit, resolve, and delete issues.
- Form validation with clear field-level feedback.
- Local persistence with visible feedback when browser storage is unavailable.
- Responsive layouts and keyboard-accessible navigation.

## AI-assisted development

IssueFlow also demonstrates a human-supervised development workflow with Codex
subagents and repository-local skills. The agents are configured in
`.codex/agents/` with GPT-6 Luna and high reasoning effort.

| Agent         | Responsibility                                                                                |
| ------------- | --------------------------------------------------------------------------------------------- |
| **Planner**   | Inspects the request, roadmap, requirements, and code; proposes a plan without editing files. |
| **Developer** | Implements only an explicitly approved plan and runs the relevant checks.                     |
| **Reviewer**  | Independently reviews the changes and reports findings without editing files.                 |

The default workflow handles one feature at a time. It pauses for human approval
after planning, then runs Developer, independent review, any accepted corrections,
and final checks. Only after review and verification does the coordinator update
the roadmap. An optional batch mode requires an explicit request and approved
roadmap IDs; it processes them sequentially, limits each feature to two correction
rounds, and stops on unresolved findings, failed checks, or scope questions. It
never commits or pushes automatically.

Local skills provide focused guidance for accessibility, Angular, clean code and
architecture, frontend design, issue-domain rules, and testing. The
`feature-development` skill is the entry point to the central workflow, whose
rules live in [`ai/workflows/feature-development.md`](ai/workflows/feature-development.md).
Shared instructions are in [`AGENTS.md`](AGENTS.md); product scope is in
[`docs/requirements.md`](docs/requirements.md), technical structure in
[`docs/architecture.md`](docs/architecture.md), and verified MVP progress in
[`docs/roadmap.md`](docs/roadmap.md). Post-MVP backend decisions and stages are in
[`docs/backend-roadmap.md`](docs/backend-roadmap.md).

To start the workflow from Codex with the repository opened at its root, invoke
`$feature-development` followed by the feature request. Codex presents the plan
and waits for explicit approval before implementation. Agent and skill discovery
depends on the Codex version and interface; the workflow documents a manual
fallback when custom-agent delegation is unavailable.

## Tech stack

- Angular 21 with standalone components and TypeScript strict mode.
- Angular Signals for reactive application state.
- Reactive Forms for issue creation and editing.
- Tailwind CSS 4 for styling.
- Vitest for unit and component tests.
- Planned backend: ASP.NET Core on .NET 10 LTS with PostgreSQL, no accounts initially, and a
  local Docker workflow. See the backend roadmap for decisions and open items.

## Run locally

### Requirements

- Node.js supported by Angular 21: `20.19+`, `22.12+`, or `24.x`.
- npm `11.16.0` (the version declared by this repository).

See the [Angular version compatibility table](https://angular.dev/reference/versions)
for supported Node.js versions.

### Start the app

```bash
git clone https://github.com/Uxopousa/IssueFlow.git
cd IssueFlow
cd frontend
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200). Press `Ctrl+C` in the
terminal to stop the development server.

Issues are stored in the browser's `localStorage`. They are local to that browser
profile and are not sent to a server.

## GitHub Pages deployment

The workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml)
runs formatting, lint, tests, and a production build for pull requests and pushes
to `main`. A successful push to `main` is then deployed to GitHub Pages.

To enable publishing, open the repository's **Settings → Pages** and set the
build and deployment source to **GitHub Actions**. Once enabled, the demo will be
available at [uxopousa.github.io/IssueFlow](https://uxopousa.github.io/IssueFlow/).

## Project scripts

Run these commands from `frontend/`.

| Command                     | Description                           |
| --------------------------- | ------------------------------------- |
| `npm start`                 | Start the Angular development server. |
| `npm test -- --watch=false` | Run the test suite once.              |
| `npm run lint`              | Check the project with ESLint.        |
| `npm run format:check`      | Check formatting with Prettier.       |
| `npm run build`             | Create a production build in `dist/`. |

## Architecture

The frontend app is organized by responsibility:

- `frontend/src/app/core/` contains the issue model, validation, state, and local storage.
- `frontend/src/app/features/` contains the dashboard and issue pages.
- `frontend/src/app/shared/` contains reusable UI elements.

The UI calls Angular services for issue operations; components do not access
`localStorage` directly. See the [architecture](docs/architecture.md) and
[product requirements](docs/requirements.md) for more detail.

## Roadmap

The [MVP roadmap](docs/roadmap.md) records the completed frontend. The planned backend
direction, decisions, and staged work live in [docs/backend-roadmap.md](docs/backend-roadmap.md).
The `backend/` directory is reserved for the ASP.NET Core Web API and does not contain a
.NET project yet.
