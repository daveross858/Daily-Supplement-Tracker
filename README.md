# 💊 Daily Supplement Tracker

A modern, mobile-first web application for tracking your daily supplement intake. Built with Next.js, React, TypeScript, and Tailwind CSS, this app provides a native app-like experience for managing your wellness routine.

## ✨ Features

### 🔐 User Authentication
- **Account Creation**: Sign up with email and p#### Data Persistence Issues
- **Remember**: This app uses localStorage, which is browser and device-specific
- **No Cross-Device Sync**: Users will need to recreate accounts on each device
- **Data Isolation**: Each browser/device maintains separate user data
- **Future Enhancement**: Consider implementing user account sync or backup features for production use

## 📱 Usage Guiderd
- **Secure Login**: User sessions with local authentication
- **User Profile Management**: Profile dropdown with logout functionality
- **Data Isolation**: Each user has their own private supplement data

### 📱 Mobile-First Design
- **Native App Feel**: Touch-friendly interface with smooth animations
- **Responsive Layout**: Optimized for mobile phones, tablets, and desktop
- **Bottom Navigation**: Easy thumb navigation on mobile devices
- **Gradient Headers**: Beautiful visual design with modern styling
- **Active States**: Visual feedback for all interactions

### 🏠 Daily Tracking (Homepage)
- **Today's Overview**: Real-time stats dashboard showing completion progress
- **Time-Based Categories**: Organize supplements by when you take them:
  - Morning (Wake + Breakfast)
  - Midday (Lunch + Afternoon)
  - Pre-Workout (Workout days)
  - Evening (Dinner)
  - Before Bed
- **Quick Actions**: Mark supplements as taken/not taken with visual feedback
- **Progress Visualization**: Completion percentage and remaining supplements
- **Smart Add Button**: Fixed bottom button for easy supplement addition

### 📚 Supplement Library
- **Pre-loaded Library**: Common supplements with default dosages
- **Quick Add**: Add supplements from library to your daily routine
- **Custom Supplements**: Manually add any supplement with custom dosage
- **Category Management**: Organize supplements by type and timing

### 📊 Weekly View
- **Week-at-a-Glance**: Visual overview of 7 days of supplement tracking
- **Progress Circles**: Color-coded completion indicators for each day
- **Navigation**: Easy week-to-week navigation with current week highlighting
- **Category Breakdown**: See progress by time category for each day
- **Weekly Statistics**: 
  - Total supplements planned
  - Total completed
  - Average daily completion rate
  - Perfect completion days

### 📈 History Page
- **Historical Data**: View all past supplement tracking data
- **Date Organization**: Chronologically organized supplement history
- **Statistics**: Track long-term consistency and patterns
- **Completion Tracking**: See which supplements you've consistently taken

### ⚙️ Settings
- **Account Management**: Update profile information
- **Data Management**: Export/import capabilities (planned)
- **Preferences**: Customize app behavior and appearance

## � Data Storage

### Dual Storage System (Local + Cloud)
This application now supports **both local storage and cloud storage** with Firebase:

- **📱 Device-Specific**: Data is stored locally on each device/browser
- **🔒 Privacy-First**: No data is sent to external servers
- **⚡ Fast Access**: Instant data retrieval with no network requests
- **👤 User Isolation**: Each user account has separate data storage
- **🌐 Browser-Bound**: Data is tied to the specific browser/device

### What Gets Stored Locally:
- **User Accounts**: Email, name, hashed passwords
- **Authentication Sessions**: Login state and session tokens
- **Daily Supplement Data**: All supplement tracking information
- **Supplement Library**: Personal supplement library and preferences
- **Historical Data**: All past tracking data and statistics

### Important Considerations:
- **⚠️ Browser Clearing**: Data will be lost if you clear browser data/cookies
- **📱 Device Switching**: Data doesn't sync between different devices/browsers
- **🔄 No Backup**: Currently no automatic backup or export functionality
- **👥 Single Device**: Best used on your primary device for consistent tracking

### Data Security:
- **🔐 Password Hashing**: Passwords are hashed before storage
- **🏠 Local Only**: No data transmitted to external servers
- **🔒 Browser Security**: Protected by browser's security model

### Future Enhancements:
The roadmap includes adding cloud sync and backup options while maintaining privacy and user control.

## �🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **State Management**: React Context API for authentication
- **Data Storage**: Local Storage with user-specific data isolation (default) + Optional Firebase cloud storage
- **Database**: Firebase Firestore for cloud storage (optional)
- **Authentication**: Local authentication + Firebase Auth (optional)
- **Icons**: Emoji and Unicode symbols for visual elements

## � Firebase Setup (Optional Cloud Storage)

### Why Firebase?
Enable Firebase to get:
- **☁️ Cloud Storage**: Your data syncs across all devices
- **🔄 Real-time Sync**: Changes appear instantly on all your devices  
- **💾 Automatic Backup**: Never lose your supplement tracking data
- **🛡️ Secure Authentication**: Professional-grade user authentication
- **📱 Offline Support**: Works offline and syncs when you're back online

### Quick Setup (5 minutes):

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "my-supplement-tracker")
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 2. Enable Required Services
**Enable Firestore Database:**
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (you can secure it later)
4. Select a region closest to you
5. Click "Done"

**Enable Authentication:**
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

#### 3. Get Your Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Register your app (name: "Daily Supplement Tracker")
5. Copy the `firebaseConfig` object

#### 4. Configure Your App
1. **Copy environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Update `.env.local` with your Firebase config:**
   ```bash
   NEXT_PUBLIC_USE_FIREBASE=true
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789000
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789000:web:abcdef123456789
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

#### 5. Data Migration
- Existing localStorage data automatically migrates to Firebase on first login
- No data loss during the transition
- You can switch back to localStorage anytime by setting `NEXT_PUBLIC_USE_FIREBASE=false`

### Firestore Security Rules (Recommended)
Replace the default rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /dailyData/{document} {
      allow read, write: if request.auth != null && 
        resource.id.matches(request.auth.uid + '_.*');
    }
    
    match /supplementLibraries/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## �🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/daveross858/Daily-Supplement-Tracker.git
   cd Daily-Supplement-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## � Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com/), the platform from the creators of Next.js.

#### Option 1: Deploy from GitHub (Recommended)
1. **Push to GitHub**: Make sure your code is pushed to a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com/)
   - Sign up/login with your GitHub account
   - Click "New Project"
   - Import your repository
3. **Configure Settings**:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install`
4. **Deploy**: Click "Deploy" and your app will be live in minutes
5. **Custom Domain** (Optional): Add your custom domain in project settings

#### Option 2: Deploy with Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts to configure your deployment
```

### Netlify

1. **Build Settings**:
   ```
   Build command: npm run build
   Publish directory: out
   ```

2. **Add Export Script**:
   Add to `package.json`:
   ```json
   {
     "scripts": {
       "export": "next export"
     }
   }
   ```

3. **Update Build Command**:
   ```
   Build command: npm run build && npm run export
   ```

### AWS Amplify

1. **Connect Repository**: Link your GitHub repository to AWS Amplify
2. **Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder /app/package.json ./package.json
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

2. **Build and Run**:
   ```bash
   # Build the Docker image
   docker build -t supplement-tracker .

   # Run the container
   docker run -p 3000:3000 supplement-tracker
   ```

### Railway

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Environment Variables**: Set `NODE_ENV=production`
3. **Automatic Deployment**: Railway will automatically detect Next.js and deploy

### DigitalOcean App Platform

1. **Create App**: Connect your GitHub repository
2. **App Spec**:
   ```yaml
   name: supplement-tracker
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/Daily-Supplement-Tracker
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     routes:
     - path: /
   ```

### Environment Variables

For production deployments, you may want to set:

```bash
# Production environment
NODE_ENV=production

# Optional: Analytics or monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Optional: Custom API endpoints (future feature)
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Pre-Deployment Checklist

- [ ] **Test Build Locally**: Run `npm run build` and `npm start` locally
- [ ] **Check Dependencies**: Ensure all dependencies are in `package.json`
- [ ] **Optimize Images**: Ensure images are optimized for web
- [ ] **Environment Variables**: Set up any required environment variables
- [ ] **Custom Domain**: Configure custom domain if needed
- [ ] **SSL Certificate**: Ensure HTTPS is enabled (most platforms do this automatically)
- [ ] **Performance Testing**: Test the deployed app on various devices
- [ ] **SEO Optimization**: Add meta tags and ensure proper indexing

### Post-Deployment Steps

1. **Test All Features**: Verify authentication, data persistence, and all pages work
2. **Mobile Testing**: Test on actual mobile devices
3. **Performance Monitoring**: Set up monitoring for performance and errors
4. **Backup Strategy**: Consider data backup for user information
5. **Updates**: Set up CI/CD for automatic deployments on code changes

### Troubleshooting Deployment Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

#### Runtime Errors
- Check browser console for JavaScript errors
- Verify all environment variables are set correctly
- Ensure the hosting platform supports Node.js 18+

#### Data Persistence Issues
- Remember: This app uses localStorage, which is browser-specific
- For production, consider implementing user account sync or backup features

## �📱 Usage Guide

### Getting Started
1. **Create Account**: Sign up with your email and password
2. **Add Supplements**: Use the library or manually add your supplements
3. **Set Categories**: Choose when you take each supplement
4. **Daily Tracking**: Mark supplements as taken throughout the day
5. **Review Progress**: Check your weekly and historical progress

### Daily Workflow
1. **Morning Check**: Review today's supplement plan
2. **Real-time Updates**: Mark supplements as taken throughout the day
3. **Progress Monitoring**: Watch your completion percentage increase
4. **Evening Review**: Ensure all supplements are marked complete

### Weekly Planning
1. **Weekly View**: Review the past week's consistency
2. **Identify Patterns**: See which days or categories need attention
3. **Adjust Routine**: Add or remove supplements based on patterns

## 🏗 Project Structure

```
Daily-Supplement-Tracker/
├── components/           # Reusable React components
│   ├── AuthForm.tsx     # Login/signup form component
│   └── Layout.tsx       # App layout with navigation
├── contexts/            # React Context providers
│   └── AuthContext.tsx  # Authentication state management
├── pages/               # Next.js pages (routes)
│   ├── _app.tsx        # App wrapper with providers
│   ├── _document.tsx   # HTML document structure
│   ├── index.tsx       # Homepage - daily tracking
│   ├── weekly.tsx      # Weekly progress view
│   ├── history.tsx     # Historical data view
│   └── settings.tsx    # User settings page
├── styles/              # Global styles
│   └── globals.css     # Tailwind CSS imports
├── utils/               # Utility functions
│   └── storage.ts      # Data persistence and user management
├── public/              # Static assets
└── package.json        # Project dependencies
```

## 🔧 Key Components

### Authentication System
- **AuthContext**: Global authentication state management
- **User Sessions**: Persistent login with local storage
- **Data Isolation**: User-specific data storage and retrieval
- **Security**: Password hashing and session management

### Data Management
- **Local Storage**: Browser-based data persistence (stored locally on each device)
- **User Isolation**: Separate data namespaces per user
- **Type Safety**: TypeScript interfaces for all data structures
- **Real-time Updates**: Immediate UI updates on data changes

### Mobile Optimization
- **Touch Targets**: Large, easy-to-tap buttons and controls
- **Responsive Grid**: Flexible layouts for all screen sizes
- **Bottom Navigation**: Thumb-friendly mobile navigation
- **Active States**: Visual feedback for all interactions

## 🎨 Design Philosophy

### Mobile-First Approach
- Designed primarily for mobile phone usage
- Touch-friendly interface with large tap targets
- Bottom navigation for easy thumb access
- Swipe-friendly interactions and animations

### Native App Feel
- Smooth transitions and micro-interactions
- Color-coded progress indicators
- Gradient backgrounds and modern styling
- Consistent visual feedback

### User Experience
- Minimal cognitive load with clear visual hierarchy
- Quick actions for common tasks
- Progress visualization to maintain motivation
- Consistent interaction patterns throughout the app

## 🔮 Future Enhancements

### Planned Features
- [ ] Data export/import functionality
- [ ] Supplement reminder notifications
- [ ] Progress charts and analytics
- [ ] Custom time categories
- [ ] Supplement interaction warnings
- [ ] Cloud sync capabilities
- [ ] Social sharing features
- [ ] Goal setting and achievements

### Technical Improvements
- [ ] Progressive Web App (PWA) support
- [ ] Offline functionality
- [ ] Database integration option
- [ ] API endpoints for data management
- [ ] Performance optimizations
- [ ] Accessibility improvements

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. **Code Style**: Follow the existing TypeScript and React patterns
2. **Mobile First**: Ensure all features work well on mobile devices
3. **Type Safety**: Maintain TypeScript type coverage
4. **Testing**: Test on multiple screen sizes and devices
5. **Documentation**: Update README for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons and emojis for visual elements
- Inspired by modern mobile app design patterns

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include your browser and device information for mobile-specific issues

---

**Made with ❤️ for wellness and health tracking**