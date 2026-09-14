import { allowMethod, handleError, json, readJson } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';
import { getDb } from '../_lib/db.js';
import { deleteAttachment, uploadAttachment } from '../_lib/storage.js';
import { cleanSubmission, parseMultipart, submissionView, validateUpload } from '../_lib/submissions.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (!allowMethod(req, res, ['GET', 'POST'])) return;
  try {
    const user = await requireUser(req);
    const submissions = (await getDb()).collection('submissions');

    if (req.method === 'GET') {
      const records = await submissions.find({ studentId: user._id }).sort({ createdAt: -1 }).limit(50).toArray();
      return json(res, 200, { submissions: records.map(submissionView) });
    }

    const contentType = req.headers['content-type'] || '';
    let raw;
    let upload = null;
    if (contentType.startsWith('multipart/form-data')) {
      const parsed = await parseMultipart(req);
      raw = parsed.fields;
      upload = validateUpload(parsed.upload);
    } else {
      raw = await readJson(req);
    }

    const work = cleanSubmission(raw);
    const attachment = await uploadAttachment(upload, user._id.toString());
    const now = new Date();
    try {
      const submission = {
        studentId: user._id,
        student: { name: user.name, email: user.email },
        ...work,
        attachment,
        grading: null,
        createdAt: now,
        updatedAt: now,
      };
      const result = await submissions.insertOne(submission);
      submission._id = result.insertedId;
      return json(res, 201, { submission: submissionView(submission) });
    } catch (error) {
      if (attachment) await deleteAttachment(attachment.storageKey).catch(() => {});
      throw error;
    }
  } catch (error) {
    return handleError(res, error);
  }
}
