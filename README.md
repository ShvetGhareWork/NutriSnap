# 🥗 NutriSnap: Elite Health & Fitness Ecosystem

NutriSnap is a sophisticated, AI-integrated health platform designed to redefine the connection between fitness enthusiasts and professional coaches. By combining real-time data synchronization, advanced AI diagnostics, and a cinematic UI, NutriSnap provides a premium experience for both members and health professionals.

![NutriSnap Banner](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200)

## ✨ Key Features

-   **🤖 AI Nutritionist**: Powered by **Google Gemini**, members can snap photos of their meals to receive instant nutritional breakdowns and health insights.
-   **🤝 Coach-Client Synergy**: A dedicated dashboard for coaches to manage programs, track client progress, and communicate in real-time.
-   **⚡ Real-Time Activity Tracking**: Instant updates on workouts and dietary goals using **Socket.io**.
-   **💳 Secure Monetization**: Integrated **Razorpay** support for seamless program subscriptions and payments.
-   **🎥 Interactive Onboarding**: A cinematic guided tour using `driver.js` ensures users can navigate the platform with ease.
-   **📊 Visual Analytics**: Beautifully rendered progress charts using **Recharts**.
-   **🔒 Enterprise Security**: Secure authentication via **NextAuth.js** and encrypted data handling with **bcryptjs**.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: Next.js 15+ (App Router)
-   **Styling**: Tailwind CSS & Framer Motion (for high-fidelity animations)
-   **State Management**: Zustand
-   **Icons**: Lucide React
-   **Real-time**: Socket.io-client

### Backend
-   **Runtime**: Node.js & Express
-   **Database**: MongoDB (via Mongoose)
-   **Cloud Storage**: Cloudinary (for meal and profile images)
-   **Payments**: Razorpay Node SDK
-   **AI**: Google Generative AI (Gemini)

---

## 📂 Project Structure

```text
NutriSnapCraze/
├── client/          # Next.js Application
│   ├── app/         # Routes and Layouts
│   ├── components/  # Atomic UI Components
│   └── lib/         # Utility functions & API clients
├── server/          # Node.js Express Server
│   ├── src/         # API logic & Routes
│   ├── models/      # Mongoose Schemas
│   └── config/      # System configurations
└── README.md        # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v20+)
-   MongoDB Instance (Local or Atlas)
-   Cloudinary Account
-   Razorpay Developer Account
-   Google AI Studio API Key

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Prathamesh1828/NutriSnapp.git
    cd NutriSnapCraze
    ```

2.  **Setup Server**
    ```bash
    cd server
    npm install
    # Create a .env file based on the environment variables section below
    npm run dev
    ```

3.  **Setup Client**
    ```bash
    cd ../client
    npm install
    # Create a .env.local file
    npm run dev
    ```

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` files:

### Backend (`/server/.env`)
- `PORT`: Server port
- `MONGODB_URI`: Your MongoDB connection string
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `RAZORPAY_KEY_ID`: Your Razorpay Key
- `RAZORPAY_KEY_SECRET`: Your Razorpay Secret

### Frontend (`/client/.env.local`)
- `NEXT_PUBLIC_API_URL`: Your backend URL
- `NEXTAUTH_SECRET`: A secure secret for authentication
- `GOOGLE_GEMINI_API_KEY`: Your Google Gemini API Key

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).

---

## 🙏 Acknowledgments
-   **Google Gemini** for providing cutting-edge AI capabilities.
-   **Next.js Team** for the incredible framework.
-   **Framer** for making animations seamless.

---