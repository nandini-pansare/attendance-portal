const API_BASE = "https://attendanceportal.duckdns.org";
let verifiedEmail = null;

window.getOtp = async function(){
    const email = document.getElementById("email-id").value;

    const response = await fetch(`${API_BASE}/otp/portal-get-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email})
    });

    const data = await response.json();

    if(response.ok){
        verifiedEmail = email;
        document.getElementById("reg-email").value = email;

        alert("Otp Sent.");

        document.getElementById("otpSection").hidden = true;
        document.getElementById("registrationForm").hidden = false;
    } else{
        alert(data.message);
    }
};

window.showLogin = function(){
    document.getElementById("otpSection").hidden = true;
    document.getElementById("registrationForm").hidden = true;
    document.getElementById("loginForm").hidden = false;
};

window.register = async function(){
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const email = document.getElementById("reg-email").value;
    const code = Number(document.getElementById("code").value);
    const otp = Number(document.getElementById("otp").value);

    try{
        const response = await fetch(`${API_BASE}/users/portal-register`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password, code, otp})
        });

        const data = await response.json();

        if(response.ok){
            alert(data.message || "Account created. Proceed to Log in");
            document.getElementById("registrationForm").hidden = true;
            document.getElementById("loginForm").hidden = false;
        } else{
            alert( data.message || "Registration failed!");
        }
    } catch(error){
        alert("Error: " + error.message);
        console.log(error);
    }
};


window.login = async function(){
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

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

        alert ("Login Successful " + response.status);

        const data = await response.json();
        console.log("Login response", data);

        if(data.token){
            localStorage.setItem('token', data.token);
            console.log("Logged in, token saved");

            document.getElementById("loginForm").hidden = true;
            document.getElementById("tokenSection").hidden = false;
        } else{
            alert(data.message || "Login failed.");
        }
    } catch(error){
        alert("ERROR: "+error.message);
        console.log(error);
    }
};

async function getFirebaseToken() {
    const { getFCMToken } = await import("./firebase.js");
    alert("Token Generated");
    return getFCMToken();
    
}

window.testNotification = async function (){
    const file = document.getElementById("notificationImage").files[0];
    const formData = new FormData();

    if(file){
        formData.append("image", file);
    }

    try{
        const response = await fetch(`${API_BASE}/notifications/test`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`,
                    //"ngrok-skip-browser-warning": "1",
                },
                body: formData,
            }
        );
        
        const data = await response.json();
        console.log(data);
    } catch(error){
        console.error(error);
        alert(error.message);
    }
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
    alert("Token Reistered");
    console.log("Token registered:", data);
};

