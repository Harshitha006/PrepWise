const fs = require('fs');

// ─────────────────────────────────────────────────────────────────────────────
// PrepWise — .env.local regenerator
//
// HOW TO USE:
//   1. Go to Firebase Console → Project Settings → Service Accounts
//   2. Click "Generate new private key" → save the JSON file
//   3. Open the JSON, copy the value of "private_key" (the long string
//      starting with -----BEGIN PRIVATE KEY-----)
//   4. Paste it below as FIREBASE_PRIVATE_KEY_RAW (between the backticks)
//   5. Run:  node fix-env-v2.js
//   6. Restart dev server: npm run dev
//
// IMPORTANT: The private key MUST be a single-line value in .env.local.
//    Real newlines inside a PEM key will break dotenv parsing.
//    Paste the raw key with real newlines here — we convert them before writing.
// ─────────────────────────────────────────────────────────────────────────────

const FIREBASE_PROJECT_ID = "prepwise-d70c8";
const FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@prepwise-d70c8.iam.gserviceaccount.com";

// ↓↓↓ PASTE YOUR PRIVATE KEY HERE — replace everything between the backticks ↓↓↓
// Get it from: Firebase Console → Project Settings → Service Accounts → Generate new private key
// Then open the downloaded JSON and copy the "private_key" value
const FIREBASE_PRIVATE_KEY_RAW = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDrpZzuplhNf/N\nHPPC3K0LvYOGr8JwmNyH88Xurp41HlvS5zNlW+GrcvVphwcr3WYswO7O3LF7eJAp\n8FPta8cbAHNQKMaUVVlmOUKXvXoux7vxfGWOemDwNuUu4H18kryZ0isJC5T/rptw\ncIRQcFqcRMktn9JPvMCxaCWlT4Qg3/FDHffvtbSC7Nfa8T8akF71Gu2v9dZAKv3f\nHtsWnHR37+GXDK5go9ZycfDQL1HKIBYBpJ/rBgwDYLfD0w9igjfu2bKVkh1TlaAs\nMs5TmEhM7H76UwvALwqHXcE2h7tUjMabWIBih6Z7VGu2hNvwBIIEDIdfs+4EeDpd\nf1jV9ppnAgMBAAECggEAAhR8gyCcrxoVAj5iG77a1HEVs3XpSYDIETMW3KEDJU5E\nvYm9rXxPLY4j1vLB7TDOYs0QvusJ+JjJpi5Xo2BWaT1d4tN6iKI/fLpAwbo6lShi\nKeK9ho0WzU1Gevu3K+Uevee0xqtWjEmewfb7azU07rKkngIJZvfH52FChwyeocO+\nEtzVSVR320OrFsXdDRS7hgrCVLs+gOqr+1+0J+4v1Yd0kLxvNSRJwbC9nFJ7UEMH\nF7FUtYN645kA44sb3vaEpvyq/KCGrImRG+evf2goN2ZoJrqiEH2vGOH3VucCHbJS\nxCcfjG5cQVQAXbnPD9o+d102G8jaQeJca+wnS6rDJQKBgQDkSLUnhs+gsVacTlHV\nw8hJY4VChketnxIfsO9P2Q851FVpq5KEP43K3NSxwrmzPpp7UQrQ8+pfP7limqyr\nrLP0LxcplflwVD/tYNuuBTjMIMRad/ZJ4QDjwEMdtgM4/Ny7wPKJlLFj2GH6cY2W\nCJPtVGxzLk4GvjKU6PpWq2QqxQKBgQDbcJOoHE7HJmrAkAI+NG2Vhd5K++z8NxNR\nxfxE7bstZEDg4DISt5iQJ7z77WSzuHAAN7DTDW411LUhY80GYVNfh15YQov8KpjL\nuEtnDJX8fQTL6JCTG2et0KXFeAkmqpO8SDSo5wfZ0pz0wa+nx1T53O6Ite0fC3GY\nUU/Nf6WzOwKBgQDcbeCOpDwEXHjXQUD/+qaBRtm8XNEFs13awAy0u1Fac89t08AM\ndxnBUu8GHpMVo1Oj06NwFLaw9mVZ8yTcOE0jcf0ZqLlNX+zCmA5HwL8RTGqNONzW\nha9IO7QTEleWRYQWv77yXmPTl3M0U0V2JB5Cwoxdw86P8EQDSdvAqIp2SQKBgGGM\n5Dchjmu9ykscOcMJb4W+4xkWcT2WBkKd7w19WW5OWQEe6WOktm+vGrYrzE6QuUl/\neF36ZHoNuw/C3AvwDC41cV1vB+frz80QeoSu9aYutYkoM80Rq797N5ZXTEoiHlbf\nCnnjanwMwrWTvNCrLj19V5TyuxzH65G44+8IxdKtAoGAH1nIHASV6cvUQNccHIOI\n/qg8DSO38MNM+pQauERuGKNL1cqXuEJ+rn1UGUcflWs/n1Ryxxc993Ac7OJtpW/A\n9dsysgLOfdvtV4Fs8x/AxXaVZEBo2vv49gMTl/gTAkJuCtyAdNUnyx8vKQW0fA2a\nlBuon4We3ym1bceU4+tDdiA=\n-----END PRIVATE KEY-----\n`;
// ↑↑↑ END OF KEY ↑↑↑


// Convert real newlines → literal \n for safe single-line storage in .env
const FIREBASE_PRIVATE_KEY = FIREBASE_PRIVATE_KEY_RAW.replace(/\r?\n/g, '\\n').trim();

const NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyDU_SSSPwI1XGHhJsyXZOgqC6b70NDvjkE";
const NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "prepwise-d70c8.firebaseapp.com";
const NEXT_PUBLIC_FIREBASE_PROJECT_ID = "prepwise-d70c8";
const NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "prepwise-d70c8.firebasestorage.app";
const NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "517268626852";
const NEXT_PUBLIC_FIREBASE_APP_ID = "1:517268626852:web:66d223a85255dc8c34b531";
const GOOGLE_GENERATIVE_AI_API_KEY = "AIzaSyD8gIiTzNeYgChUDJ6rOM1UV438DrIGr4o";
const NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

const envContent = `# Firebase Backend (Admin SDK - server-side only, never exposed to browser)
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY="${FIREBASE_PRIVATE_KEY}"

# Firebase Frontend (safe to expose - prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}

# App
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
`;

fs.writeFileSync('.env.local', envContent);
console.log(".env.local has been reconstructed successfully.");

// Verify the key is valid
const crypto = require('crypto');
const keyForTest = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
try {
  crypto.createPrivateKey({ key: keyForTest, format: 'pem' });
  console.log("Key validation: PASSED — private key is cryptographically valid.");
  console.log("Next step: restart the dev server with: npm run dev");
} catch (e) {
  console.error("Key validation: FAILED —", e.message);
  console.error("The key you pasted may be corrupted. Try downloading a new service account JSON.");
}
