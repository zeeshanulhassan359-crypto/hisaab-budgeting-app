# Curious Champs

A question-and-answer app for children aged 3–12, for iOS and Android. Children ask by voice or text and get short, safe answers matched to their age, with a picture, optional approved videos, and small rewards. Parents set the app up and see what was asked.

Built with React Native and Expo (one TypeScript codebase for both platforms) and a small Node server that does the safety checks and calls Claude.

```
curious-champs/
├── src/app/            Screens (Expo Router: each file is a screen)
│   ├── setup.tsx         Parent sets nickname, avatar, age group, consent
│   ├── home.tsx          Child home, themed per age group
│   ├── listen.tsx        Voice question, then "Did you ask…?" check
│   ├── answer.tsx        Answer with picture, read-aloud, fun fact, steps, video, reward
│   ├── parent-gate.tsx   Grown-ups-only maths check
│   └── parent.tsx        Parent zone: history, sensitive questions, controls
├── src/theme/ageThemes.ts  Colours, fonts, sizes and voice speed for 3–5 / 6–8 / 9–12
├── src/lib/api.ts          Calls the server; falls back to the offline pack
├── src/lib/offlinePack.ts  Answers written ahead of time, which work without internet
├── src/media/videos.ts     Allowlist of approved videos (empty until you add some)
└── server/                 Safety server (Node + TypeScript + Claude)
```

## How an answer is made safe

1. **On the phone:** personal details (emails, phone numbers, addresses, passwords) are caught and never sent.
2. **Server, question check:** Claude labels the question as ok, sensitive, disclosure, personal info, or unsafe. Unsafe questions get a kind redirect. A child saying they are hurt or unsafe gets a fixed, pre-written reply telling them to tell a trusted grown-up, and the question is flagged for the parent.
3. **Server, answer:** Claude writes the answer with age-specific instructions (length, words, tone, how to handle death, bodies, scary news, and so on). It returns structured data, and it picks only a topic tag for the picture, never a URL.
4. **Server, answer check:** the answer is scanned for links and contact details, then a second Claude review checks it is safe and right for the age. If it fails, the child sees a gentle "let's try again" instead.
5. **Pictures and videos:** only from the app's own checked library. Videos must be added by hand to `src/media/videos.ts` after a person has watched them.
6. If Claude declines a request on safety grounds, the request automatically falls back to another model. If every model declines, the child gets a kind redirect.

The server never logs question text. Profile, history and settings stay on the device.

## Run it

### 1. Server

```bash
cd server
npm install
cp .env.example .env        # add your ANTHROPIC_API_KEY
export $(cat .env | xargs)
npm run dev                 # http://localhost:8787
npm test                    # local safety checks
```

### 2. App

```bash
npm install
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8787 npx expo run:android   # or run:ios on a Mac
```

Voice input (`expo-speech-recognition`) is a native module, so the app needs a **development build**. It won't run in the Expo Go app. Use `npx expo run:android` / `npx expo run:ios`, or build in the cloud with `npx eas-cli@latest build --profile development`.

On a phone, `localhost` means the phone itself, so point `EXPO_PUBLIC_API_URL` at your computer's IP address or at your deployed server.

Without the server the app still works: questions covered by the offline pack (sky, rain, cats, the moon, rainbows, stars, sleep, dinosaurs) are answered on the device, and other questions get "let's ask when we're online".

### Checks

```bash
npm run typecheck            # app
cd server && npm run typecheck && npm test
```

## Before publishing to the stores

- **Privacy policy and parental consent** that meet COPPA (US), GDPR-K (EU/UK) and any local rules. The setup screen has a consent toggle; link it to your real policy.
- **App Store Kids Category / Google Play Families:** no third-party ads or analytics, parent gate before links or purchases (done), and accurate age ratings.
- **Protect the server:** host it (e.g. Cloud Run, Fly.io, Render) with HTTPS, and add Firebase App Check or Play Integrity / App Attest so only your app can call it.
- **Approved videos:** host your own reviewed clips and list them in `src/media/videos.ts`.
- **Test with real questions** from children of each age, and have a person review a sample of answers regularly.
- Not built yet: daily time limits, cloud sync of history between parent devices, more offline packs, Urdu and other languages, real app icons.
