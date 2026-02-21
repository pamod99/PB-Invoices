# PB Creative Invoice Manager

A professional invoice generation system built with React, TypeScript, and Firebase.

## Prerequisites

Before running this project on your MacBook, ensure you have the following installed:

*   **Node.js** (Version 16 or higher) - [Download Here](https://nodejs.org/)
*   **VS Code** (Recommended Editor) - [Download Here](https://code.visualstudio.com/)

## Installation Guide

1.  Open your **Terminal**.
2.  Navigate to this project folder.
3.  Run the following command to install all dependencies:
    ```bash
    npm install
    ```

## Setting up the Database (Firebase)

To save invoices to the cloud, you need a Firebase project.

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project (e.g., "pb-invoices").
3.  Navigate to **Build > Firestore Database** and click **Create Database**.
    *   Select **Start in Test Mode**.
    *   *Why Test Mode?* It allows your app to write data without setting up complex security rules or login systems immediately. Perfect for local tools.
4.  Go to **Project Settings** (Gear icon) > **General**.
5.  Scroll down to "Your apps" and click the web icon (</>) to create a web app.
6.  Copy the `firebaseConfig` object provided.
7.  Open the file `firebaseConfig.ts` in this project and paste your keys there.

## Running the App

Once installed, start the application by running:

```bash
npm run dev
```

Open your browser and go to the link shown in the terminal (usually `http://localhost:5173`).

## Offline Mode
If you don't set up Firebase, the app will work in **Offline Mode** and save data to your browser's Local Storage.