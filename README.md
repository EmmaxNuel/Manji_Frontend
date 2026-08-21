# Manji Frontend

React + Vite + Tailwind CSS frontend for the **Manji** storytelling platform —
a dark, MovieBox-inspired UI built with the Manji visual identity (orange/black
brand, glass cards, smooth transitions).

## Stack

- React 18 + Vite 5 + Tailwind CSS 3
- React Router (v6), Axios, `react-hot-toast`
- `lucide-react` icons
- No external chart library — analytics use lightweight inline SVG charts

## Project structure

```
src/
├── App.jsx            routes + providers
├── layouts/           MainLayout (desktop nav + mobile bottom nav)
├── pages/
│   ├── HomePage.jsx            discovery feed: featured hero (official MANJI),
│   │                           trending chart, creator spotlights, recommendations
│   ├── DiscoverPage.jsx        featured / trending / popular / recent / new + filters
│   ├── LibraryPage.jsx         reading, bookmarks, following, completed, history
│   ├── profile/ProfilePage.jsx public profiles
│   ├── stories/StoryDetailPage.jsx
│   ├── reader/ChapterReaderPage.jsx   full-screen reader w/ progress + settings
│   ├── creator/CreatorStudioPage.jsx  dashboard + analytics charts + story rows
│   ├── creator/CreateStoryPage.jsx    create/edit story form
│   ├── creator/ChapterManagePage.jsx  chapter list + editor + publish flow
│   ├── creator/AiStudioPage.jsx       image + text generation studio
│   └── auth/                    login, register, password reset
├── components/
│   ├── ui/         Spinner, Avatar, Badge, StoryCard, charts (SVG), etc.
│   └── auth/       route guards (Private / Public / Creator)
├── contexts/       AuthContext, ThemeContext
├── services/       api client + story/user services (axios wrappers)
└── utils/, hooks/
```

## Setup & run

See [`../RUN.md`](../RUN.md) for full instructions. In short:

```bash
npm install
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api` and `/media` to `http://localhost:8000`,
so run the backend first. Set `VITE_API_URL` in `.env.local` only if you are
not using the proxy.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

## Routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | Home / discovery feed | Public |
| `/discover` | Discover | Public |
| `/stories/:slug` | Story detail | Public |
| `/chapters/:id` | Chapter reader | Public |
| `/profile/:username` | Public profile | Public |
| `/login` `/register` `/forgot-password` `/reset-password/:uid/:token` | Auth | Public |
| `/library` | Library | Signed in |
| `/create` | Creator Studio | Signed in |
| `/create/ai` | AI Studio | Signed in |
| `/create/new` | Create story | Creator |
| `/create/:slug/edit` | Edit story | Creator |
| `/create/:slug/chapters` | Manage chapters | Creator |

## Features

- **Home feed** — featured story hero (official MANJI story is prioritized and
  tagged "Official Manji Story"), trending bar chart, creator spotlight cards,
  and personalized recommendations.
- **Creator Studio** — story management (publish/unpublish, edit, delete),
  aggregated stats, and a Performance section with 14-day SVG area charts and
  per-story progress bars.
- **Manji AI panel** — a creative co-author chat inside the chapter manager:
  desktop side panel / mobile bottom sheet, quick actions (ideas, continue,
  characters, world, plot twist, art), per-story conversation history, and
  insert/copy for AI suggestions.
- **Discover** — search, content-type and genre filters, plus curated sections.
- **Reader** — reading settings, auto-saved progress, chapter table of contents.
- **StoryCard** — cover cards with like/bookmark/follow actions and an
  "Official" badge for official stories.