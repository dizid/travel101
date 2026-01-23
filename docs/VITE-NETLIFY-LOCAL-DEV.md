# Vite + Netlify Functions: Local Development Setup

## The Problem

When developing locally with Vite + Netlify Functions:
- App runs on Vite's port (5173, 3000, etc.)
- API calls to `/api/*` need to reach Netlify Functions
- Without proper setup, API calls return HTML instead of JSON

## The Solution: @netlify/vite-plugin

Netlify's official Vite plugin emulates the entire Netlify platform inside Vite's dev server.

**Documentation**: https://docs.netlify.com/frameworks/vite/

## Setup (3 steps)

### 1. Install the plugin

```bash
npm install -D @netlify/vite-plugin
```

### 2. Add to vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'  // or your framework
import netlify from '@netlify/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    netlify(),  // Add this
  ],
  // ... rest of your config
})
```

### 3. Run dev server

```bash
npm run dev
```

That's it. No need for `netlify dev` anymore.

## What the Plugin Handles

- Serverless functions (`/.netlify/functions/*`)
- Redirects & rewrites (from `netlify.toml`)
- Environment variables
- Edge functions
- Image CDN
- Blobs & Cache API

## Port Handling

- Vite picks an available port (5173, 5174, etc.)
- Plugin handles all routing internally
- No manual proxy configuration needed
- Works with multiple projects running simultaneously

## Verification

1. Run `npm run dev`
2. Note the port Vite is using
3. Access a page that makes API calls
4. Check browser console - no JSON parse errors

## When to Still Use `netlify dev`

- Testing Netlify-specific features not yet supported by the plugin
- Debugging production-like environment
- Using Netlify Dev extensions

## Troubleshooting

### API calls return HTML
- Ensure `netlify()` plugin is in your vite.config
- Check that functions are in `netlify/functions/` directory
- Verify `netlify.toml` has correct `functions` path

### Functions not found
- Check function file extensions (`.mts`, `.ts`, `.js`)
- Ensure functions export a handler

## Template for New Projects

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import netlify from '@netlify/vite-plugin'

export default defineConfig({
  plugins: [netlify()],
})
```

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```
