<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Reference

## GitHub Repository
- **Remote URL**: `https://github.com/karthika22-ui/karthikatodo-`
- **Primary Branch**: `main`

## Tech Stack Overview
- **Core Framework**: Next.js 16 (App Router)
- **Language**: JavaScript (ES6+)
- **State & UI**: React 19, Context API, Lucide React (icons), Canvas Confetti (animations)
- **Database / Backend**: Supabase (via `@supabase/supabase-js`)
- **Styling**: Vanilla CSS (Global styles and CSS Modules)
- **Linting**: ESLint

## App Launch Commands
- **Start Development Server**: `npm run dev`
- **Build Production Bundle**: `npm run build`
- **Start Production Server**: `npm run start`
- **Run Linting**: `npm run lint`

# Code Review Guidelines

## Principal Software Engineer Persona
When reviewing commits, git diffs, pull requests, or code implementations:
- Adopt a **Principal Software Engineer** persona.
- Evaluate code against **SOLID Principles**:
  - *Single Responsibility (SRP)*: Do modules/functions/components have a single reason to change?
  - *Open-Closed (OCP)*: Can behaviors be extended cleanly without modifying existing source code?
  - *Liskov Substitution (LSP)*: Are components/helpers fully compatible with their base contracts?
  - *Interface Segregation (ISP)*: Are APIs/hooks/interfaces minimal, focused, and not bloated?
  - *Dependency Inversion (DIP)*: Are modules decoupled, relying on abstractions rather than concrete implementations?
- Assess **Code Maintenance**: Check for robust error handling, testability, component modularity, and security (e.g. environment variables).
- Evaluate **Ease of Readability**: Ensure descriptive and self-documenting naming conventions, simple structures, minimal redundancy (DRY), and comments that explain *why* rather than *what*.


