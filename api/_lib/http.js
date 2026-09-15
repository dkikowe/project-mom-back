const MAX_JSON_BYTES = 1_000_000;
const PRODUCTION_FRONTEND_ORIGIN = 'https://platform-new-ecru.vercel.app';

function allowedOrigins() {
  const configured = String(process.env.FRONTEND_ORIGIN || '').split(',').map(value => value.trim().replace(/\/$/, '')).filter(Boolean);
  return new Set([PRODUCTION_FRONTEND_ORIGIN, ...configured]);
}

function setCors(req, res) {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  if (!origin || !allowedOrigins().has(origin)) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Vary', 'Origin');
}

export function allowMethod(req, res, methods) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ error: 'Әдіс қолдау таппайды.' });
  return false;
}

export function json(res, status, body) {
  res.status(status).json(body);
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) {
      const error = new Error('Сұрау тым үлкен.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('JSON пішімі жарамсыз.');
    error.status = 400;
    throw error;
  }
}

export function clientError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function handleError(res, error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Сервер қатесі. Кейінірек қайталап көріңіз.' : error.message });
}
