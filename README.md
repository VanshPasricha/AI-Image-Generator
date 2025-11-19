# AI Image Generator 🪄✨

A sleek, responsive web application that allows you to generate AI images directly in your browser using various models from the Hugging Face Inference API. Describe your imagination and watch it come to life!




---

## ✨ Features

-   **Multi-Model Support**: Generate images using different AI models, including `FLUX`, `Stable Diffusion XL`, `Stable Diffusion v1.5`, and `Openjourney`.
-   **Customizable Generation**: Control the output by selecting the number of images (1-4) and the aspect ratio (Square, Landscape, Portrait).
-   **"Surprise Me" Prompts**: Not sure what to create? Use the dice button 🎲 to get a random creative prompt.
-   **Light & Dark Mode**: A beautiful theme toggle that respects your system preference and saves your choice in local storage. 🌓
-   **Fully Responsive**: A clean, modern UI that works perfectly on desktops, tablets, and mobile devices.
-   **Real-time Status**: See the status of each image generation in real-time with loading spinners and clear error messages.
-   **Download Images**: Easily save your favorite creations with a one-click download button.
-   **Vanilla JS**: Built with pure HTML, CSS, and JavaScript, with no external frameworks needed (besides Font Awesome for icons).

---

## 🛠️ Technologies Used

-   **HTML5**
-   **CSS3** (with CSS Variables for theming)
-   **Vanilla JavaScript**
-   **[Hugging Face Inference API](https://huggingface.co/inference-api)**
-   **[Font Awesome](https://fontawesome.com/)** for icons

---

## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a **Hugging Face API Key** to use the image generation features.

1.  Create a free account on [Hugging Face](https://huggingface.co/join).
2.  Go to your profile settings and navigate to the **Access Tokens** section.
3.  Create a new token with `read` permissions.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd your-repository-name
    ```
3.  **For Local Development (Optional):**
    ```bash
    npm i -g vercel
    vercel dev
    ```
    Then open http://localhost:3000

4.  **For Production Deployment:**
    This project is now configured for secure deployment on Vercel with API key protection.

---

## 📖 How to Use

1.  **Describe your image**: Type a detailed description of the image you want to create in the text area.
2.  **Get Inspired**: Click the dice button (🎲) if you need a random prompt idea.
3.  **Select Options**:
    -   Choose an AI model from the first dropdown.
    -   Select the number of images to generate.
    -   Choose the desired aspect ratio.
4.  **Generate**: Click the **Generate** button and wait for the magic to happen!
5.  **Download**: Once an image is generated, hover over it and click the download icon (📥) to save it.

---

## 🚀 Vercel Deployment

This project is now configured for secure deployment on Vercel with proper API key protection.

### Project Structure
- `public/index.html`, `public/style.css`, `public/hand.js` – Frontend files
- `api/generate.js` – Serverless function that securely calls Hugging Face API
- `vercel.json` – Deployment configuration

### Deploy to Vercel
1. Import this repository on [Vercel](https://vercel.com/new)
2. Add environment variable:
   - **Key**: `HF_API_KEY`
   - **Value**: Your Hugging Face API key (starts with `hf_...`)
   - **Location**: Project → Settings → Environment Variables
3. Deploy!

### Security Features
- ✅ API key is stored securely as an environment variable
- ✅ Frontend calls `/api/generate` (serverless function) instead of directly calling Hugging Face
- ✅ No sensitive data exposed in browser
- ✅ Same-origin requests prevent CORS issues

### How It Works
1. Frontend sends POST to `/api/generate` with `{ model, inputs, parameters, options }`
2. Serverless function forwards request to Hugging Face with secure API key
3. Image blob is returned to the client for display/download

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

# Multi‑Service AI Tools Platform (Upgrade)

This repository now includes a full multi‑service AI platform built around the existing image generator (kept intact). The original generator lives at `/index` and is embedded unchanged in the new service page.

## What’s Included
- Landing page (`/`)
- Auth (Email/Password via Firebase Auth)
- Dashboard (`/dashboard`)
- Services:
  - Image Generator (existing) → `/services/image-generator` (embeds `/index`)
  - Voice to Text (Whisper via HF) → `/services/voice-to-text`
  - AI Chatbot (Zephyr via HF) → `/services/chatbot`
  - Text Summarizer (BART via HF) → `/services/summarizer`
- History (`/history`) with download/delete
- Profile (`/profile`)

## Tech Choices
- Frontend: HTML/CSS/JS (no frameworks)
- Backend: Vercel Serverless Functions (Node.js) exposing the required endpoints
- Auth/DB/Storage: Firebase (Auth + Firestore via Admin SDK; optional Storage for images/audio)
- AI: Hugging Face Inference API

## Environment Variables
Create `.env` locally and on Vercel Project → Settings → Environment Variables. See `.env.example`.

Required:
- `HF_API_KEY` – Hugging Face token (read)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` – string with `\n` escaped as `\\n`

Optional:
- `FIREBASE_STORAGE_BUCKET` – e.g. `your-project-id.appspot.com`

## Firebase Setup
1) Create a Firebase project.
2) Enable Authentication → Email/Password.
3) Create a Service Account (Project Settings → Service Accounts → Generate new private key). Use fields for env vars above.
4) (Optional) Set up Cloud Storage bucket if you want images/audio stored publicly.
5) Firestore: no client rules needed (server writes via Admin). Create Database in Native mode.

## Client Firebase Config
Update `public/js/firebase-config.js` with your Web App config (safe to expose). This powers client‑side auth only.

## Routes and Endpoints
Frontend pages:
- `/` → landing
- `/login`, `/signup`
- `/dashboard`
- `/services/image-generator` (embeds existing `/index`)
- `/services/voice-to-text`
- `/services/chatbot`
- `/services/summarizer`
- `/history`, `/profile`

Serverless API:
- `POST /api/generate-image` – proxy to HF image models, saves history, optional upload to Storage
- `POST /api/voice-to-text` – body: `{ audioBase64, contentType, model? }` (default whisper)
- `POST /api/chat` – body: `{ messages:[{role,content}], model?, temperature?, max_new_tokens? }`
- `POST /api/summarize` – body: `{ text, max_length?, model? }`
- `GET /api/user/history?limit=50&serviceType=image|voice|chat|summarize`
- `DELETE /api/user/history/:id`
- `GET /api/user/profile` / `PATCH /api/user/profile`
- `POST /api/auth/session` (internal) – exchanges Firebase ID token for session cookie
- `POST /api/auth/logout` – clears cookie

Auth: All service/user routes require login via Firebase Auth. After login/signup, the client calls `/api/auth/session` to set a secure session cookie used by API routes. The legacy generator still calls `/api/generate`; Vercel rewrites route this to `/api/generate-image` to record history without changing original code.

## Deployment (Vercel)
Already configured via `vercel.json`:
- `"/" → /public/landing.html`
- `/api/generate → /api/generate-image` (keeps existing generator intact)
- Static files from `/public/*`

Steps:
1) Add env vars in Vercel
2) Deploy (or run locally):
   ```bash
   npm i -g vercel
   vercel dev
   ```
3) Open http://localhost:3000

## Notes
- Existing generator code under `/public/index.html`, `/public/hand.js`, `/public/style.css` is unchanged.
- History documents (Firestore): `{ userId, serviceType, input, output, timestamp, metadata }`
- Session cookies secure your API keys—never exposed client‑side.

