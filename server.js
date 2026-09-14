import express from 'express';
import health from './api/health.js';
import adminResults from './api/admin/results.js';
import adminSubmissions from './api/admin/submissions.js';
import adminSubmission from './api/admin/submissions/[id].js';
import adminUsers from './api/admin/users.js';
import login from './api/auth/login.js';
import logout from './api/auth/logout.js';
import me from './api/auth/me.js';
import register from './api/auth/register.js';
import progress from './api/progress.js';
import results from './api/results.js';
import submission from './api/submissions/[id].js';
import download from './api/submissions/[id]/download.js';
import submissions from './api/submissions/index.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

function withId(handler) {
  return (req, res) => {
    Object.defineProperty(req, 'query', { value: { ...req.query, id: req.params.id }, configurable: true, writable: true });
    return handler(req, res);
  };
}

app.get('/', (req, res) => res.status(200).json({ name: 'Ұшқан ұя API', health: '/api/health' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()) }));
app.all('/api/health', health);
app.all('/api/auth/register', register);
app.all('/api/auth/login', login);
app.all('/api/auth/me', me);
app.all('/api/auth/logout', logout);
app.all('/api/progress', progress);
app.all('/api/results', results);
app.all('/api/submissions', submissions);
app.all('/api/submissions/:id/download', withId(download));
app.all('/api/submissions/:id', withId(submission));
app.all('/api/admin/results', adminResults);
app.all('/api/admin/submissions', adminSubmissions);
app.all('/api/admin/submissions/:id', withId(adminSubmission));
app.all('/api/admin/users', adminUsers);

app.use((req, res) => res.status(404).json({ error: 'Маршрут табылмады.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error);
  return res.status(500).json({ error: 'Сервер қатесі. Кейінірек қайталап көріңіз.' });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '0.0.0.0', () => console.log(`Ұшқан ұя API listening on port ${port}`));

process.on('SIGTERM', () => server.close(() => process.exit(0)));
