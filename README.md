# OpenVibe

A web UI for [OpenCode](https://opencode.ai). Chat, build, and code with AI through a landing page and workspace with full OpenCode server parity.

## Prerequisites

- [OpenCode](https://opencode.ai) server running (e.g. `opencode serve`)
- Node.js 18+
- pnpm

## Quick Start

1. **Start the OpenCode server** (in a separate terminal):

   ```bash
   opencode serve
   ```

   By default it listens on `http://127.0.0.1:4096`.

2. **Configure the UI**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your GitHub OAuth credentials and optional OpenCode URL
   ```

3. **Install and run the UI**:

   ```bash
   pnpm install
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Sign in with GitHub** to access projects and your repositories.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (public) |
| `/projects` | Projects dashboard (requires auth) |
| `/project/<name>?instanceId=<id>` | Workspace for a specific repo/project |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_BASE_URL` | OpenCode server URL | `http://127.0.0.1:4096` |
| `OPENCODE_SERVER_USERNAME` | HTTP basic auth username | (none) |
| `OPENCODE_SERVER_PASSWORD` | HTTP basic auth password | (none) |
| `OPENCODE_TIMEOUT_MS` | Request timeout in milliseconds | `120000` |
| `AUTH_SECRET` | NextAuth secret (run `openssl rand -base64 32`) | (required) |
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID | (required for sign-in) |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app client secret | (required for sign-in) |
| `AUTH_TRUST_HOST` | Set to `true` for localhost (fixes UntrustedHost in dev) | `true` recommended for dev |
| `OPENVIBE_REPOS_DIR` | Directory for cloned repos | `$TMPDIR/openvibe-repos` |

### GitHub OAuth Setup

1. Create a [GitHub OAuth App](https://github.com/settings/developers) (Settings → Developer settings → OAuth Apps)
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github` (or your production URL)
3. Copy the Client ID and Client Secret to `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`

## Features

- **Landing page** (`/`) – Sign in with GitHub; gradient hero; sign-out button
- **Dashboard** (`/projects`) – GitHub repo grid (clone & open), open local directory with native folder picker
- **Workspace** (`/project/<name>`) – URL-based routing with per-repo OpenCode instance
- **Sessions sidebar** – Create, rename, delete, fork, share sessions; action menu via portal
- **Chat panel** – AI messages with full Markdown rendering; copy-to-clipboard on all messages; shell command mode
- **Tool rendering** – Distinct visual cards for bash, read, edit, write, glob, grep, web, todo, patch per tool type
- **Review panel** – Inline LCS diff showing added/removed lines for all session file changes
- **File viewer** – Embedded pane with syntax highlighting
- **Tools panel** – .gitignore-aware file tree, symbol search, todo list
- **Live preview** – Iframe preview of a running dev server
- **Model chooser** – Select provider/model per message
- **Connection status** – Shows OpenCode port and working directory in navbar
- **Event streaming** – SSE with auto-reconnect; permission prompt overlay
- **Resizable panels** – All panels (sidebar, chat, file viewer, review, tools) drag-to-resize

## Project Structure

- `app/` – Next.js app router (pages, API routes)
- `app/page.tsx` – Landing page
- `app/projects/page.tsx` – Workspace (protected)
- `app/api/opencode/` – Proxy endpoints for OpenCode server
- `app/api/workspace/clone/` – Clone repo and spawn OpenCode instance
- `components/` – React UI components
- `lib/opencode/` – Server-only OpenCode client and config
- `lib/web/` – Browser API client, app store, and hooks
- `lib/workspace/` – Clone and spawn OpenCode instances for repos

## API Proxy Coverage

The UI proxies these OpenCode server endpoints:

- **Sessions**: list, create, get, update, delete, status, abort, children, fork, share, diff, todo, summarize, revert, unrevert, permissions
- **Messages**: list, send
- **Commands**: list, execute (slash commands, shell)
- **Files**: find (text, file, symbol), file content
- **Config**: config, providers
- **Provider**: list, auth
- **Events**: SSE stream

## Scripts

- `pnpm dev` – Start development server
- `pnpm build` – Production build
- `pnpm start` – Start production server
- `pnpm lint` – Run ESLint
- `pnpm test` – Run Vitest

## Learn More

- [OpenCode Documentation](https://opencode.ai/docs)
- [OpenCode Server API](https://opencode.ai/docs/server/)
- [Next.js Documentation](https://nextjs.org/docs)
