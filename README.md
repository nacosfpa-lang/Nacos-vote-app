# NACOS Electoral Commission — Deployment Guide

This is the same voting app, restructured to run as a normal website instead
of inside Claude. It needs two free accounts: **Firebase** (stores the votes)
and **Vercel** (hosts the site and gives you the public link).

## Step 1 — Create a free Firestore database (5 min)

1. Go to https://console.firebase.google.com and sign in with any Google account.
2. Click **Add project** → name it anything (e.g. `nacos-vote`) → keep defaults → Create.
3. Once inside the project, click the **`</>`** (Web) icon to register a web app.
   Give it any nickname, skip Firebase Hosting (we'll use Vercel instead).
4. Firebase shows you a `firebaseConfig` object. Copy the values into
   `src/firebaseConfig.js` in this project, replacing every `PASTE_...` value.
5. In the left sidebar: **Build → Firestore Database → Create database**.
   Choose **Start in test mode** (fine for a short-lived student election —
   it just means anyone with the app can read/write votes, same as before).
6. Pick any region close to you and click Enable.

That's it — no billing, no credit card needed on the free (Spark) plan.

## Step 2 — Deploy to Vercel (5 min)

1. Go to https://vercel.com and sign up (GitHub login is easiest).
2. Click **Add New → Project**, select this `nacos-vote-app` GitHub repo.
3. Vercel auto-detects it's a Vite project. Click **Deploy**.
4. In about a minute, Vercel gives you a live link like
   `https://nacos-vote-yourname.vercel.app` — that's the link to share.

## Notes

- Every visitor reads/writes the same shared Firestore database — that's
  what keeps votes, candidates, and results consistent for everyone.
- Test mode Firestore rules expire after 30 days by default — fine for a
  one-week student election.
