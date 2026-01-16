# Gender Reveal Voting App 👶

A fun and interactive Gender Reveal voting app built with Angular 18, Firebase, and Tailwind CSS. Family members can vote on whether they think it's a Boy or Girl, see live voting statistics, and wait for the exciting reveal!

## Features

- 🗳️ **Vote System** - Users vote "Team Boy" 💙 or "Team Girl" 💗
- 📊 **Live Statistics** - Real-time progress bar showing family vote distribution
- ⏰ **Countdown Timer** - Countdown to the reveal moment
- 🎉 **Reveal Animation** - Confetti celebration when the gender is revealed
- 🏆 **Scoreboard** - See who guessed correctly after the reveal
- 🔐 **Google Authentication** - Secure login with Google accounts
- 👑 **Admin Dashboard** - Control the reveal and manage participants

## Prerequisites

- Node.js (v18+)
- Firebase Account

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables**
    - Create a `.env` file in the root directory.
    - Add your Firebase configuration keys:
      ```env
      FIREBASE_API_KEY=your_api_key
      FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
      FIREBASE_PROJECT_ID=your_project_id
      FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
      FIREBASE_MESSAGING_SENDER_ID=your_sender_id
      FIREBASE_APP_ID=your_app_id
      FIREBASE_MEASUREMENT_ID=your_measurement_id
      ```
    - The application will automatically generate the environment files when you run `npm start` or `npm run build`.

3.  **Set Admin**
    - In Firestore, create a collection `settings` and a document `global`.
    - Add a field `adminEmails` (array) and add your Gmail address.
    - Add `isRevealed` (boolean) set to `false`.
    - Add `winningGender` (string) set to `null`.

4.  **Deploy Security Rules**
    - Copy the contents of `firestore.rules` to your Firebase Console Rules tab, or deploy using CLI:
    ```bash
    npx firebase-tools deploy --only firestore:rules
    ```

## Run Locally

```bash
npm start
```
Navigate to `http://localhost:4200`.

## Docker Support

You can also run the application in a Docker container.

1.  **Configure Environment Variables**
    - Copy `.env.example` to `.env` and fill in your Firebase details.
    ```bash
    cp .env.example .env
    ```

2.  **Build and Run**
    ```bash
    docker-compose up --build
    ```
    The application will be available at `http://localhost:8080`.

## Build for Production

```bash
npm run build
```
The output will be in `dist/secret-santa`.

## Admin Controls

The admin dashboard allows you to:
- **Reveal Boy** 💙 or **Reveal Girl** 💗 - Trigger the big reveal for all participants
- **Reset Reveal** - Hide the gender again
- **Reset All Votes** - Clear all participant votes
- **Add/Remove Participants** - Manage who can vote

## Tech Stack

- **Frontend**: Angular 18 (Standalone Components)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **3D Effects**: Three.js
- **Animations**: Canvas Confetti
