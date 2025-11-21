# 🎨 AI Image Generator

A modern, professional web application that transforms text prompts into stunning AI-generated images using state-of-the-art models like FLUX.1 and Stable Diffusion.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://ai-image-generator-omega-rouge.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- 🤖 **Multiple AI Models** - Choose from FLUX.1-dev, FLUX.1-schnell, and Stable Diffusion XL
- 🎯 **Custom Aspect Ratios** - Square, Landscape, Portrait, and more
- ⚡ **Fast Generation** - Get results in under 10 seconds
- 🔐 **User Authentication** - Secure login with Firebase
- 👤 **Profile Management** - Customize your account settings
- 📱 **Responsive Design** - Works perfectly on all devices
- 🎨 **Professional UI** - Beautiful SaaS-style interface with smooth animations

## 🚀 Live Demo

Visit the live application: [https://ai-image-generator-omega-rouge.vercel.app](https://ai-image-generator-omega-rouge.vercel.app)

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Vanilla JS for interactivity
- **AOS** - Animate On Scroll library

### Backend
- **Node.js** - Runtime environment
- **Vercel Serverless Functions** - API endpoints
- **Firebase Authentication** - User management
- **Firebase Firestore** - NoSQL database

### AI & APIs
- **Hugging Face Inference API** - AI model hosting
- **FLUX.1** - Advanced image generation models
- **Stable Diffusion** - Industry-standard diffusion models

### DevOps
- **Vercel** - Deployment and hosting
- **Git & GitHub** - Version control
- **Environment Variables** - Secure configuration

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Hugging Face API key

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/VanshPasricha/AI-Image-Generator.git
   cd AI-Image-Generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   HF_API_KEY=your_huggingface_api_key
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   # ... other Firebase credentials
   ```

4. **Update Firebase config**
   
   Edit `public/js/firebase-config.js` with your Firebase project details.

5. **Run development server**
   ```bash
   npx vercel dev --listen 3000
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000/landing`

## 🎯 Usage

### Generating Images

1. **Navigate to the Generator**
   - Click "Generate" in the navigation bar
   - Or visit `/services/image-generator`

2. **Enter Your Prompt**
   - Describe the image you want to create
   - Example: "A serene mountain landscape at sunset with vibrant colors"

3. **Select Options**
   - Choose AI model (FLUX.1-dev for quality, FLUX.1-schnell for speed)
   - Select aspect ratio (1:1, 16:9, 9:16, etc.)
   - Choose number of images (1-4)

4. **Generate & Download**
   - Click "Generate" button
   - Wait for processing (5-30 seconds)
   - Download your images

## 📁 Project Structure

```
AI-Image-Generator/
├── api/                          # Serverless API functions
│   ├── generate.js              # Image generation endpoint
│   ├── auth/                    # Authentication endpoints
│   │   └── session.js
│   ├── user/                    # User management
│   │   ├── profile.js
│   │   └── update-profile.js
│   └── _lib/                    # Shared utilities
│       ├── firebase-admin.js
│       ├── verifyAuth.js
│       └── error-handler.js
├── public/                       # Frontend files
│   ├── landing.html             # Landing page
│   ├── dashboard.html           # User dashboard
│   ├── profile.html             # Profile management
│   ├── index.html               # Image generator UI
│   ├── hand.js                  # Generator logic
│   ├── css/                     # Stylesheets
│   │   ├── main.css
│   │   └── components.css
│   ├── js/                      # JavaScript modules
│   │   ├── firebase-config.js
│   │   ├── auth.js
│   │   └── api.js
│   └── services/
│       └── image-generator.html # Generator page
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── vercel.json                  # Vercel configuration
└── README.md                    # This file
```

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `HF_API_KEY` | Hugging Face API key |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key (public) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID (public) |

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - Add all variables from `.env`
   - Make sure to format `FIREBASE_PRIVATE_KEY` correctly

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live! 🎉

## 🎨 Features in Detail

### AI Models

- **FLUX.1-dev**: High-quality, detailed images with superior prompt understanding
- **FLUX.1-schnell**: Fast generation with good quality, ideal for quick iterations
- **Stable Diffusion XL**: Versatile, widely-used model with consistent results

### User Features

- **Authentication**: Secure email/password login with Firebase
- **Profile Management**: Update display name and email
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Professional dark mode interface

### Technical Features

- **Serverless Architecture**: Auto-scaling, cost-effective
- **Real-time Updates**: Instant UI feedback
- **Error Handling**: Graceful error messages
- **Security**: Environment variables, input validation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Vansh Pasricha**

- GitHub: [@VanshPasricha](https://github.com/VanshPasricha)
- Project Link: [https://github.com/VanshPasricha/AI-Image-Generator](https://github.com/VanshPasricha/AI-Image-Generator)

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co) for AI model hosting
- [Vercel](https://vercel.com) for seamless deployment
- [Firebase](https://firebase.google.com) for authentication and database
- [Black Forest Labs](https://blackforestlabs.ai) for FLUX models
- [Stability AI](https://stability.ai) for Stable Diffusion

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

**Made with ❤️ by Vansh Pasricha**
