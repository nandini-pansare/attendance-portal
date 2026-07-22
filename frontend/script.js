import {getFCMToken} from "./firebase.js";

const API_BASE = "https://attendanceportal.duckdns.org";

let verifiedEmail = null;
let deviceToken = null;

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


    if(!code){
        alert("Please select a role.");
        return;
    }
    
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

        const data = await response.json();
        console.log("Login response", data);
        alert("Login Successful.");

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

window.getTokenFromFirebase = async function (){
    try {
        deviceToken = await getFCMToken();
        console.log("FCM Token:", deviceToken);
        if(deviceToken){
            alert("Token generated. You can now register this device.");
        } 
    } catch (error){
        console.error("Could not initialize Firebase messaging:", error);
        alert("Notifications could not be initialized: " + error.message);
    }
};

window.registerToken = async function(){
    
    if(!deviceToken){
        alert("Get FCM Token first.");
        return;
    }

    const authToken = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE}/notifications/register`,{
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify({token: deviceToken})
        });

        const data = await response.json();
        console.log("Token registered: ", data);
        alert(data.message || "Device registered.");
    } catch (error) {
        alert("ERROR: "+ error.message);
        console.log(error);
    }
};

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
        alert(data.message || "Test notification sent.");
    } catch(error){
        console.error(error);
        alert("ERROR: " + error.message);
    }
};