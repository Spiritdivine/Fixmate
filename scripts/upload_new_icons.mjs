/**
 * Upload new professional icons + hero images to Cloudinary
 */
import 'dotenv/config';
import { createReadStream } from 'fs';
import { createHmac, createHash } from 'crypto';
import path from 'path';
import FormData from 'form-data';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const BASE = path.resolve('frontend/public/images/email');

function sign(params) {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + API_SECRET;
  return createHash('sha1').update(str).digest('hex');
}

async function upload(localPath, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, overwrite: 'true', timestamp };
  const signature = sign(params);

  const form = new FormData();
  form.append('file', createReadStream(localPath));
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('timestamp', timestamp);
  form.append('api_key', API_KEY);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });
  const data = await res.json();
  if (data.secure_url) {
    console.log(`✅ ${publicId} → ${data.secure_url}`);
    return { publicId, url: data.secure_url, version: data.version };
  } else {
    console.error(`❌ ${publicId}:`, data.error?.message || JSON.stringify(data));
    return null;
  }
}

const assets = [
  [`${BASE}/icon-shield.png`,    'artifix/email/icon-shield'],
  [`${BASE}/icon-handshake.png`, 'artifix/email/icon-handshake'],
  [`${BASE}/icon-chart.png`,     'artifix/email/icon-chart'],
  [`${BASE}/icon-community.png`, 'artifix/email/icon-community'],
  [`${BASE}/icon-bulb.png`,      'artifix/email/icon-bulb'],
  [`${BASE}/hero-banner-master.png`,  'artifix/email/hero-banner-master'],
  [`${BASE}/hero-artisans-clean.png`, 'artifix/email/hero-artisans-clean'],
];

console.log(`Uploading ${assets.length} assets to Cloudinary...`);
const results = [];
for (const [path, pid] of assets) {
  const r = await upload(path, pid);
  if (r) results.push(r);
  await new Promise(r => setTimeout(r, 300));
}

console.log('\n=== CDN URLs (use these in email template) ===');
for (const r of results) {
  console.log(`${r.publicId}  v${r.version}  ${r.url}`);
}
