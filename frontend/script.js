import {getFCMToken} from "./firebase.js";

const API_BASE = "https://attendanceportal.duckdns.org";
const Permissions = {
    HR: ['VIEW_ATTENDANCE', 'ALL_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'GET_ID', 'GET_LIST', 'LIST_PENDING_REQ', 'LIST_LEAVES', 'LEAVE_STATUS'],
    MANAGER: ['VIEW_ATTENDANCE', 'ALL_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'GET_LIST', 'LEAVE_STATUS'],
    EMPLOYEE: ['VIEW_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'USER_GET', 'LEAVE']
};

let verifiedEmail = null;
let deviceToken = null;

function decodeRole(token){
    try{
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role?.toUpperCase();
    } catch{
        return null;
    }
}

function applyPermissions(){
    const token = localStorage.getItem('token');
    const role = decodeRole(token);
    const allowed =Permissions[role] || [];

    document.querySelectorAll('[data-permission]').forEach((el) => {
        el.hidden = !allowed.includes(el.dataset.permission);
    });
}

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

        if(response.ok && data.token){
            localStorage.setItem('token', data.token);
            console.log("Logged in, token saved");
            alert("Login Successful.");

            document.getElementById("loginForm").hidden = true;
            document.getElementById("afterLogin").hidden = false;
            applyPermissions();
        } else{
            alert(data.message || "Login failed.");
        }
    } catch(error){
        alert("ERROR: "+error.message);
        console.log(error);
    }
};

window.showAttendance = async function(){
    document.getElementById("afterLogin").hidden = true;
    document.getElementById("attendanceSection").hidden = false;
};
window.showLeave = async function(){
    document.getElementById("afterLogin").hidden = true;
    document.getElementById("leaveSection").hidden = false;
};

window.showTokenSection = function(){
    document.getElementById("afterLogin").hidden = true;
    document.getElementById("tokenSection").hidden = false;
};

//ATTENDANCE

window.userViewToday = async function(){
    try {
        const response = await fetch(`${API_BASE}/attendance/user-view-today`,{
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();

        if(response.ok){
            let display = data.message;
            if(data.hours !== undefined){
                display += `\nHours worked: ${data.hours}`;
            }
            document.getElementById("todayResult").textContent = display;
        } else{
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
        console.log(error);
    }
};

window.checkIn = async function(){
    try {
        const response = await fetch(`${API_BASE}/attendance/check-in`,{
            method: "POST",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();
        if(response.ok){
            let display = data.message;
            document.getElementById("checkInResult").textContent = display;   
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.checkOut = async function(){
    try{
        const response = await fetch(`${API_BASE}/attendance/check-out`,{
            method: "POST",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();

        if(response.ok){
            let display = data.message;
            if(data.hours !== undefined){
                display += `\nHours worked: ${data.hours}`;
            }
            document.getElementById("checkOutResult").textContent = display;
        }     
        else{
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.getUserAttendanceRange = async function(){

    const from = document.getElementById("from-date").value;
    const to = document.getElementById("to-date").value;

    try{
        const response = await fetch(`${API_BASE}/attendance/user-from-to?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();

        if(response.ok){
            let display = data.message;
            if(data.data !== undefined){
                display += `\nRecords: \n${JSON.stringify(data.data, null, 2)}`;
            }
            document.getElementById("attendanceRangeResult").textContent = display;
        }
        else{
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.attendanceByMonth = async function(){
    const month = document.getElementById("get-month").value;
    const year = document.getElementById("get-year").value;

    if (month < 1 || month > 12) {
        alert("Please enter a month between 1 and 12.");
        return;
    }
    if(year < 1000 || year > 9999){
        alert("Please enter a valid year.");
        return;
    }

    try{
        const response = await fetch(`${API_BASE}/attendance/user-month?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();

        if(response.ok){
            if(data.month){
                document.getElementById("attendanceMonthResult").textContent = `Month: ${data.month}, Year: ${data.year}\n\n${JSON.stringify(data.records, null, 2)}`;
            } else{
                document.getElementById("attendanceMonthResult").textContent = data.message;
            }
        }  else {
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
}

window.listToday = async function(){
    try{
        const response = await fetch(`${API_BASE}/attendance/list-today`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();

        if(response.ok){
            document.getElementById("listTodayResult").textContent = JSON.stringify(data, null, 2);
        } else {
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.getAttendanceRange = async function(){

    const from = document.getElementById("list-from-date").value;
    const to = document.getElementById("list-to-date").value;

    try{
        const response = await fetch(`${API_BASE}/attendance/list-from-to?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();

        if(response.ok){
            let display = data.message;
            if(data.data !== undefined){
                display += `\nRecords: \n${JSON.stringify(data.data, null, 2)}`;
            }
            document.getElementById("getListResult").textContent = display;
        }
        else{
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.listByMonth = async function(){
    const month = document.getElementById("list-month").value;
    const year = document.getElementById("list-year").value;

    if (month < 1 || month > 12) {
        alert("Please enter a month between 1 and 12.");
        return;
    }
    if(year < 1000 || month > 9999){
        alert("Please enter a valid year.");
        return;
    }

    try{
        const response = await fetch(`${API_BASE}/attendance/list-month?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();

        if(response.ok){
            if(data.month){
                document.getElementById("getMonthListResult").textContent = `Month: ${data.month}, Year: ${data.year}\n\n${JSON.stringify(data.records, null, 2)}`;
            } else{
                document.getElementById("getMonthListResult").textContent = data.message;
            }
        } 
        else {
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.getUserAttendance = async function(){
    const userId = document.getElementById("user-by-id").value;

    try{
        const response = await fetch(`${API_BASE}/attendance/${encodeURIComponent(userId)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await response.json();
        const payload = data?.records ?? data?.data ?? data;
        const display = payload !== undefined
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("userAttendanceResult").textContent = display;
        } else {
            alert(data.message || 'Request failed.');
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};





// LEAVE
window.postLeave = async function(){
    const start = document.getElementById("start-leave").value;
    const end = document.getElementById("end-leave").value;
    const type = document.getElementById("leave-type").value;
    const reason = document.getElementById("leave-reason").value;
    const normalizedType = type ? type.toLowerCase() : '';

    try{
        const response = await fetch(`${API_BASE}/leave`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({start, end, leaveType: normalizedType, reason})
        });

        const data = await response.json();

        if(response.ok){
            alert(data.message);
        }
        else{
            alert(data.message);
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.leaveHistory = async function(){
    const token = localStorage.getItem('token');
    if(!token){
        alert("Token Not Found!");
        return;
    }

    try{
        const response = await fetch(`${API_BASE}/leave`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();
        const payload = data?.data ?? data;
        const display = payload !== undefined
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("leaveHistoryResult").textContent = display;
        } else{
            alert(data.message || 'Request failed.');
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.pendingLeaves = async function(){
    try{
        const response = await fetch(`${API_BASE}/leave/list-pending`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const data = await response.json();
        const payload = data?.data ?? data;
        const display = payload !== undefined
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("pendingLeavesResult").textContent = display;
        }
        else{
            alert(data.message || 'Request Failed.');
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.leavesById = async function(){
    const id = document.getElementById("leaves-by-id").value;
    try{
        const response = await fetch(`${API_BASE}/leave/${encodeURIComponent(id)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const data = await response.json();
        const payload = data?.data ?? data;
        const display = payload !== undefined
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("leavesByIdResult").textContent = display;
        }
        else{
            alert(data.message || 'Request Failed.');
        }
    } catch(error){
        alert("ERROR: " + error.message);
    }
};

window.approveLeave = async function(){};

window.rejectLeave = async function(){};





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
        alert("Test notification sent.");
    } catch(error){
        console.error(error);
        alert("ERROR: " + error.message);
    }
};