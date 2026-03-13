# StackForge

A vibe-coding platform for building fullstack dApps on the [Stacks](https://stacks.co) L2 blockchain. StackForge is a starter template that wraps [OpenCode](https://opencode.ai) with a better UI and integrates [Daytona](https://daytona.io) sandboxes for fully isolated, cloud-based development environments.

## What You Can Build

StackForge supports two primary development modes:

### 1. Clarity Smart Contracts
An in-browser Clarity contract development experience inspired by [Stacks Labs Playground](https://play.stackslabs.com). Write, deploy, and test Clarity contracts with AI assistance — no local toolchain required.

### 2. Fullstack Stacks dApps
Select a template repo, clone it, and run it inside a Daytona sandbox. The AI agent works directly inside the sandbox environment, giving it full access to your file system, shell, and dev server. Build end-to-end Bitcoin-powered apps — DeFi protocols, NFT platforms, DAOs, and more.

## Architecture

```
Browser (Next.js UI)
    │
    ├── Clarity Playground  ─── OpenCode (AI coding agent)
    │                                │
    └── Fullstack dApp Mode ─── Daytona Sandbox
                                     ├── Cloned repo
                                     ├── Dev server
                                     └── OpenCode agent
```

**Key integration**: [OpenCode + Daytona guide](https://www.daytona.io/docs/en/guides/opencode/opencode-web-agent/)

## Prerequisites

- Node.js 18+
- pnpm
- [Daytona](https://daytona.io) account (for sandbox mode)
- [OpenCode](https://opencode.ai) server running locally or via Daytona

## Quick Start

1. **Clone and install**:

   ```bash
   git clone https://github.com/your-org/stackforge-v2
   cd stackforge-v2
   pnpm install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env.local
   # Fill in GitHub OAuth, OpenCode URL, and Daytona credentials
   ```

3. **Start OpenCode** (local mode):

   ```bash
   opencode serve
   # Listens on http://127.0.0.1:4096 by default
   ```

4. **Run the UI**:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and sign in with GitHub.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_BASE_URL` | OpenCode server URL | `http://127.0.0.1:4096` |
| `OPENCODE_SERVER_USERNAME` | HTTP basic auth username | (none) |
| `OPENCODE_SERVER_PASSWORD` | HTTP basic auth password | (none) |
| `OPENCODE_TIMEOUT_MS` | Request timeout in milliseconds | `120000` |
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) | (required) |
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID | (required) |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app client secret | (required) |
| `AUTH_TRUST_HOST` | Set `true` for localhost dev | recommended |
| `OPENVIBE_REPOS_DIR` | Directory for cloned repos | `$TMPDIR/openvibe-repos` |

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Secret into `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — project type selection |
| `/projects` | Dashboard — repo picker & sandbox launcher |
| `/project/<name>` | Workspace — AI chat, file editor, live preview |

## Features

- **Landing page** — warm Stacks-branded gradient, typewriter dApp idea prompts
- **Daytona sandbox integration** — isolated cloud environments per project
- **Clarity contract mode** — write & deploy Clarity contracts with AI (coming soon)
- **Fullstack dApp mode** — clone a repo, spin up a sandbox, vibe-code the whole stack
- **OpenCode workspace** — sessions, AI chat, file tree, diff viewer, live preview
- **GitHub integration** — sign in, browse repos, clone with one click
- **Resizable panels** — sidebar, chat, file viewer, review, tools all drag-to-resize
- **Event streaming** — SSE with auto-reconnect and permission prompt overlay

## Roadmap

- [ ] Daytona sandbox launch & lifecycle management
- [ ] Clarity Playground mode (in-browser REPL + AI)
- [ ] Stacks dApp template gallery (DeFi, NFT, DAO starters)
- [ ] One-click deploy to mainnet via Hiro Platform
- [ ] Shareable sandbox links

## Project Structure

```
app/                  Next.js app router (pages + API routes)
  page.tsx            Landing page
  projects/           Dashboard (protected)
  project/[name]/     Workspace (protected)
  api/opencode/       Proxy to OpenCode server
  api/workspace/      Repo clone & sandbox management
components/           React UI components
lib/opencode/         Server-side OpenCode client
lib/web/              Browser API client, Zustand store, SSE hook
lib/workspace/        Workspace instance management
```

## Learn More

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [OpenCode Documentation](https://opencode.ai/docs)
- [Daytona + OpenCode Guide](https://www.daytona.io/docs/en/guides/opencode/opencode-web-agent/)
- [Stacks Labs Playground](https://play.stackslabs.com)
- [Next.js Documentation](https://nextjs.org/docs)
