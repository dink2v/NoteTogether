# NoteTogether

A calm shared notes workspace for two people.

## Current features

- Shared folders: Shared Space, Udin, and Teman
- Create and edit notes with automatic saving
- Favorites, search, and Trash with restore
- Supabase Realtime updates across open devices
- Responsive layout for desktop and mobile

## Stack

- Next.js 15, React 19, and TypeScript
- Supabase Postgres, Data API, and Realtime
- Lucide icons

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.

3. Start the development server:

   ```bash
   npm run dev
   ```

Open http://localhost:3000.

## Database

The SQL migrations are in `supabase/migrations`. The initial schema creates the shared folders and notes tables, enables RLS, grants the anonymous client role access, and enables Realtime for both tables.

## Access warning

This prototype intentionally uses anonymous shared access so the two intended users can open one link without signing in. Anyone who obtains that link can potentially read, create, edit, or delete workspace content. Do not store passwords, financial details, or other sensitive information. Add proper authentication and per-workspace authorization before using this for confidential notes.
