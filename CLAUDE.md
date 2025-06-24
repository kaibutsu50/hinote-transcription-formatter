# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js web application for processing speech transcript files. It provides a web-based interface with file upload, server-side processing, and download functionality.

The application parses speech data in a specific 4-line format (timestamp/speaker, empty line, speech content, empty line) and concatenates consecutive speeches from the same speaker.

## Development Commands

**Important**: Always use `pnpx` instead of `npx` for package execution.

- **Install dependencies**: `pnpm install`
- **Run development server**: `pnpm dev`
- **Build for production**: `pnpm build`
- **Start production server**: `pnpm start`
- **Export static files**: Automatically configured for GitHub Pages deployment

## Architecture

The web application structure:

- `src/app/page.tsx` - Main UI with file upload and result display
- `src/app/api/process/route.ts` - Server-side API route for file processing
- `src/lib/speechProcessor.ts` - Core processing logic (ported from Deno script)
- `src/components/FileUpload.tsx` - Drag & drop file upload component
- `src/components/DownloadButton.tsx` - Processed file download component
- `.github/workflows/deploy.yml` - GitHub Actions for automatic deployment to GitHub Pages

## Input File Format Expected

The script expects input files with this specific format:
```
[timestamp] Speaker Name:

Speech content here

[timestamp] Speaker Name:

More speech content

```

Each speech entry consists of exactly 4 lines: speaker line, empty line, content line, empty line.

## Dependencies

- Next.js 15 with TypeScript and Tailwind CSS
- React 19 for UI components
- GitHub Actions for deployment automation
- Configured for GitHub Pages hosting with static export