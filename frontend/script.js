const API_BASE = "https://attendanceportal.duckdns.org";

async function getFirebaseToken() {
    // Firebase is optional for login. Loading it on demand prevents an FCM
    // loading failure from stopping this entire module on a phone.
    const { getFCMToken } = await import("./firebase.js");
    return getFCMToken();
}

window.testNotification = async function (){
    const response = await fetch(
        `${API_BASE}/notifications/test`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
                //"ngrok-skip-browser-warning": "1",
            }
        }
    );

    const data = await response.json();
    console.log(data);
};

window.getTokenFromFirebase = async function (){
    try {
        const token = await getFirebaseToken();
        console.log("FCM Token:", token);
    } catch (error) {
        console.error("Could not initialize Firebase messaging:", error);
        alert("Notifications could not be initialized: " + error.message);
    }
};

window.registerToken = async function(){
    let token;

    try {
        token = await getFirebaseToken();
    } catch (error) {
        console.error("Could not initialize Firebase messaging:", error);
        alert("Notifications could not be initialized: " + error.message);
        return;
    }

    if(!token){
        console.log("No token generated");
        return;
    }

    const response = await fetch(`${API_BASE}/notifications/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
                //"ngrok-skip-browser-warning": "1",
            },
            credentials: "include",
            body: JSON.stringify({
                token: token
            })
        }
    );

    const data = await response.json();
    console.log("Token registered:", data);
};

window.login = async function(){
    alert("Login Clicked");
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log("Username:", username);
    try {
        const response = await fetch(`${API_BASE}/auth/portal-login`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Content-Type": "application/json",
                //"ngrok-skip-browser-warning": "1",
            },
            body: JSON.stringify({ username, password}),
        });

        alert ("Response recieved: " + response.status);

        const data = await response.json();
        console.log("Login response", data);

        if(data.token){
            localStorage.setItem('token', data.token);
            console.log("Logged in, token saved");
        }
    } catch(error){
        alert("ERROR: "+error.message);
        console.log(error);
    }
};

alert("login exists: "+ typeof window.login);
