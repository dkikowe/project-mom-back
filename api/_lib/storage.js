import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

let client;

function settings() {
  const { AWS_BUCKET_NAME: bucket, AWS_REGION: region, AWS_ACCESS_KEY: accessKeyId, AWS_SECRET_KEY: secretAccessKey } = process.env;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    const error = new Error('AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY және AWS_SECRET_KEY параметрлерін орнатыңыз.');
    error.status = 503;
    throw error;
  }
  return { bucket, region, accessKeyId, secretAccessKey };
}

function s3() {
  const { region, accessKeyId, secretAccessKey } = settings();
  if (!client) client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return client;
}

export async function uploadAttachment(upload, ownerId) {
  if (!upload) return null;
  const { bucket } = settings();
  const key = `submissions/${ownerId}/${randomUUID()}-${upload.filename}`;
  await s3().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: upload.data,
    ContentType: upload.mimeType,
    ContentLength: upload.size,
    ServerSideEncryption: 'AES256',
  }));
  return { storageKey: key, filename: upload.filename, mimeType: upload.mimeType, size: upload.size };
}

export async function downloadAttachment(key) {
  try {
    const { bucket } = settings();
    const result = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body?.pipe) throw new Error('AWS S3 файл ағынын қайтара алмады.');
    return result.Body;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NoSuchKey') error.status = 404;
    throw error;
  }
}

export async function deleteAttachment(key) {
  if (!key) return;
  const { bucket } = settings();
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function checkStorage() {
  const { bucket } = settings();
  await s3().send(new HeadBucketCommand({ Bucket: bucket }));
  return true;
}
