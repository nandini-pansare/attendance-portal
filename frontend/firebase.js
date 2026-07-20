import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getMessaging, getToken, isSupported, onMessage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2HIL9AlZeRbPx9n-BVWbP1KIWgJygrEc",
  authDomain: "employee-attendance-port-7a0a4.firebaseapp.com",
  projectId: "employee-attendance-port-7a0a4",
  storageBucket: "employee-attendance-port-7a0a4.firebasestorage.app",
  messagingSenderId: "1084665761824",
  appId: "1:1084665761824:web:081fdbc1aa0b9af3d3ec45",
  measurementId: "G-S8B5NV873Q"
};

const app = initializeApp(firebaseConfig);
let messaging;
let listnerAttached = false;

export async function getFCMToken() {
    if (!window.isSecureContext) {
        throw new Error(
            "FCM notifications require HTTPS. A phone cannot use notifications from an http:// LAN address."
        );
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        throw new Error("This browser does not support web notifications or service workers.");
    }

    if (!(await isSupported())) {
        throw new Error("Firebase Cloud Messaging is not supported by this browser.");
    }
 
    const permission = await Notification.requestPermission();

    if(permission !== "granted"){
        console.log("Notification permission denied");
        return null;
    }

    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const registration = await navigator.serviceWorker.ready;

    if(!messaging){
        messaging = getMessaging(app);
    }

    if (!listnerAttached) { 
        onMessage(messaging, async (payload) => {
            console.log("Foreground message received:", payload);
            const title = payload.notification?.title ?? "Attendance Portal";
            const body = payload.notification?.body ?? "";
            const url = payload.data?.url || payload.fcmOptions?.link || "/notification.html";
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body, 
                image: payload.notification?.image,
                data: {url},
            });
        });

        listnerAttached = true;
    }

    const token = await getToken(messaging, {
        vapidKey: "BI06UJMT-Il2jTyGTojfWEFiUy3109qh6SUpMet1TvuP4snnVDjYZU_huoK5Vsedka-j1edm1viKePtLIpmi21o",
        serviceWorkerRegistration: registration,
    });

    return token;
}
