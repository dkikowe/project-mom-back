import { allowMethod, json } from './_lib/http.js';
import { getDb } from './_lib/db.js';
import { checkStorage } from './_lib/storage.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, ['GET'])) return;
  const mongoConfigured = Boolean(process.env.MONGODB_URI);
  const authConfigured = Boolean(process.env.APP_JWT_SECRET && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  const storageConfigured = Boolean(process.env.AWS_BUCKET_NAME && process.env.AWS_SECRET_KEY && process.env.AWS_ACCESS_KEY && process.env.AWS_REGION);
  const [databaseCheck, storageCheck] = await Promise.allSettled([
    mongoConfigured ? getDb().then(db => db.command({ ping: 1 })) : Promise.reject(new Error('missing')),
    storageConfigured ? checkStorage() : Promise.reject(new Error('missing')),
  ]);
  const database = !mongoConfigured ? 'missing' : databaseCheck.status === 'fulfilled' ? 'connected' : 'connection-failed';
  const storage = !storageConfigured ? 'missing' : storageCheck.status === 'fulfilled' ? 'aws-s3-connected' : 'connection-failed';
  const ready = database === 'connected' && storage === 'aws-s3-connected' && authConfigured;
  return json(res, ready ? 200 : 503, { ready, database, storage, auth: authConfigured ? 'configured' : 'missing' });
}
