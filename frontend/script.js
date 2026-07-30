import {getFCMToken} from "./firebase.js";

const API_BASE = "https://attendanceportal.duckdns.org";
const Permissions = {
    HR: ['VIEW_ATTENDANCE', 'ALL_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'GET_ID', 'GET_LIST', 'LIST_PENDING_REQ', 'LIST_LEAVES', 'LEAVE_STATUS'],
    MANAGER: ['VIEW_ATTENDANCE', 'ALL_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'GET_LIST', 'LEAVE_STATUS'],
    EMPLOYEE: ['VIEW_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'USER_GET', 'LEAVE']
};

let verifiedEmail = null;
let deviceToken = null;
let bannerTimeout;

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

function showBanner(message, type){
    const banner = document.getElementById("banner");
    banner.textContent = message;
    banner.className = type;
    banner.hidden = false;

    clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(()=>{
        banner.hidden = true;
    }, 3000);
}

async function safeJson(response){
    try{
        return await response.json();
    } catch(parseError){
        return null;
    }
}

window.getOtp = async function(){
    const btn = document.querySelector('#registrataionForm button[onclick="getOtp()]');
    const email = document.getElementById("reg-email").value;

    if(btn){
        btn.disabled = true;
        btn.textContent = "Sending...";
    }
    try{
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
            showBanner("Otp Sent.", "success");
        } else{
            showBanner(data.message, "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
        console.log(error);
    } finally{
        if(btn){
            btn.disabled = false;
            btn.textContent = "Get Otp";
        }
    }
};

window.showLogin = function(){
    document.getElementById("registrationForm").hidden = true;
    document.getElementById("loginForm").hidden = false;
};

window.register = async function(){
    const btn = document.querySelector('#registrationForm button[onclick="register()"]');
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const email = document.getElementById("reg-email").value;
    const code = Number(document.getElementById("code").value);
    const otp = Number(document.getElementById("otp").value);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!username || !password || !email || !code || !otp){
        showBanner(" Please enter all values", "error");
        return;
    }

    if(btn){
        btn.disabled = true;
        btn.textContent = "Registering";
    }
    
    try{
        const response = await fetch(`${API_BASE}/users/portal-register`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password, code, otp})
        });

        const data = await safeJson(response);

        if(response.ok){
            showBanner(data.message || "Registered successfully", "success");
            document.getElementById("registrationForm").hidden = true;
            document.getElementById("loginForm").hidden = false;
        } else{
            showBanner( data?.message || "Registration Failed.", "error");
        }
    } catch(error){
        showBanner("Error: " + error.message, "error");
        console.log(error);
    }
};

window.backButton = function(){
    document.getElementById("loginForm").hidden = true;
    document.getElementById("registrationForm").hidden = false;
}

window.login = async function(){
    const btn = document.querySelector('#loginForm button[onclick="login()"]');
    const username = document.getElementById('login-username').value.trin();
    const password = document.getElementById('login-password').value;

    if(!username || !password){
        showBanner("Please enter both username and password.", "error");
        return;
    }

    if(btn){
        btn.disabled = true;
        btn.textContent = "Logging in...";
    }

    try {
        const response = await fetch(`${API_BASE}/auth/portal-login`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password}),
        });

        const data = await safeJson(response);
        console.log("Login response", data);

        if(response.ok && data?.token){
            localStorage.setItem('token', data.token);
            console.log("Logged in, token saved");
            showBanner("Login Successful.", "success");

            document.getElementById("loginForm").hidden = true;
            document.getElementById("appLayout").hidden = false;
            applyPermissions();
            showAttendance();
        } else{
            showBanner(data?.message || "Login failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: "+error.message, "error");
        console.log(error);
    } finally{
        if(btn){
            btn.disabled = false;
            btn.textContent = "Login";
        }
    }
};

window.toggleSidebar = function(){
    document.getElementById("sidebar").classList.toggle("open");
}

window.showAttendance = async function(){
    document.getElementById("attendanceSection").hidden = false;
    document.getElementById("leaveSection").hidden = true;
    document.getElementById("tokenSection").hidden = true;
    document.getElementById("navAttendance").classList.add("active");
    document.getElementById("navLeave").classList.remove("active");
    document.getElementById("navTokenSection").classList.remove("active");
};
window.showLeave = async function(){
    document.getElementById("leaveSection").hidden = false;
    document.getElementById("attendanceSection").hidden = true;
    document.getElementById("tokenSection").hidden = true;
    document.getElementById("navAttendance").classList.remove("active");
    document.getElementById("navLeave").classList.add("active");
    document.getElementById("navTokenSection").classList.remove("active");
};

window.showTokenSection = function(){
    document.getElementById("attendanceSection").hidden = true;
    document.getElementById("leaveSection").hidden = true;
    document.getElementById("tokenSection").hidden = false;
    document.getElementById("navAttendance").classList.remove("active");
    document.getElementById("navLeave").classList.remove("active");
    document.getElementById("navTokenSection").classList.add("active");
};

//ATTENDANCE

window.userViewToday = async function(){
        document.getElementById("todayResult").textContent = "";
    try {
        const response = await fetch(`${API_BASE}/attendance/user-view-today`,{
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await safeJson(response);

        if(response.ok){
            let display = data?.message || '';
            if(data?.hours !== undefined){
                display += `\nHours worked: ${data.hours}`;
            }
            document.getElementById("todayResult").textContent = display;
        } else{
            showBanner(data?.message || "Request Failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
        console.log(error);
    }
};

window.checkIn = async function(){
    const btn = document.getElementById("checkInBtn");
    btn.disabled = true;
    btn.textContent = "Checking in...";        
    document.getElementById("checkInResult").textContent = "";

    try {
        const response = await fetch(`${API_BASE}/attendance/check-in`,{
            method: "POST",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await safeJson(response);
        if(response.ok){
            document.getElementById("checkInResult").textContent = data?.message || '';   
        } else{
            showBanner(data?.message || "Check-in failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "Check In";
    }
};

window.checkOut = async function(){
    const btn = document.getElementById("checkOutBtn");
    btn.disabled = true;
    btn.textContent = "Checking out...";
    document.getElementById("checkOutResult").textContent = "";

    try{
        const response = await fetch(`${API_BASE}/attendance/check-out`,{
            method: "POST",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await safeJson(response);

        if(response.ok){
            let display = data?.message || '';
            if(data.hours !== undefined){
                display += `\nHours worked: ${data.hours}`;
            }
            document.getElementById("checkOutResult").textContent = display;
        }     
        else{
            showBanner(data?.message || "Check-out failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "Check Out";
    }
};

window.getUserAttendanceRange = async function(){
    const btn = document.getElementById("getRangeBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    const from = document.getElementById("from-date").value;
    const to = document.getElementById("to-date").value;
    document.getElementById("attendanceRangeResult").textContent = "";

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
            let display = data?.message || '';
            if(data?.data !== undefined){
                display += `\nRecords: \n${JSON.stringify(data.data, null, 2)}`;
            }
            document.getElementById("attendanceRangeResult").textContent = display;
        }
        else{
            showBanner(data?.message || "Request failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View From and To";
    }
};

window.attendanceByMonth = async function(){
    const btn = document.getElementById("getMonthBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("attendanceMonthResult").textContent = "";
    const month = document.getElementById("get-month").value;
    const year = document.getElementById("get-year").value;

    if (month < 1 || month > 12) {
        showBanner("Please enter a month between 1 and 12.", "error");
        btn.disabled = false;
        btn.textContent = "View";
        return;
    }
    if(year < 1000 || year > 9999){
        showBanner("Please enter a valid year.", "error");
        btn.disabled = false;
        btn.textContent = "View";
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
            if(data?.month){
                document.getElementById("attendanceMonthResult").textContent = `Month: ${data.month}, Year: ${data.year}\n\n${JSON.stringify(data.records, null, 2)}`;
            } else{
                document.getElementById("attendanceMonthResult").textContent = data?.message || 'No data returned.';
            }
        }  else {
            showBanner(data?.message || "Request failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View";
    }
}

window.listToday = async function(){
    const btn = document.getElementById("listTodayBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("listTodayResult").textContent = "";
    try{
        const response = await fetch(`${API_BASE}/attendance/list-today`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await safeJson(response);

        if(response.ok){
            document.getElementById("listTodayResult").textContent = JSON.stringify(data, null, 2);
        } else {
            showBanner(data?.message || "Request failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View";
    }
};

window.getAttendanceRange = async function(){
    const btn = document.getElementById("listRangeBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("getResultResult").textContent = "";
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

        const data = await safeJson(response);

        if(response.ok){
            let display = data?.message || '';
            if(data?.data !== undefined){
                display += `\nRecords: \n${JSON.stringify(data.data, null, 2)}`;
            }
            document.getElementById("getListResult").textContent = display;
        }
        else{
            showBanner(data?.message || "Request failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View From and To";
    }
};

window.listByMonth = async function(){
    const btn = document.getElementById("listMonthBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("getMonthListResult").textContent = "";
    const month = document.getElementById("list-month").value;
    const year = document.getElementById("list-year").value;

    if (month < 1 || month > 12) {
        showBanner("Please enter a month between 1 and 12.", "error");
        btn.disabled = false;
        btn.textContent = "View";
        return;
    }
    if(year < 1000 || year > 9999){
        showBanner("Please enter a valid year.", "error");
        btn.disabled = false;
        btn.textContent = "View";
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

        const data = await safeJson(response);

        if(response.ok){
            if(data?.month){
                document.getElementById("getMonthListResult").textContent = `Month: ${data.month}, Year: ${data.year}\n\n${JSON.stringify(data.records, null, 2)}`;
            } else{
                document.getElementById("getMonthListResult").textContent = data?.message || 'No data returned';
            }
        } 
        else {
            showBanner(data?.message || "Request failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View";
    }
};

window.getUserAttendance = async function(){
    const btn = document.getElementById("userAttendanceBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("userATtendanceResult").textContent = "";
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

        const data = await safeJson(response);
        const payload = data?.records ?? data?.data ?? data;
        const display = payload !== undefined && payload !== null
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("userAttendanceResult").textContent = display;
        } else {
            showBanner(data?.message || 'Request failed.', "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View";
    }
};





// LEAVE
window.postLeave = async function(){
    const btn = document.getElementById("postLeaveBtn");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    const token = localStorage.getItem('token');
    if(!token){
        showBanner('Login required before submitting leave.', "error");
        btn.disabled = false;
        btn.textContent = "Submit";
        return;
    }

    const start = document.getElementById("start-leave").value;
    const end = document.getElementById("end-leave").value;
    const type = document.getElementById("leave-type").value;
    const reason = document.getElementById("leave-reason").value;
    const normalizedType = type ? type.toLowerCase() : '';
    const url = `${API_BASE}/leave`;
    const payload = { start, end, leaveType: normalizedType, reason };

    console.log('postLeave request', { url, payload, tokenPresent: !!token });

    try{
        const response = await fetch(url,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload)
        });

        const data = await safeJson(response);

        console.log('postLeave response', { status: response.status, statusText: response.statusText, body: data });

        if(response.ok){
            showBanner(data?.message || 'Leave request submitted.', "success");
        }
        else{
            showBanner(`${response.status}: ${data?.message || response.statusText}`, "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "Submit";
    }
};

window.leaveHistory = async function(){
    const btn = document.getElementById("leaveHistoryBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("leaveHistoryResult").textContent = "";
    const token = localStorage.getItem('token');
    if(!token){
        showBanner("Token Not Found!", "error");
        btn.disabled = false;
        btn.textContent = "View";
        return;
    }
    try{
        const response = await fetch(`${API_BASE}/leave`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await safeJson(response);
        const payload = data?.data ?? data;
        const display = payload !== undefined && payload !== null
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("leaveHistoryResult").textContent = display;
        } else{
            showBanner(data?.message || 'Request failed.', "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View";
    }
};

window.pendingLeaves = async function(){
    const btn = document.getElementById("pendingLeavesBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("pendingLeavesResult").textContent = "";
    try{
        const response = await fetch(`${API_BASE}/leave/list-pending`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const data = await safeJson(response);
        const payload = data?.data ?? data;
        const display = payload !== undefined && payload !== null
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("pendingLeavesResult").textContent = display;
        }
        else{
            showBanner(data?.message || 'Request Failed.', "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View";
    }
};

window.leavesById = async function(){
    const btn = document.getElementById("leavesByIdBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("leavesByIdResult").textContent = "";
    const id = document.getElementById("leaves-by-id").value;
    try{
        const response = await fetch(`${API_BASE}/leave/${encodeURIComponent(id)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const data = await safeJson(response);
        const payload = data?.data ?? data;
        const display = payload !== undefined && payload !== null
            ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
            : (data?.message || 'No data returned.');

        if(response.ok){
            document.getElementById("leavesByIdResult").textContent = display;
        }
        else{
            showBanner(data?.message || 'Request Failed.', "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "View";
    }
};

window.updateLeaveStatus = async function(status){
    const approveBtn = document.getElementById("approveLeaveBtn");
    const rejectBtn = document.getElementById("rejectLeaveBtn");
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    document.getElementById("updateLeaveStatusResult").textContent = "";
    const id = document.getElementById("update-leave-status").value;
    try{
        const response = await fetch(`${API_BASE}/leave/${encodeURIComponent(id)}/${encodeURIComponent(status)}`,
        {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const data = await safeJson(response);
        
        if(response.ok){
            document.getElementById("updateLeaveStatusResult").textContent = data?.message || 'Done';
        }
        else{
            showBanner(data?.message || 'Request Failed.', "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
    }
};






window.getTokenFromFirebase = async function (){
    const getTokenBtn = document.getElementById("getTokenBtn");
    const registerTokenBtn = document.getElementById("registerTokenBtn");
    const testNotificationBtn = document.getElementById("testNotificationBtn");

    getTokenBtn.disabled = true;
    registerTokenBtn.disabled = true;
    testNotificationBtn.disabled = true;
    try {
        deviceToken = await getFCMToken();
        console.log("FCM Token:", deviceToken);
        if(deviceToken){
            showBanner("Token generated. You can now register this device.", "success");
        } 
    } catch (error){
        console.error("Could not initialize Firebase messaging:", error);
        showBanner("Notifications could not be initialized: " + error.message, "error");
    } finally{
        getTokenBtn.disabled = false;
        registerTokenBtn.disabled = false;
        testNotificationBtn.disabled = false;
    }
};

window.registerToken = async function(){
    
    if(!deviceToken){
        showBanner("Get FCM Token first.", "error");
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

        const data = await safeJson(response);
        console.log("Token registered: ", data);
        showBanner(data?.message || "Device registered.", "success");
    } catch (error) {
        showBanner("ERROR: "+ error.message, "error");
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
        
        const data = await safeJson(response);
        console.log(data);
        if(response.ok){
            showBanner("Test notification sent.", "success");
        } else{
            showBanner(data?.message || "Could not send test notifcation.", "error");
        }
    } catch(error){
        console.error(error);
        showBanner("ERROR: " + error.message, "error");
    }
};

window.logout = async function(){
    const btn = document.getElementById("logoutBtn");
    btn.disabled = true;
    btn.textContent = "Logging Out...";
    try{
        const response = await fetch(`${API_BASE}/auth/portal-logout`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
        });
        const data = await safeJson(response);
        console.log(data);
        if(response.ok){
            showBanner(data.message, "success");
            localStorage.removeItem('token');
            document.getElementById("appLayout").hidden = true;
            document.getElementById("loginForm").hidden = false;
            document.getElementById("login-username").value = ""
            document.getElementById("login-password").value = "";
            document.querySelectorAll('pre').forEach((el)=> {
                el.textContent = '';
            });
            document.querySelectorAll('#appLayout input').forEach((el)=>{
                el.value = '';
            });
        }
        else{
            showBanner(data.message, "error");
        }
    } catch(error){
        console.error(error);
        showBanner("ERROR " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "Logout";
    }
};