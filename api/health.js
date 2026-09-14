import { allowMethod, json } from './_lib/http.js';

export default function handler(req, res) {
  if (!allowMethod(req, res, ['GET'])) return;
  const mongo = Boolean(process.env.MONGODB_URI);
  const auth = Boolean(process.env.APP_JWT_SECRET && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  const storage = Boolean(process.env.AWS_BUCKET_NAME && process.env.AWS_SECRET_KEY && process.env.AWS_ACCESS_KEY && process.env.AWS_REGION);
  return json(res, 200, { ready: mongo && auth && storage, database: mongo ? 'configured' : 'missing', storage: storage ? 'aws-s3' : 'missing', auth: auth ? 'configured' : 'missing' });
}
