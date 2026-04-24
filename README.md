# SmartTask — Earn While You Learn

A skill-based micro task marketplace connecting talented students with real companies. Built with React + Vite, Firebase (Auth + Firestore + Storage), and deployed on Vercel.

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (file uploads)
- **Hosting**: Vercel

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/smarttask.git
cd smarttask
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a Firebase project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → name it `smarttask`
3. Enable **Google Analytics** (optional)

### 4. Enable Firebase services

**Authentication:**
- Firebase Console → Authentication → Get Started
- Sign-in method → Enable **Google**

**Firestore Database:**
- Firebase Console → Firestore Database → Create database
- Start in **production mode**
- Choose a region (e.g., `asia-south1` for India)

**Storage:**
- Firebase Console → Storage → Get started
- Use default rules (adjust for production)

### 5. Get Firebase config
- Firebase Console → Project Settings (⚙️) → Your apps → Add Web App
- Register app, copy the config object

### 6. Configure environment variables
```bash
cp .env.example .env.local
```

Fill in your Firebase values in `.env.local`:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=smarttask-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smarttask-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=smarttask-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 7. Set Firestore Security Rules
In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles: users can read/write their own
    match /user_profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // All other collections: authenticated users can read/write
    match /{collection}/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 8. Set Firebase Storage Rules
In Firebase Console → Storage → Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### 9. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow prompts. When asked for build settings:
- **Framework**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`

Add environment variables in Vercel dashboard → Project → Settings → Environment Variables.

### Option B: Via GitHub + Vercel Dashboard
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repository
4. Add all `VITE_FIREBASE_*` environment variables
5. Deploy

The `vercel.json` file handles SPA routing automatically.

---

## GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit: SmartTask Firebase migration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smarttask.git
git push -u origin main
```

---

## Firestore Collections

| Collection | Description |
|---|---|
| `user_profiles` | User profiles (keyed by Firebase UID) |
| `tasks` | Task listings |
| `applications` | Student applications to tasks |
| `deliverables` | Uploaded deliverable files |
| `disputes` | Raised disputes |
| `escrows` | Escrow payment records |
| `messages` | Task chat messages |
| `milestones` | Task milestones |
| `notifications` | In-app notifications |
| `reviews` | Student reviews from clients |
| `skill_verifications` | Skill verification requests |

---

## User Roles

- **Student**: Browses tasks, applies, submits work, gets paid
- **Client**: Posts tasks, reviews applicants, manages escrow

Role is set during profile setup after first Google Sign-In.
