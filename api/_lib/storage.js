import { storage } from './firebase-admin.js';

export async function uploadBuffer({ buffer, contentType, path }) {
  if (!storage) return null; // storage not configured
  const bucket = storage.bucket();
  const file = bucket.file(path);
  await file.save(buffer, { contentType, resumable: false, public: true, validation: 'crc32c' });
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(path)}`;
  return publicUrl;
}
