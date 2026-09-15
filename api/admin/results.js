import { allowMethod, handleError, json } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { getDb } from '../_lib/db.js';
import { buildAdminResults } from '../_lib/admin-results.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, ['GET'])) return;
  try {
    await requireAdmin(req);
    const db = await getDb();
    const [users, allProgress, graded] = await Promise.all([
      db.collection('users').find({ role: 'student' }).sort({ createdAt: 1 }).limit(500).toArray(),
      db.collection('progress').find({}).toArray(),
      db.collection('submissions').find({ 'grading.status': 'graded' }).sort({ 'grading.gradedAt': -1 }).toArray(),
    ]);
    return json(res, 200, buildAdminResults(users, allProgress, graded));
  } catch (error) {
    return handleError(res, error);
  }
}
