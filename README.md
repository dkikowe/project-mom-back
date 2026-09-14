# Ұшқан ұя — backend

Vercel serverless API for the 9th-grade learning platform. It provides student
accounts, protected submissions and AWS S3 uploads, A/D grading with feedback, learning
progress, and administrator research summaries.

## Railway deploy

Import this repository into Railway. Railpack uses `npm start`, starts
`server.js` on Railway's `PORT`, and checks process health at `/health`. Configuration
status is available at `/api/health`. Add the variables from
`.env.example`: `MONGODB_URI`, `APP_JWT_SECRET`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, `FRONTEND_ORIGIN`, `AWS_BUCKET_NAME`, `AWS_SECRET_KEY`,
`AWS_ACCESS_KEY`, and `AWS_REGION`.

MongoDB is used for users, submissions, grades, progress and feedback. Attached
PDF, DOCX and TXT files are stored privately in AWS S3 and are downloaded only
through the authenticated API. The AWS identity needs `s3:PutObject`,
`s3:GetObject` and `s3:DeleteObject` permissions for the selected bucket.

The API creates the administrator on the first authentication request. Never add
real credentials or the MongoDB connection string to Git.

After Railway assigns a public domain, place that address in the frontend's
`dist/config.js` as `window.APP_API_BASE`. Set `FRONTEND_ORIGIN` here to the
frontend's exact public origin, without a trailing slash.

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
