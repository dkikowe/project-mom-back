import { ObjectId } from 'mongodb';
import { allowMethod, clientError, handleError, json } from '../../_lib/http.js';
import { requireAdmin } from '../../_lib/auth.js';
import { getDb } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, ['DELETE', 'PATCH'])) return;
  try {
    const admin = await requireAdmin(req);
    const id = req.query?.id;
    if (!ObjectId.isValid(id)) throw clientError('Оқушы идентификаторы жарамсыз.');
    const excluded = req.method === 'DELETE';
    const update = excluded
      ? { $set: { resultsExcludedAt: new Date(), resultsExcludedBy: admin._id } }
      : { $unset: { resultsExcludedAt: '', resultsExcludedBy: '' } };
    const result = await (await getDb()).collection('users').updateOne({ _id: new ObjectId(id), role: 'student' }, update);
    if (!result.matchedCount) return json(res, 404, { error: 'Оқушы табылмады.' });
    return json(res, 200, { id, excluded });
  } catch (error) {
    return handleError(res, error);
  }
}
