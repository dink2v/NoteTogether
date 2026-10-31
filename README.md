# NoteTogether

A calm shared notes workspace for two people.

## Current stage

The first UI prototype is in place:
- Shared workspace with three visible folders: Shared Space, Udin, and Teman
- Notes list and editor layout
- Create, edit, favorite, search, delete, and restore interactions (prototype state only)
- Responsive sidebar and mobile layout

## Stack

- Next.js App Router
- React + TypeScript
- Lucide icons
- Supabase will be added for shared persistence and realtime sync

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important

The current UI uses in-memory sample data. Changes are not yet stored in a database or shared between devices. Supabase integration and access controls are the next implementation stage.