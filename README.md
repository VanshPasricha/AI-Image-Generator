# AI Image Generator – Vercel Deployment

This project is a static frontend with a secure Vercel Serverless Function that proxies requests to Hugging Face Inference endpoints. Your Hugging Face API key is kept on the server (never exposed in the browser).

## Structure
- `public/index.html`, `public/style.css`, `public/hand.js` – Frontend
- `api/generate.js` – Serverless function (Node.js) that calls Hugging Face
- `vercel.json` – Rewrites `/` to `public/index.html`

## Environment Variables
Create an environment variable on Vercel:
- `HF_API_KEY` – Your Hugging Face API key (value starts with `hf_...`)

Vercel Dashboard:
1. Project Settings → Environment Variables
2. Add `HF_API_KEY`
3. Redeploy

Vercel CLI:
```bash
vercel env add HF_API_KEY production
# Paste your key when prompted
```

## Local Development (optional)
You can preview locally with Vercel CLI.
```bash
npm i -g vercel
vercel dev
```
Then open http://localhost:3000

## Deploy Steps
1. Commit the project to a Git repository (GitHub/GitLab/Bitbucket)
2. Import the repository on [Vercel](https://vercel.com/new)
3. Add `HF_API_KEY` in Project → Settings → Environment Variables
4. Deploy

## Security Notes
- The browser calls `/api/generate` (same origin). The API key lives only in the serverless function and is read from `process.env.HF_API_KEY`.
- If you previously committed your API key in `public/hand.js`, rotate the key from the Hugging Face settings page, and force-remove it from your git history if needed.

## How it works
- Frontend (`public/hand.js`) sends a POST to `/api/generate` with: `{ model, inputs, parameters, options }`
- Serverless function (`api/generate.js`) forwards to `https://router.huggingface.co/hf-inference/models/${model}` with the Authorization header and returns the image blob.
