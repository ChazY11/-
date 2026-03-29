# Clocktower Workspace

This repository contains two frontends that share logic from `packages/core`:

- `src/` + the root app: a Next.js web app
- `packages/miniapp`: a Taro-based WeChat Mini Program

## Web App

Install dependencies and start the web app from the repository root:

```bash
npm install
npm run dev
```

## WeChat Mini Program

The Mini Program source code lives in `packages/miniapp`, but the runnable WeChat output is generated into `packages/miniapp/dist`.

Build it from the repository root:

```bash
npm install
npm run build:weapp
```

For watch mode during development:

```bash
npm run dev:weapp
```

Then import the repository root into WeChat DevTools. The root `project.config.json` is configured to use:

- source root: `packages/miniapp/`
- Mini Program output: `packages/miniapp/dist/`

If you prefer importing the Mini Program package directly, import `packages/miniapp` after `dist` has been generated.

## Notes

- Do not import the raw Next.js root as if it were a Mini Program project.
- `packages/miniapp` depends on the workspace package `packages/core`, so install dependencies from the repository root.
- Replace the AppID in the Mini Program project config before real-device testing or release if needed.
