# PrepWise Setup Guide (100% Free Voice AI)

To get PrepWise operational, you only need to collect credentials from two providers. This version uses the **Web Speech API**, so there are NO costs for voice interaction.

---

### 1. Firebase (Auth & Database)
Firebase provides both the Client SDK (for the browser) and the Admin SDK (for server-side actions).

**Step A: Create Project & Client Keys**
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add Project"** and follow the setup wizard.
3.  Once the project is created, click the **Web icon (</>)** in the center of the dashboard to register a new app.
4.  Copy the `firebaseConfig` object values. These map to your `.env.local` variables.

**Step B: Enable Services**
1.  **Authentication**: In the sidebar, go to *Build > Authentication*, click "Get Started", and enable **Email/Password**.
2.  **Firestore**: Go to *Build > Firestore Database*, click "Create Database". Start in **Test Mode**.

**Step C: Get Admin Keys**
1.  Click the **Gear Icon (Project Settings)** > **Service Accounts**.
2.  Click **"Generate new private key"**. This downloads a `.json` file.
3.  Extract:
    *   `project_id` -> `FIREBASE_PROJECT_ID`
    *   `client_email` -> `FIREBASE_CLIENT_EMAIL`
    *   `private_key` -> `FIREBASE_PRIVATE_KEY` (Keep the quotes and ensure `\n` characters are preserved).

---

### 2. Google AI (Gemini)
Gemini handles question generation and candidate feedback.

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Log in with your Google account.
3.  Click **"Get API key"** in the sidebar.
4.  Click **"Create API key in new project"**.
5.  Copy the generated key.
    *   Map this to `GOOGLE_GENERATIVE_AI_API_KEY`.

---

### Final Configuration Checklist
Your `.env.local` should look like this (avoid spaces around `=`):

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=ABC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin
FIREBASE_PROJECT_ID=project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII..."

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
