# 🏠 Doorway Detail - SaaS CRM Platform

> **Premium Exterior Cleaning Services Management System**

A modern, full-stack CRM platform built for service businesses. Features real-time job tracking, automated invoicing, and business intelligence analytics.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

---

## ✨ Features

### 🔐 **Role-Based Access Control (RBAC)**
- Public quote submission form
- Staff-only admin dashboard
- Firebase Authentication integration

### 🎯 **Finite State Machine (FSM) Job Flow**
- **Lead Received** → **Scheduled** → **Completed**
- One-click status transitions
- Real-time UI updates

### 💰 **Invoicing & Revenue Tracking**
- Dynamic price assignment
- Auto-generated invoice pages
- Revenue analytics dashboard

### 📊 **Business Intelligence**
- Interactive Recharts visualizations
- KPI cards (Active Jobs, Total Revenue, Pipeline Value)
- Revenue breakdown by job status

### 🔄 **Real-Time Data Sync**
- Firestore onSnapshot listeners
- Instant updates across all clients
- Optimistic UI patterns

### 🗑️ **Data Management**
- Admin "Janitor" feature (delete bad leads)
- Input validation ("Bouncer")
- Spam prevention (minLength, pattern validation)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS, Lucide React Icons |
| **Backend** | Firebase (Firestore, Authentication) |
| **Charts** | Recharts |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/muhammadbinuc-cpu/doorway-detail-platform.git
   cd doorway-detail-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy Firestore Security Rules**
   
   Copy the rules from `firestore.rules` and deploy via Firebase Console:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
doorway-detail/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx        # Staff authentication
│   │   ├── admin/page.tsx        # Dashboard (protected)
│   │   ├── quote/page.tsx        # Public quote form
│   │   ├── invoice/[id]/page.tsx # Dynamic invoice
│   │   ├── privacy/page.tsx      # Legal page
│   │   └── terms/page.tsx        # Legal page
│   ├── components/               # Reusable React components
│   └── lib/
│       └── firebase.ts           # Firebase config
├── firestore.rules               # Security rules
└── README.md
```

---

## 🖼️ Screenshots

### Landing Page
> Sticky navbar with Staff Login, premium Black/Gold aesthetic, and Get Instant Quote CTA.

### Admin Dashboard
> Real-time job tracking, revenue analytics, and FSM status controls.

### Quote Submission Flow
> Multi-step form with input validation and success animation.

---

## 🔒 Security

- **Firestore Rules**: Public can create quotes, only authenticated staff can read/update
- **Route Guards**: Admin routes redirect to `/login` if unauthenticated
- **Input Validation**: HTML5 validation + pattern matching for phone numbers

---

## 📈 Analytics Features

- **Total Revenue**: Sum of all completed jobs
- **Pipeline Value**: Revenue potential from leads and scheduled jobs
- **Revenue Overview Chart**: Visual breakdown by job status (Leads, Scheduled, Completed)

---

## 🧪 Testing

Run the development server and test:
1. Submit a quote at `/quote`
2. Log in at `/login` (create a user via Firebase Console)
3. View job in `/admin` and update status/price
4. Verify invoice generation at `/invoice/[jobId]`

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Other Platforms
Standard Next.js deployment applies. Ensure environment variables are configured.

---

## 🤝 Contributing

This is a proprietary project. Contact the owner for collaboration opportunities.

---

## 📄 License

© 2025 Doorway Detail. All rights reserved.

---

## 🙏 Acknowledgments

- **Next.js** - The React Framework for Production
- **Firebase** - Cloud services platform
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library built with React and D3

---

**Built with ❤️ by the Doorway Detail Team**
