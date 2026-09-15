import assert from 'node:assert/strict';
import test from 'node:test';
import { ObjectId } from 'mongodb';

process.env.APP_JWT_SECRET = 'test-secret-that-is-long-enough-to-sign-session-tokens';

const { assertAdmin, normalizeEmail, publicUser, sessionToken, setSessionCookie, signSession } = await import('../api/_lib/auth.js');
const { allowMethod } = await import('../api/_lib/http.js');
const { cleanSubmission, gradeView, maxUploadBytes, submissionReceipt, validateUpload } = await import('../api/_lib/submissions.js');
const { cleanGrade, cleanProgress, isLearningComplete } = await import('../api/_lib/progress.js');
const { buildAdminResults } = await import('../api/_lib/admin-results.js');

test('normalizes email before account lookup', () => {
  assert.equal(normalizeEmail('  STUDENT@Example.KZ '), 'student@example.kz');
});

test('creates a signed session token for a user', async () => {
  const token = await signSession({ _id: new ObjectId(), name: 'Аружан', role: 'student' });
  assert.equal(token.split('.').length, 3);
});

test('accepts a bearer session when the browser blocks cross-site cookies', () => {
  assert.equal(sessionToken({ headers: { authorization: 'Bearer signed-token', cookie: 'ushqan_session=stale' } }), 'signed-token');
  assert.equal(sessionToken({ headers: { cookie: 'ushqan_session=cookie-token' } }), 'cookie-token');
});

test('does not expose password hashes in public user data', () => {
  const user = { _id: new ObjectId(), name: 'Аружан', email: 'a@example.kz', role: 'student', passwordHash: 'hidden', createdAt: new Date() };
  assert.deepEqual(Object.keys(publicUser(user)).sort(), ['createdAt', 'email', 'id', 'name', 'role']);
});

test('accepts a valid submitted analysis and integrity declaration', () => {
  const result = cleanSubmission({ title: 'Үзінді талдауы', analysis: 'Автордың бейнелі тілі балалық шақтың мейірімді әлемін оқырманға сезіндіреді. '.repeat(2), additionalSources: '', integrityConfirmed: true });
  assert.equal(result.title, 'Үзінді талдауы');
  assert.equal(result.integrityConfirmed, true);
  assert.equal(cleanSubmission({ title: 'Үзінді талдауы', analysis: 'Автордың бейнелі тілі балалық шақтың мейірімді әлемін оқырманға сезіндіреді. '.repeat(2), integrityConfirmed: 'on' }).integrityConfirmed, true);
});

test('rejects an analysis without integrity declaration or an unsafe attachment type', () => {
  assert.throws(() => cleanSubmission({ title: 'Талдау', analysis: 'Мәтіндік талдау сөйлемі.'.repeat(5), integrityConfirmed: false }), /растауды/);
  assert.throws(() => validateUpload({ filename: 'run.exe', mimeType: 'application/octet-stream', size: 10 }), /PDF/);
  assert.equal(maxUploadBytes(), 4 * 1024 * 1024);
});

test('keeps only valid learning progress and recognizes a complete learning path', () => {
  const progress = cleanProgress({ lessonIds: [0, 1, 1, 2, 3, 4, 5], quiz: { score: 12, total: 14, completed: true }, games: { match: 5, sequence: 1, device: 4 }, finalPrepared: true });
  assert.deepEqual(progress.lessonIds, [0, 1, 2, 3, 4, 5]);
  assert.equal(isLearningComplete(progress), true);
  assert.throws(() => cleanProgress({ lessonIds: [9] }), /жарамсыз/);
});

test('accepts MYP criterion grades and teacher feedback in their allowed ranges', () => {
  const grade = cleanGrade({ scoreA: '7', scoreD: 6, feedback: 'Дәйексөзді әсерімен байланыстыруың сәтті шықты.' });
  assert.deepEqual(grade, { scoreA: 7, scoreD: 6, feedback: 'Дәйексөзді әсерімен байланыстыруың сәтті шықты.', total: 13, status: 'graded' });
  assert.throws(() => cleanGrade({ scoreA: 9, scoreD: 0, feedback: 'Жарамсыз ұпай.' }), /ұпайы/);
});

test('excluded student results do not affect the class averages or CSV source rows', () => {
  const first = new ObjectId();
  const second = new ObjectId();
  const users = [
    { _id: first, name: 'Аружан', email: 'a@example.kz' },
    { _id: second, name: 'Бекзат', email: 'b@example.kz', resultsExcludedAt: new Date() },
  ];
  const graded = [
    { studentId: first, grading: { scoreA: 8, scoreD: 6 } },
    { studentId: second, grading: { scoreA: 0, scoreD: 2 } },
  ];
  const report = buildAdminResults(users, [], graded);
  assert.equal(report.summary.registeredStudents, 2);
  assert.equal(report.summary.students, 1);
  assert.equal(report.summary.excluded, 1);
  assert.equal(report.summary.averageA, 8);
  assert.equal(report.summary.averageD, 6);
  assert.deepEqual(report.students.map(student => student.id), [first.toString()]);
  assert.deepEqual(report.excludedStudents.map(student => student.id), [second.toString()]);

  const restored = buildAdminResults(users.map(({ resultsExcludedAt, ...user }) => user), [], graded);
  assert.equal(restored.summary.students, 2);
  assert.equal(restored.summary.averageA, 4);
  assert.equal(restored.summary.averageD, 4);
});

test('student-facing submission responses never expose work text or attachment metadata', () => {
  const submission = {
    _id: new ObjectId(),
    title: 'Үзінді талдауы',
    analysis: 'Оқушының толық жұмысы',
    attachment: { storageKey: 'private/key.docx', filename: 'work.docx' },
    grading: { status: 'graded', scoreA: 7, scoreD: 6, total: 13, feedback: 'Жақсы талдау.', gradedAt: new Date() },
    createdAt: new Date(),
  };
  assert.deepEqual(Object.keys(submissionReceipt(submission)).sort(), ['createdAt', 'id', 'status', 'title']);
  assert.equal(JSON.stringify(gradeView(submission)).includes('analysis'), false);
  assert.equal(JSON.stringify(gradeView(submission)).includes('storageKey'), false);
});

test('administrator authorization rejects every non-admin role', () => {
  assert.throws(() => assertAdmin({ role: 'student' }), error => error.status === 403);
  assert.throws(() => assertAdmin({ role: 'teacher' }), error => error.status === 403);
  assert.equal(assertAdmin({ role: 'admin', id: 'admin' }).id, 'admin');
});

test('production frontend receives credentialed CORS and cross-site session cookies', () => {
  const headers = {};
  const response = {
    setHeader(name, value) { headers[name] = value; },
    status() { return this; },
    json() {},
    end() {},
  };
  assert.equal(allowMethod({ method: 'GET', headers: { origin: 'https://platform-new-ecru.vercel.app' } }, response, ['GET']), true);
  assert.equal(headers['Access-Control-Allow-Origin'], 'https://platform-new-ecru.vercel.app');
  assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  assert.match(headers['Access-Control-Allow-Headers'], /Authorization/);
  assert.match(headers['Access-Control-Allow-Methods'], /DELETE/);
  setSessionCookie(response, 'token');
  assert.match(headers['Set-Cookie'], /HttpOnly; Secure; SameSite=None/);
});
