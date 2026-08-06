import {getFCMToken} from "./firebase.js";

const API_BASE = "https://attendanceportal.duckdns.org";
const Permissions = {
    HR: ['VIEW_ATTENDANCE', 'ALL_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'GET_ID', 'GET_LIST', 'LIST_PENDING_REQ', 'LIST_LEAVES', 'LEAVE_STATUS'],
    MANAGER: ['VIEW_ATTENDANCE', 'ALL_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'GET_LIST', 'LEAVE_STATUS', 'LIST_PENDING_REQ'],
    EMPLOYEE: ['VIEW_ATTENDANCE', 'CHECK_IN', 'CHECK_OUT', 'USER_GET', 'LEAVE']
};

let verifiedEmail = null;
let deviceToken = null;
let bannerTimeout;

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
        const parsed = await response.json();

        const message = parsed?.message ? String(parsed.message).toLowerCase() : '';

        if(response.status === 401 || message.includes('jwt malformed') || message.includes('jwt expired') || message.includes('invalid token')){
            // Clear stored token and return to login view
            try{
                localStorage.removeItem('token');
                showBanner(parsed?.message || 'Session expired. Redirecting to login.', 'error');
                document.getElementById('appLayout').hidden = true;
                document.getElementById('loginForm').hidden = false;
                const userEl = document.getElementById('login-username');
                const passEl = document.getElementById('login-password');
                if(userEl) userEl.value = '';
                if(passEl) passEl.value = '';
            } catch (e) {
                // ignore UI errors
            }
        }

        return parsed;
    } catch(parseError){
        return null;
    }
}

window.getOtp = async function(){
    const btn = document.querySelector('#registrationForm button[onclick="getOtp()"]');
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

        const data = await safeJson(response);
        if(response.ok){
            verifiedEmail = email;
            showBanner(data?.message || "Otp Sent.", "success");
        } else{
            showBanner(data?.message || "Could not send OTP", "error");
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

    if(!username){
        showBanner("Please enter a username.", "error");
        return;
    } 
    if(!password){
        showBanner("Pleaser enter a password.", "error");
        return;
    } 
    if(!emailPattern.test(email)){
        showBanner("Please enter a valid email address.", "error");
        return;
    } 
    if(!code){
        showBanner("Please select a role", "error");
        return;
    }  
    if(!otp){
        showBanner(" Please enter otp", "error");
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
            showBanner(data?.message || "Registered successfully", "success");
            document.getElementById("registrationForm").hidden = true;
            document.getElementById("loginForm").hidden = false;
        } else{
            showBanner( data?.message || "Registration Failed.", "error");
        }
    } catch(error){
        showBanner("Error: " + error.message, "error");
        console.log(error);
    } finally{
        if(btn){
            btn.disabled = false;
            btn.textContent = "Register";
        }
        resetAllInputs();
    }
};

window.backButton = function(){
    document.getElementById("loginForm").hidden = true;
    document.getElementById("registrationForm").hidden = false;

    // Ensure the register button isn't left disabled/stuck if user navigates back
    const regBtn = document.querySelector('#registrationForm button[onclick="register()"]');
    if(regBtn){
        regBtn.disabled = false;
        regBtn.textContent = "Register";
    }
}

window.backToLogin = function(){
    document.getElementById("forgotPasswordForm").hidden = true;
    document.getElementById("loginForm").hidden = false;
    const loginBtn = document.querySelector('#loginForm button[onlick="login()"]');
    if(loginBtn){
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }
}

window.login = async function(){
    console.log('login clicked');
    const btn = document.querySelector('#loginForm button[onclick="login()"]');
    const username = document.getElementById('login-username').value.trim();
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

            resetAllInputs();
            document.getElementById("loginForm").hidden = true;
            document.getElementById("appLayout").hidden = false;
            applyPermissions();
            showDashboard();
            loadDashboard();
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

window.toggleGroup = function (groupId){
    const group = document.getElementById(groupId);
    const toggle = event.target;
    const isOpening = !group.classList.contains('open');

    document.querySelectorAll('.nav-submenu').forEach(menu => {
        if(menu !== group){
            menu.classList.remove('open');
        }
    });

    document.querySelectorAll('.nav-toggle').forEach(btn => {
        if(btn !== toggle){
            btn.classList.remove('group-active');
        }
    });

    group.classList.toggle('open');
    toggle.classList.toggle('group-active', isOpening);
};

window.toggleSidebar = function(){
    document.getElementById("sidebar").classList.toggle("open");
}

let resetEmail = null;

window.showForgotPassword = async function(){
    document.getElementById("loginForm").hidden = true;
    document.getElementById("forgotPasswordForm").hidden = false;
};

window.forgotPassword = async function(){
    const email = document.getElementById('forgot-email').value;
    if(!email){
        showBanner("Please enter email.", "error");
        return;
    }

    const btn = document.querySelector('#forgotBtn');
    if(btn){
        btn.disabled = true;
        btn.textContent = "Sending...";
    }

    try{
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({email}),
        });

        const data = await safeJson(response);

        if(response.ok && data?.success){
            resetEmail = email;
            showBanner("OTP sent successfully. Please check your email.", "success");
            document.getElementById("forgotPasswordForm").hidden = true;
            document.getElementById("forgotOtpForm").hidden = false;
        } else {
            showBanner("Error in generation or sending of otp. Please try again.", "error");
        }
    } catch(error){
        showBanner("ERROR: "+error.message, "error");
        console.log(error);
    } finally{
        if(btn){
            btn.disabled = false;
            btn.textContent = "Send Otp";
        }
    }
};

window.forgotVerify = async function(){
    const otp = document.getElementById("forgot-otp").value;
    const email = resetEmail;
    if(!email){
        showBanner("Please try again.", "error");
        return;
    }
    try{
        const response = await fetch(`${API_BASE}/otp/verify-otp`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({email, otp}),
        });

        const data = await safeJson(response);
        if(response.ok && data?.success){
            showBanner("OTP Verified.", "success");
            document.getElementById("forgotOtpForm").hidden = true;
            document.getElementById("resetPassword").hidden = false;
        } else{
            showBanner("Invalid or expired OTP.", "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    }
};

window.resetPassword = async function(){
    const btn = document.querySelector('#resetPassword button[onclick="resetPassword()"]');
    if(btn){
        btn.disabled = true;
        btn.textContent = "Processing...";
    }
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if(newPassword !== confirmPassword){
        showBanner("Negative Match! Please enter the same password again to confirm.", "error");
        if(btn){
            btn.disabled = false;
            btn.textContent = "Reset Password";
        }
        return;
    }

    const confirmed = window.confirm('Are you sure you want to change your password?');
    if(!confirmed){
        if(btn){
            btn.disabled = false;
            btn.textContent = "Reset Password";
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: "POST",
            credentials: "include",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({newPassword, resetEmail}),
        });

        const data = await safeJson(response);

        if(response.ok){
            showBanner(data?.message, "success");
        } else{
            showBanner(data?.message || "Reset failed.", "error");
        }
    } catch(error){
        showBanner("ERROR: "+error.message, "error");
        console.log(error);
    } finally{
        if(btn){
            btn.disabled = false;
            btn.textContent = "Reset Password";
        }
    }
};

window.showDashboard = function(){
    document.getElementById("dashboardSection").hidden = false;
    document.getElementById("attendanceSection").hidden = true;
    document.getElementById("leaveSection").hidden = true;
    document.getElementById("tokenSection").hidden = true;
    loadDashboard();
    startClock();
    setActiveLink(event?.target, null);
}

window.showAttendance = async function(){
    stopClock();
    document.getElementById("attendanceSection").hidden = false;
    document.getElementById("leaveSection").hidden = true;
    document.getElementById("tokenSection").hidden = true;
    document.getElementById("dashboardSection").hidden = true;
    document.getElementById("attendanceToggle")?.classList.add("group-active");
    document.getElementById("leaveToggle")?.classList.remove("group-active");
    document.getElementById("navTokenSection")?.classList.remove("group-active");
};
window.showLeave = async function(){
    stopClock();
    document.getElementById("dashboardSection").hidden = true;
    document.getElementById("leaveSection").hidden = false;
    document.getElementById("attendanceSection").hidden = true;
    document.getElementById("tokenSection").hidden = true;
    document.getElementById("attendanceToggle")?.classList.remove("group-active");
    document.getElementById("leaveToggle")?.classList.add("group-active");
    document.getElementById("navTokenSection")?.classList.remove("group-active");
};

window.showTokenSection = function(){
    stopClock();
    document.getElementById("dashboardSection").hidden = true;
    document.getElementById("attendanceSection").hidden = true;
    document.getElementById("leaveSection").hidden = true;
    document.getElementById("tokenSection").hidden = false;
    document.getElementById("attendanceToggle")?.classList.remove("group-active");
    document.getElementById("leaveToggle")?.classList.remove("group-active");
    document.getElementById("navTokenSection")?.classList.add("group-active");
    setActiveLink(event?.target, null);
};

window.showProfile = function(){
    const token = localStorage.getItem('token');
    const payload = decodeToken(token);

    document.getElementById("profileUserId").textContent = payload?.userId ?? payload?.id ?? '--';
    document.getElementById("profileUsername").textContent = payload?.username || '--';
    document.getElementById("profileEmail").textContent = payload?.email || '--';
    document.getElementById("profileRole").textContent = payload?.role?.toUpperCase() || '--';

    document.getElementById("profileModal").hidden = false;
};

window.closeProfile = function(){
    document.getElementById("profileModal").hidden = true;
};

let clockInterval;

function startClock(){
    const clockE1 = document.getElementById("liveClock");
    const dateE1 = document.getElementById("liveDate");
    if(!clockE1) return;

    clearInterval(clockInterval);
    const tick = () => {
        const now = new Date();

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockE1.textContent = `${hours}:${minutes}`;

        if(dateE1){
            dateE1.textContent = now.toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
    };
    tick();
    clockInterval = setInterval(tick, 1000);
}

function stopClock(){
    clearInterval(clockInterval);
}

function setActiveLink(clickedLink, groupToggleId){
    document.querySelectorAll('#sidebar a').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.nav-toggle').forEach(toggle => toggle.classList.remove('group-active'));

    if(clickedLink){
        clickedLink.classList.add('active');
    }
    if(groupToggleId){
        document.getElementById(groupToggleId)?.classList.add('group-active');
    }
}

window.showAttendanceView = function(view){
    showAttendance();
    document.querySelectorAll('#attendanceSection .field-card').forEach(card =>{
        card.hidden = (card.dataset.view !== view);
    });
    setActiveLink(event.target, 'attendanceToggle');

    if(view === 'view-today'){
        userViewToday();
    }
};

window.showLeaveView = function(view){
    showLeave();
    document.querySelectorAll('#leaveSection .field-card').forEach(card => {
        card.hidden = (card.dataset.view !== view);
    });
    setActiveLink(event.target, 'leaveToggle');
};

window.loadDashboard = async function(){
    const token = localStorage.getItem('token');
    const role = decodeRole(token);
    const allowed = Permissions[role] || [];

    document.getElementById("dashRole").textContent = role || '--';
    document.getElementById("dashStatus").textContent = "Loading...";
    document.getElementById("dashHours").textContent = "--";
    document.getElementById("dashLeaves").textContent = "--";

    try{
        const response = await fetch(`${API_BASE}/attendance/user-view-today`, {
            method: "GET",
            credentials: "include",
            headers: { "Authorization": `Bearer ${token}`}
        });
        const data = await safeJson(response);
        if(response.ok){
            document.getElementById("dashStatus").textContent = data?.message || 'Not Record Yet.';
            document.getElementById("dashHours").textContent = data?.hours !== undefined && data.hours !== null
                ? Number(data.hours).toFixed(2)
                : '--';
        } else{
            document.getElementById("dashStatus").textContent = 'Unavailable';
        } 
    } catch(error){
            document.getElementById("dashStatus").textContent = 'Error';
            console.log(error);
    }

    const pendingUrl = allowed.includes('LIST_PENDING_REQ')
    ? `${API_BASE}/leave/list-pending`
    : `${API_BASE}/leave`;

    try{
        const response = await fetch(pendingUrl, {
            method: "GET",
            credentials: "include",
            headers: {"Authorization": `Bearer ${token}`}
        });

        const data = await safeJson(response);
        if(response.ok){
            const records = Array.isArray(data?.records)
                ? data.records
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                        ? data
                        : [];
            const pendingCount = allowed.includes('LIST_PENDING_REQ')
                ? records.length
                : records.filter(r => (r?.status || '').toLowerCase() === 'pending').length;
            document.getElementById("dashLeaves").textContent = pendingCount;
        } else{
            document.getElementById("dashLeaves").textContent = 'None Pending';
        }
    } catch(error){
        document.getElementById("dashLeaves").textContent = '--';
        console.log(error);
    }
};

//ATTENDANCE

function formatTime(dateStr){
    if(!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderAttendanceTable(records, tbodyId, tableId, noteId, emptyMessage){
    const tbody = document.getElementById(tbodyId);
    const table = document.getElementById(tableId);
    const note = document.getElementById(noteId);

    if(!tbody || !table || !note){
        console.error('Attendance table render failed: missing elements', {tbodyId, tableId, noteId, tbody, table, note});
        showBanner('Unable to display attendance records. Please refresh the page.', 'error');
        return;
    }

    tbody.innerHTML = '';

    if(!records || records.length === 0){
        table.hidden = true;
        note.textContent = emptyMessage;
        return;
    }

    records.forEach(record =>{
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${record.date || '--'}</td>
        <td>${formatTime(record.checkIn)}</td>
        <td>${formatTime(record.checkOut)}</td>
        <td>${record.hours !== null && record.hours !== undefined ? Number(record.hours).toFixed(2) : '--'}</td>
        `;
        tbody.appendChild(row);
    });

    table.hidden = false;
    note.textContent = '';
}

function renderAttendanceTableWithUser(records, tbodyId, tableId, noteId, emptyMessage){
    const tbody = document.getElementById(tbodyId);
    const table = document.getElementById(tableId);
    const note = document.getElementById(noteId);

    if(!tbody || !table || !note){
        console.error('Attendance table render failed: missing elements', {tbodyId, tableId, noteId, tbody, table, note});
        showBanner('Unable to display attendance records. Please refresh the page,', 'error');
        return;
    }

    tbody.innerHTML = '';

    if(!records || records.length === 0){
        table.hidden = true;
        note.textContent = emptyMessage;
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
            row.innerHTML = `
            <td>${record.userId ?? '--'}</td>
            <td>${record.date || '--'}</td>
            <td>${formatTime(record.checkIn)}</td>
            <td>${formatTime(record.checkOut)}</td>
            <td>${record.hours !== null && record.hours !== undefined ? Number(record.hours).toFixed(2) : '--'}</td>
            `;
            tbody.appendChild(row);
        }
    );

    table.hidden = false;
    note.textContent = '';
}

window.userViewToday = async function(){
    document.getElementById("todayCheckIn").textContent = '--';
    document.getElementById("todayCheckOut").textContent = '--';
    document.getElementById("todayHours").textContent = '--';
    document.getElementById("todayStatusNote").textContent = 'Loading...'

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
            document.getElementById("todayCheckIn").textContent = formatTime(data?.checkIn);
            document.getElementById("todayCheckOut").textContent = formatTime(data?.checkOut);
            document.getElementById("todayHours").textContent = data?.hours !== null && data?.hours !== undefined
                ? data.hours.toFixed(2)
                : '--';
            document.getElementById("todayStatusNote").textContent = data?.message || '';
        } else{
            document.getElementById("todayStatusNote").textContent = '';
            showBanner(data?.message || "Request Failed.", "error");
        }
    } catch(error){
        document.getElementById("todayStatusNote").textContent = '';
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
            userViewToday();
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
            userViewToday();
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
    document.getElementById("attendanceRangeBody").innerHTML = "";
    document.getElementById("attendanceRangeTable").hidden = true;
    document.getElementById("attendanceRangeNote").textContent = "";
    
    
    const from = document.getElementById("from-date").value;
    const to = document.getElementById("to-date").value;
    
    if(!from || !to){
        showBanner("Please select both a from and to date", "error");
        btn.disabled = false;
        btn.textContent = "View From and To";
        return;
    }

    if(from>to){
        showBanner("The from date must be before the to date.", "error");
        btn.disabled = false;
        btn.textContent = "View From and To";
        return;
    }

    try{
        const response = await fetch(`${API_BASE}/attendance/user-from-to?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = await safeJson(response);

        if(response.ok){
            renderAttendanceTable(
                data?.data,
                'attendanceRangeBody',
                'attendanceRangeTable',
                'attendanceRangeNote',
                'No records found for this range.'
            );
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
    document.getElementById("attendanceMonthNote").textContent = "";
    document.getElementById("attendanceMonthTable").hidden = true;

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

        const data = await safeJson(response);

        if(response.ok){
            renderAttendanceTable(
                data?.records,
                'attendanceMonthBody',
                'attendanceMonthTable',
                'attendanceMonthNote',
                data?.message || 'No records found for this month.'
            );
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
    if(btn){
        btn.disabled = true;
        btn.textContent = "Fetching...";
    }
    document.getElementById("listTodayNote").textContent = "";
    document.getElementById("listTodayTable").hidden = true;

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
            renderAttendanceTableWithUser(
                data?.records,
                'listTodayBody',
                'listTodayTable',
                'listTodayNote',
                data?.message || 'No records found for today.'
            );
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
    document.getElementById("getListNote").textContent = "";
    document.getElementById("getListTable").hidden = true;
    
    const from = document.getElementById("list-from-date").value;
    const to = document.getElementById("list-to-date").value;

    if(!from || !to){
        showBanner("Please select both a from and a to date.", "error");
        btn.disabled = false;
        btn.textContent = "View From and To";
        return;
    }
    if(from > to){
        showBanner("The from date must be before the to date.", "error");
        btn.disabled = false;
        btn.textContent = "View From and To";
        return;
    }
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
            const records = data?.records ?? data?.data ?? [];
            renderAttendanceTableWithUser(
                records,
                'getListBody',
                'getListTable',
                'getListNote',
                data?.message || 'No records found for this range.'
            );
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
    document.getElementById("getMonthListNote").textContent = "";
    document.getElementById("getMonthListTable").hidden = true;
    
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
            const records = data?.records ?? data?.data ?? [];
            renderAttendanceTableWithUser(
                records,
                'getMonthListBody',
                'getMonthListTable',
                'getMonthListNote',
                data?.message || 'No records found for this month.'
            );
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
    document.getElementById("userAttendanceNote").textContent = "";
    document.getElementById("userAttendanceTable").hidden = true;
    const userId = document.getElementById("user-by-id").value;

    if(!userId){
        showBanner("Please enter a user ID.", "error");
        btn.disabled = false;
        btn.textContent = "View";
        return;
    }
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
        const results = data?.records ?? data?.data;
        const records = Array.isArray(results) ? results : (results ? [results] : []);

        if(response.ok){
            renderAttendanceTable(
                records,
                'userAttendanceBody',
                'userAttendanceTable',
                'userAttendanceNote',
                data?.message || 'No records found for this user.'
            );
        } else {
            showBanner(data?.message || 'Request failed.', 'error');
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
    
    if(!start || !end){
        showBanner("Please select a start and end date.", "error");
        btn.disabled = false;
        btn.textContent = "Submit";
        return;
    }
    if(start > end){
        showBanner("The start date must be before the end date.", "error");
        btn.disabled = false;
        btn.textContent = "Submit";
        return;
    }
    if(!type){
        showBanner("Please select a leave type.", "error");
        btn.disabled = false;
        btn.textContent = "Submit";
        return;
    }
    if(!reason){
        showBanner("Please enter a reason for leave.", "error");
        btn.disabled = false;
        btn.textContent = "Submit";
        return;
    }

    const normalizedType = type ? type.toLowerCase() : '';
    const url = `${API_BASE}/leave`;
    const payload = { start, end, leaveType: normalizedType, reason };

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
        const resultEl = document.getElementById('leaveRequestResult');
        const message = response.ok
            ? data?.message || 'Leave request submitted.'
            : `${response.status}: ${data?.message || response.statusText}`;

        console.log('postLeave response', { status: response.status, statusText: response.statusText, body: data });

        if(resultEl){
            resultEl.textContent = message;
            resultEl.className = response.ok ? 'modal-result success' : 'modal-result error';
        }

        if(response.ok){
            showBanner(message, "success");
        }
        else{
            showBanner(message, "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "Submit";
    }
};

function renderLeaveTable(records, tbodyId, tableId, noteId, emptyMessage){
    const tbody = document.getElementById(tbodyId);
    const table = document.getElementById(tableId);
    const note = document.getElementById(noteId);

    if(!tbody || !table || !note){
        console.error('Leave table render failed: missing elements', {tbodyId, tableId, noteId, tbody, table, note});
        showBanner('Unable to display leave records. Please refresh the page.', 'error');
        return;
    }

    tbody.innerHTML = '';

    if(!records || records.length === 0){
        table.hidden = true;
        note.textContent = emptyMessage;
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${record.leaveId || '--'}</td>
        <td>${record.start || '--'}</td>
        <td>${record.end || '--'}</td>
        <td>${record.leaveType || '--'}</td>
        <td>${record.reason || '--'}</td>
        <td>${record.status || '--'}</td> 
        `;
        tbody.appendChild(row);
    });

    table.hidden = false;
    note.textContent = '';
}

function renderLeaveTableWithUser(records, tbodyId, tableId, noteId, emptyMessage){
    const tbody = document.getElementById(tbodyId);
    const table = document.getElementById(tableId);
    const note = document.getElementById(noteId);

    if(!tbody || !table || !note){
        console.error('Leave table render failed: missing elements', {tbodyId, tableId, noteId, tbody, table, note});
        showBanner('Unable to display leave records. Please refresh the page.', 'error');
        return;
    }

    tbody.innerHTML = '';

    if(!records || records.length === 0){
        table.hidden = true;
        note.textContent = emptyMessage;
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${record.userId || '--'}</td>
        <td>${record.leaveId || '--'}</td>
        <td>${record.start || '--'}</td>
        <td>${record.end || '--'}</td>
        <td>${record.leaveType || '--'}</td>
        <td>${record.reason || '--'}</td>
        <td>${record.status || '--'}</td>
        `;
        tbody.appendChild(row);
    });

    table.hidden = false;
    note.textContent = '';
}

window.leaveHistory = async function(){
    const btn = document.getElementById("leaveHistoryBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";
    document.getElementById("leaveHistoryNote").textContent = "";
    document.getElementById("leaveHistoryTable").hidden = true;
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
        const records = data?.data ?? data?.records;

        if(response.ok){
            renderLeaveTable(
                Array.isArray(records) ? records : [],
                'leaveHistoryBody',
                'leaveHistoryTable',
                'leaveHistoryNote',
                data?.message || 'No records found.'
            );
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

function renderPendingLeaves(records){

    const tbody = document.getElementById("pendingLeavesBody");
    const table = document.getElementById("pendingLeavesTable");
    const note = document.getElementById("pendingLeavesNote");

    tbody.innerHTML = "";

    if(!records || records.length === 0){
        table.hidden = true;
        note.textContent = "No pending leave requests.";
        return;
    }

    table.hidden = false;
    note.textContent = "";

    records.forEach(record => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${record.userId}</td>
            <td>${record.leaveId}</td>
            <td>${record.leaveType}</td>
            <td>${record.start}</td>
            <td>${record.end}</td>
            <td>${record.reason}</td>
            <td>${record.status}</td>

            <td>
                <button onclick="updateLeaveStatus(${record.leaveId}, 'approve')">Approve</button>
                <button onclick="updateLeaveStatus(${record.leaveId}, 'reject')">Reject</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.pendingLeaves = async function(){
    const btn = document.getElementById("pendingLeavesBtn");
    btn.disabled = true;
    btn.textContent = "Fetching...";

    document.getElementById("pendingLeavesNote").textContent = "";
    document.getElementById("pendingLeavesTable").hidden = true;
    
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
        
        if(response.ok){
            const records = data?.records ?? [];
            renderPendingLeaves(records);
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
    document.getElementById("leaveHistoryByIdNote").textContent = "";
    document.getElementById("leaveHistoryByIdTable").hidden = true;
    const id = document.getElementById("leaves-by-id").value;
    
    if(!id){
        showBanner("Please enter a user ID.", "error");
        btn.disabled = false;
        btn.textContent = "View";
        return;
    }

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
        const records = data?.records ?? data?.data ?? [];

        if(response.ok){
            renderLeaveTableWithUser(
                Array.isArray(records) ? records : [records],
                'leaveHistoryByIdBody',
                'leaveHistoryByIdTable',
                'leaveHistoryByIdNote',
                data?.message || 'No leave records found for this user.'
            );
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

window.updateLeaveStatus = async function(id, status){
    const confirmed = window.confirm(`Are you sure you want to ${status} leave request #${id}?`);
    if(!confirmed){
        return;
    }

    try{
        const response = await fetch(`${API_BASE}/leave/${id}/${status}`,
        {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const data = await safeJson(response);
        
        if(response.ok){
            showBanner(data?.message || "Leave updated.", "success");
            pendingLeaves();
        }
        else{
            showBanner(data?.message || 'Request Failed.', "error");
        }
    } catch(error){
        showBanner("ERROR: " + error.message, "error");
    } finally{
        const approveBtn = document.getElementById('approveLeaveBtn');
        const rejectBtn = document.getElementById('rejectLeaveBtn');
        if(approveBtn){
            approveBtn.disabled = false;
        }
        if(rejectBtn){
            rejectBtn.disabled = false;
        }
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
        if(response.ok){
            showBanner(data?.message || "Device registered.", "success");
        } else{
            showBanner(data?.message || "Could not register device.", "error");
        }
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
            showBanner(data?.message || "Test notification sent.", "success");
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
    if(btn){
        btn.disabled = true;
        btn.textContent = "Logging Out...";
    }
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
            showBanner(data?.message || "Logged out", "success");
            localStorage.removeItem('token');
            document.getElementById("appLayout").hidden = true;
            document.getElementById("loginForm").hidden = false;
            resetAllInputs();
        }
        else{
            showBanner(data?.message || "Logout failed.", "error");
        }
    } catch(error){
        console.error(error);
        showBanner("ERROR " + error.message, "error");
    } finally{
        btn.disabled = false;
        btn.textContent = "Logout";
    }
};

function decodeToken(token){
    try{
        return JSON.parse(atob(token.split('.')[1]));
    } catch{
        return null;
    }
}

function decodeRole(token){
    return decodeToken(token)?.role.toUpperCase() || null;
}

function resetAllInputs(){
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
    document.getElementById("reg-username").value = "";
    document.getElementById("reg-password").value = "";
    document.getElementById("reg-email").value = "";
    document.getElementById("code").value = "";
    document.getElementById("otp").value = "";

    document.querySelectorAll('#appLayout input, #appLayout select').forEach((el) => {
        if(el.type === 'checkbox' || el.type === 'radio'){
            el.checked = false;
        } else {
            el.value = "";
        }
    });

    document.querySelectorAll('pre').forEach((el) => {
        el.textContent = '';
    });
    document.querySelectorAll('table.data-table tbody, table.data-id-table tbody, table.leave-table tbody').forEach((tbody) => {
        tbody.innerHTML = '';
    });
    document.querySelectorAll('table[hidden]').forEach((table) => {
        table.hidden = true;
    });
}

window.openModal = function(modalId, linkEl){
    const modal = document.getElementById(modalId);
    if(!modal){
        console.error(`Modal not found: ${modalId}`);
        return;
    }

    modal.hidden = false;
    if(linkEl){
        document.querySelectorAll('#sidebar a').forEach(link => link.classList.remove('active'));
        linkEl.classList.add('active');
    }
};

window.closeModal = function(modalId){
    const modal = document.getElementById(modalId);
    if(!modal){
        console.error(`Modal not found: ${modalId}`);
        return;
    }

    modal.hidden = true;
};

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay){
            overlay.hidden = true;
        }
    });
});
    
