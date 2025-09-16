# Health Promise - Ionic React App

A comprehensive Ionic React application with Firebase integration, built with TypeScript and Capacitor for cross-platform mobile development.

## 🚀 Features

- **Authentication**: Google Sign-In with Firebase Auth
- **Database**: Firestore integration for real-time data
- **Push Notifications**: Firebase Cloud Messaging setup
- **Mobile Plugins**: Camera, Local Notifications, Browser
- **Cross-Platform**: iOS and Android support via Capacitor
- **Code Quality**: ESLint and Prettier configuration

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication, Firestore, and Cloud Messaging enabled
- For iOS development: Xcode and iOS Simulator
- For Android development: Android Studio and Android SDK

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd healthPromise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase configuration**
   
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

   > **Note**: Copy the values from your Firebase project settings. Never commit the `.env` file to version control.

## 🔥 Firebase Setup

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication, Firestore Database, and Cloud Messaging

### 2. Configure Authentication
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Google Sign-In
3. Add your domain to authorized domains

### 3. Configure Firestore
1. Go to Firestore Database
2. Create a database in test mode (for development)
3. The app will automatically create the `sampleData` collection

### 4. Configure Cloud Messaging
1. Go to Project Settings > Cloud Messaging
2. Generate a Web Push certificate
3. Copy the VAPID key to your `.env` file

## 🏃‍♂️ Running the Project

### Development Server
```bash
npm run dev
# or
ionic serve
```

The app will be available at `http://localhost:8100`

### Building for Production
```bash
npm run build
```

### Linting and Formatting
```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is formatted correctly
npm run format:check
```

## 📱 Mobile Development

### iOS Setup
1. **Add iOS platform** (if not already added)
   ```bash
   npx cap add ios
   ```

2. **Build and sync**
   ```bash
   npm run build
   npx cap sync ios
   ```

3. **Open in Xcode**
   ```bash
   npx cap open ios
   ```

4. **Run on iOS Simulator**
   - Select a simulator in Xcode
   - Click the Run button

### Android Setup
1. **Add Android platform** (if not already added)
   ```bash
   npx cap add android
   ```

2. **Build and sync**
   ```bash
   npm run build
   npx cap sync android
   ```

3. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

4. **Run on Android Emulator**
   - Start an Android emulator
   - Click Run in Android Studio

## 🧪 Testing

### Unit Tests
```bash
npm run test.unit
```

### E2E Tests
```bash
npm run test.e2e
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Configuration files (Firebase, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # Business logic and API calls
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── theme/              # Ionic theme customization
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test.unit` - Run unit tests
- `npm run test.e2e` - Run E2E tests

## 📦 Capacitor Plugins

The following Capacitor plugins are included and configured:

- **@capacitor/camera** - Camera access for taking photos
- **@capacitor/local-notifications** - Local push notifications
- **@capacitor/browser** - In-app browser for external links
- **@capacitor/app** - App lifecycle events
- **@capacitor/haptics** - Haptic feedback
- **@capacitor/keyboard** - Keyboard management
- **@capacitor/status-bar** - Status bar customization

## 🔐 Environment Variables

All Firebase configuration is handled through environment variables for security:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Analytics measurement ID
- `VITE_FIREBASE_VAPID_KEY` - FCM VAPID key

## 🚨 Troubleshooting

### Common Issues

1. **Firebase configuration errors**
   - Ensure all environment variables are set correctly
   - Check that your Firebase project has the required services enabled

2. **Build errors**
   - Run `npm run build` to check for TypeScript errors
   - Ensure all dependencies are installed with `npm install`

3. **Mobile build issues**
   - Make sure to run `npx cap sync` after making changes
   - Check that the native platforms are properly configured

4. **Authentication issues**
   - Verify Google Sign-In is enabled in Firebase Console
   - Check that your domain is added to authorized domains

## 📚 Additional Resources

- [Ionic Framework Documentation](https://ionicframework.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://reactjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information about your problem

---

**Happy coding! 🎉**
