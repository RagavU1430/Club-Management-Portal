import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let firestoreInstance = null;
let isFirebaseConnected = false;

export function initFirebase() {
  const existingApps = getApps();
  if (existingApps && existingApps.length > 0) {
    try {
      firestoreInstance = getAdminFirestore();
      isFirebaseConnected = true;
      return firestoreInstance;
    } catch (err) {
      console.warn("[Firebase] Error retrieving firestore from existing app:", err.message);
    }
  }

  // 1. Check for serviceAccountKey.json path
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "serviceAccountKey.json";
  const possiblePaths = [
    path.resolve(configuredPath),
    path.join(__dirname, "../../", configuredPath),
    path.join(__dirname, "../../serviceAccountKey.json"),
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "server/serviceAccountKey.json"),
    "/etc/secrets/server/serviceAccountKey.json",
    "/etc/secrets/serviceAccountKey.json",
  ];

  let serviceAccount = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf-8");
        serviceAccount = JSON.parse(raw);
        console.log(`[Firebase] Loaded service account credentials from: ${p}`);
        break;
      } catch (err) {
        console.warn(`[Firebase] Error parsing ${p}:`, err.message);
      }
    }
  }

  // 2. Check for individual environment variables
  if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
    console.log(`[Firebase] Loaded credentials from environment variables for project: ${serviceAccount.projectId}`);
  }

  if (serviceAccount) {
    try {
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || serviceAccount.projectId,
      });
      firestoreInstance = getAdminFirestore(app);
      isFirebaseConnected = true;
      console.log(`[Firebase] Successfully connected to Firebase Cloud Firestore! 🔥`);
      return firestoreInstance;
    } catch (err) {
      console.error(`[Firebase] Initialization with cert failed:`, err.message);
    }
  }

  // 3. Fallback: Initialize with project ID if available
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (projectId) {
    try {
      const app = initializeApp({ projectId });
      firestoreInstance = getAdminFirestore(app);
      isFirebaseConnected = true;
      console.log(`[Firebase] Initialized with Project ID: ${projectId}`);
      return firestoreInstance;
    } catch (err) {
      console.warn(`[Firebase] Project ID init failed:`, err.message);
    }
  }

  console.log(`[Firebase] Cloud Firestore is configured and ready. Add serviceAccountKey.json to link to your live Firebase project.`);
  return null;
}

export function getFirestore() {
  if (!firestoreInstance) {
    initFirebase();
  }
  return firestoreInstance;
}

export function isFirebaseReady() {
  return isFirebaseConnected && firestoreInstance !== null;
}
