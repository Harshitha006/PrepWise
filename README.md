# PrepWise - AI Interview Coach

PrepWise is a cutting-edge, 100% free interview preparation platform designed to help job seekers practice technical and behavioral interviews. It leverages **Google Gemini** for intelligent question generation and feedback, and the native **Web Speech API** for real-time voice interaction—eliminating the need for expensive external speech services.

## 🚀 Features

*   **🎙️ Human-like Mock Interviews**: Conduct realistic voice interviews with an AI that speaks and listens in real-time.
*   **🤖 Smart Question Generation**: Uses Google Gemini to create tailored questions based on your specific resume, job role, and experience level.
*   **📄 Resume Analysis**: Upload your PDF resume for instant ATS parsing and skill gap analysis.
*   **📊 Detailed Feedback**: Get comprehensive post-interview analytics, including scores for:
    *   Technical Knowledge
    *   Communication
    *   Problem Solving
    *   Cultural Fit
*   **🔐 Secure Authentication**: Robust user management powered by Firebase Auth and server-side session cookies.
*   **🌓 Modern UI**: A sleek, responsive interface built with Shadcn/UI, Tailwind CSS, and Framer Motion.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend & Services
*   **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
*   **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
*   **AI Model**: [Google Gemini 1.5 Flash](https://deepmind.google/technologies/gemini/) (via Vercel AI SDK)
*   **Voice Engine**: [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (Speech-to-Text & Text-to-Speech)
*   **PDF Parsing**: `pdf-parse`

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18.17 or later)
*   A Firebase Project
*   A Google AI Studio API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/prepwise.git
    cd prepwise
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory and add your credentials:

    ```env
    # Firebase Client SDK
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # Firebase Admin SDK
    FIREBASE_PROJECT_ID=your_project_id
    FIREBASE_CLIENT_EMAIL=your_client_email
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

    # Google AI (Gemini)
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to verify the app is running.

## 📁 Project Structure

```
├── app/
│   ├── (auth)/             # Authentication pages (sign-in, sign-up)
│   ├── (root)/             # Main application layout & dashboard
│   ├── api/                # Next.js API Routes (Gemini integration, stats)
│   ├── interview/          # Interview functionality (setup, session, results)
│   ├── history/            # User's interview history
│   └── settings/           # User configuration
├── components/
│   ├── ui/                 # Reusable Shadcn/UI components
│   ├── InterviewAgent.tsx  # Core logic for Web Speech API & interview flow
│   ├── Navbar.tsx          # Responsive navigation
│   └── ResumeUpload.tsx    # PDF parsing and analysis component
├── lib/
│   ├── auth.ts             # Authentication utilities
│   └── firebase/           # Firebase client & admin initialization
└── public/                 # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
