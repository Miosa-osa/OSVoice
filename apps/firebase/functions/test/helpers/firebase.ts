import * as admin from "firebase-admin";
import * as adminFirestore from "firebase-admin/firestore";
import { getApp, initializeApp } from "firebase/app";
import {
	connectAuthEmulator,
	createUserWithEmailAndPassword,
	getAuth,
	signInWithEmailAndPassword,
	signOut,
} from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import {
	connectFirestoreEmulator,
	getFirestore,
	initializeFirestore,
	terminate,
} from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { nanoid } from "nanoid";
import {
	getClientFirebaseAuthEmulatorUrl,
	getClientFirestoreHost,
	getClientFunctionsHost,
	getClientStorageHost,
	getEmulatorDatabaseUrl,
	getFirebaseAuthEmulatorHost,
	getFirebaseFunctionsEndpoint,
	getFirestoreEmulatorHost,
	getGcloudProject,
	getRealtimeDatabaseEmulatorHost,
	getShowWarnings,
} from "./env";

let firebaseInitialized = false;

export async function initializeFirebase() {
	if (firebaseInitialized) {
		return;
	}
	process.env.FIRESTORE_EMULATOR_HOST = getFirestoreEmulatorHost();
	process.env.FIREBASE_AUTH_EMULATOR_HOST = getFirebaseAuthEmulatorHost();
	process.env.GCLOUD_PROJECT = getGcloudProject();
	process.env.REALTIME_DATABASE_EMULATOR_HOST =
		getRealtimeDatabaseEmulatorHost();

	admin.initializeApp({
		databaseURL: getEmulatorDatabaseUrl(),
	});
	adminFirestore.getFirestore().settings({ ignoreUndefinedProperties: true });

	// enable warnings if the SHOW_WARNINGS env variable is set
	if (!getShowWarnings()) {
		const originalWarn = console.warn;
		console.warn = (message: string): void => {
			if (message.includes("@firebase/firestore")) {
				return;
			}
			originalWarn(message);
		};
	}

	const app = initializeApp({
		apiKey: process.env.FIREBASE_API_KEY || "fake-api-key-for-emulator",
		authDomain: process.env.FIREBASE_AUTH_DOMAIN || "localhost",
		projectId: process.env.GCLOUD_PROJECT || "osvoice-dev",
		storageBucket:
			process.env.FIREBASE_STORAGE_BUCKET || "osvoice-dev.firebasestorage.app",
		messagingSenderId:
			process.env.FIREBASE_MESSAGING_SENDER_ID || "000000000000",
		appId: process.env.FIREBASE_APP_ID || "1:000000000000:web:0000000000000000",
		measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
	});
	initializeFirestore(getApp(), { ignoreUndefinedProperties: true });

	const auth = getAuth(app);
	connectAuthEmulator(auth, getClientFirebaseAuthEmulatorUrl(), {
		disableWarnings: !getShowWarnings(),
	});

	const firestore = getFirestore(app);
	const firestoreParts = getClientFirestoreHost().split(":");
	connectFirestoreEmulator(
		firestore,
		firestoreParts[0] ?? "",
		parseInt(firestoreParts[1] ?? ""),
	);

	const functions = getFunctions(app);
	const functionsParts = getClientFunctionsHost().split(":");
	connectFunctionsEmulator(
		functions,
		functionsParts[0] ?? "",
		parseInt(functionsParts[1] ?? ""),
	);

	const storage = getStorage(app);
	const storageParts = getClientStorageHost().split(":");
	connectStorageEmulator(
		storage,
		storageParts[0] ?? "",
		parseInt(storageParts[1] ?? ""),
	);

	const rtdb = getDatabase(app);
	const rtdbParts = getRealtimeDatabaseEmulatorHost().split(":");
	connectDatabaseEmulator(
		rtdb,
		rtdbParts[0] ?? "",
		parseInt(rtdbParts[1] ?? ""),
	);

	firebaseInitialized = true;
}

export async function closeFirebase() {
	if (!firebaseInitialized) {
		return;
	}
	await admin.firestore().terminate();
	await admin.app().delete();
	await terminate(getFirestore());
	firebaseInitialized = false;
}

export type UserCreds = {
	id: string;
	email: string;
	password: string;
};

export async function createUserCreds(opts?: {
	email?: string;
	firstName?: string;
	lastName?: string;
}): Promise<UserCreds> {
	const email = opts?.email ?? `test-${nanoid().toLowerCase()}@example.com`;
	const password = "password";

	const auth = getAuth();
	const user = await createUserWithEmailAndPassword(auth, email, password);

	return {
		id: user.user.uid,
		email,
		password,
	};
}

export async function signInWithCreds(creds: UserCreds) {
	const auth = getAuth();
	await signInWithEmailAndPassword(auth, creds.email, creds.password);
	if (!auth.currentUser) {
		throw new Error("User not signed in");
	}

	return auth.currentUser;
}

export async function markUserAsSubscribed() {
	const auth = getAuth();
	const user = auth.currentUser;
	if (!user) {
		throw new Error("no user signed in");
	}

	await admin.auth().setCustomUserClaims(user.uid, {
		subscribed: true,
	});

	await user.getIdToken(true);
}

export async function signOutUser() {
	const auth = getAuth();
	await signOut(auth);
}

export async function callFunctionHttp<I, O>(
	name: string,
	data: I,
): Promise<O> {
	const url = `${getFirebaseFunctionsEndpoint()}/${name}`;
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error(await res.text());
	}

	return res.json();
}

export const deleteMyUser = async () => {
	const auth = getAuth();
	const user = auth.currentUser;
	if (user) {
		await user.delete();
	}
};
