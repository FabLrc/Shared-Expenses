#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push notifications.
 *
 * Usage:
 *   npx web-push generate-vapid-keys
 *   — or —
 *   node scripts/generate-vapid-keys.mjs
 *
 * Then add the output to your .env / Vercel environment variables:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_CONTACT_EMAIL=your-email@example.com
 *   CRON_SECRET=<random-secret-for-cron-auth>
 */

import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("Add these to your environment variables:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_CONTACT_EMAIL=your-email@example.com`);
console.log(`CRON_SECRET=${crypto.randomUUID()}`);
