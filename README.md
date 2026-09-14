# Ұшқан ұя — backend

Vercel serverless API for the 9th-grade learning platform. It provides student
accounts, protected submissions and uploads, A/D grading with feedback, learning
progress, and administrator research summaries.

## Deploy

Import this repository into Vercel as **Other**. Add the variables from
`.env.example`: `MONGODB_URI`, `APP_JWT_SECRET`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, and `FRONTEND_ORIGIN` after the frontend has a public URL.

The API creates the administrator on the first authentication request. Never add
real credentials or the MongoDB connection string to Git.

## Checks

```bash
npm install
npm run check
npm test
```

## Main routes

- `/api/auth/*` — registration, login, logout, session.
- `/api/submissions` — protected student submissions and attachments.
- `/api/progress`, `/api/results` — individual progress and results.
- `/api/admin/*` — administrator grading, class progress, research CSV source.
