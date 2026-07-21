importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyD2HIL9AlZeRbPx9n-BVWbP1KIWgJygrEc",
  authDomain: "employee-attendance-port-7a0a4.firebaseapp.com",
  projectId: "employee-attendance-port-7a0a4",
  storageBucket: "employee-attendance-port-7a0a4.firebasestorage.app",
  messagingSenderId: "1084665761824",
  appId: "1:1084665761824:web:081fdbc1aa0b9af3d3ec45",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);
  const url = payload.data?.url || payload.fcmOptions?.link ||"/notification.html";
  
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    image: payload.notification.image,
    data: { url },
  });
});

self.addEventListener("notificationclick", (event)=> {
  event.notification.close();

  const url = event.notification.data?.url || `${self.location.origin}/notification.html`;

  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true})
.then(async (windowClients)=>{
  const existingClient = windowClients.find(
    (client)=> new URL(client.url).origin ===self.location.origin
  );

  if(existingClient){
    try {
      await existingClient.navigate(url);
      return existingClient.focus();
    } catch (err) {
      console.warn("Existing client navigation failed, opening new window:", err);
      return clients.openWindow(url);
    }
  }

  return clients.openWindow(url);
}).catch((error)=>{
  console.error("Could not open notification page:", error);
}));
});