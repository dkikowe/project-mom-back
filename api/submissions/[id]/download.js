import { allowMethod, handleError, json } from '../../_lib/http.js';
import { requireAdmin } from '../../_lib/auth.js';
import { getDb } from '../../_lib/db.js';
import { downloadAttachment } from '../../_lib/storage.js';
import { parseObjectId } from '../../_lib/submissions.js';

function safeFilename(value) {
  return String(value || 'attachment').replace(/["\\\r\n]/g, '_');
}

export default async function handler(req, res) {
  if (!allowMethod(req, res, ['GET'])) return;
  try {
    await requireAdmin(req);
    const submission = await (await getDb()).collection('submissions').findOne({ _id: parseObjectId(req.query.id) });
    if (!submission?.attachment) return json(res, 404, { error: 'Тіркелген файл жоқ.' });

    res.setHeader('Content-Type', submission.attachment.mimeType);
    res.setHeader('Content-Length', submission.attachment.size);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(submission.attachment.filename)}"`);
    return (await downloadAttachment(submission.attachment.storageKey)).pipe(res);
  } catch (error) {
    return handleError(res, error);
  }
}
