
let currentUser = localStorage.getItem("currentUser") || null;
let isAdmin = localStorage.getItem("userRole") === "admin";


if (!localStorage.getItem("local_issues")) localStorage.setItem("local_issues", JSON.stringify([]));
if (!localStorage.getItem("local_users")) localStorage.setItem("local_users", JSON.stringify([]));

const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");
const dashboardPage = document.getElementById("dashboardPage");
const adminDashboardPage = document.getElementById("adminDashboardPage");
const analyticsPage = document.getElementById("analyticsPage");
const currentUserEl = document.getElementById("currentUser");
const issuesList = document.getElementById("issuesList");
const issueForm = document.getElementById("issueForm");
const issueTitleInput = document.getElementById("issueTitle");
const issueDescInput = document.getElementById("issueDesc");
const issueImageInput = document.getElementById("issueImage");
const issueCategoryInput = document.getElementById("issueCategory");
const adminIssuesList = document.getElementById("adminIssuesList");
const statusFilter = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");
const searchIssuesInput = document.getElementById("searchIssues");
const adminLogoutBtn = document.getElementById("adminLogout");
const tutorialBtn = document.getElementById("tutorialBtn");
const emergencyBtn = document.getElementById("emergencyBtn");
const pages = document.querySelectorAll(".page");
adminLogoutBtn?.addEventListener("click", logout);

const ADMIN_USER = "admin";
const ADMIN_PASS = "123";


function getLocalIssues() { return JSON.parse(localStorage.getItem("local_issues")); }
function saveLocalIssues(issues) { localStorage.setItem("local_issues", JSON.stringify(issues)); }
function getLocalUsers() { return JSON.parse(localStorage.getItem("local_users")); }
function saveLocalUsers(users) { localStorage.setItem("local_users", JSON.stringify(users)); }

function toggleFloatingButtons(show) {
    if (!tutorialBtn || !emergencyBtn) return;
    if (show) {
        tutorialBtn.classList.remove("hidden");
        emergencyBtn.classList.remove("hidden");
        tutorialBtn.classList.add("anim-in");
        emergencyBtn.classList.add("anim-in");
    } else {
        tutorialBtn.classList.add("hidden");
        emergencyBtn.classList.add("hidden");
    }
}

function initializeBarangays() {
    const brgySelect = document.getElementById("issueBarangay");
    if (!brgySelect) return;
    brgySelect.innerHTML = '<option value="" disabled selected>Select Barangay</option>';
    for (let i = 1; i <= 201; i++) {
        const opt = document.createElement("option");
        opt.value = `Barangay ${i}`;
        opt.textContent = `Barangay ${i}`;
        brgySelect.appendChild(opt);
    }
}

function populateStreets() {
    const brgySelect = document.getElementById("issueBarangay");
    const streetSelect = document.getElementById("issueStreet");
    if (!brgySelect || !streetSelect) return;
    const selectedBrgy = brgySelect.value;
    const pasayStreets = {
        "Barangay 183": ["Villamor Airbase", "Piczon St", "Andrews Ave", "Sales Road"],
        "Barangay 76": ["SM Mall of Asia", "Diokno Blvd", "Coral Way", "J.W. Diokno"],
        "Barangay 178": ["Maricaban St", "Apelo Cruz", "P. Santos"],
        "Default": ["Main Street", "Interior Road", "Side Alley"]
    };
    streetSelect.innerHTML = '<option value="" disabled selected>Select Street</option>';
    streetSelect.disabled = false;
    const streets = pasayStreets[selectedBrgy] || pasayStreets["Default"];
    streets.forEach(street => {
        const opt = document.createElement("option");
        opt.value = street;
        opt.textContent = street;
        streetSelect.appendChild(opt);
    });
}

function openImageModal(src) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    if (modal && modalImg) {
        modalImg.src = src;
        modal.classList.remove("hidden");
    }
}

function closeImageModal() {
    const modal = document.getElementById("imageModal");
    if (modal) modal.classList.add("hidden");
}

async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800; 
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.7)); 
            };
        };
    });
}

function formatChatMessage(m, senderClass) {
    let contentHtml = "";
    if (m.text && m.text.startsWith("data:image")) {
        contentHtml = `<img src="${m.text}" class="chat-proof-img" onclick="openImageModal('${m.text}')" alt="Proof Image" style="cursor:pointer; max-width:100%; border-radius:8px; border:2px solid #FFCC00; margin-top:5px;">`;
    } else {
        contentHtml = `<span>${m.text}</span>`;
    }
    return `
        <div class="chat-message ${senderClass}">
            <strong>${m.sender}:</strong>
            <div class="message-content">${contentHtml}</div>
            <small style="display:block; font-size:0.7rem; opacity:0.7;">${new Date(m.timestamp).toLocaleString()}</small>
        </div>
    `;
}

function animateIn(el) {
    el.classList.remove("hidden");
    el.classList.remove("anim-out");
    el.classList.add("anim-in");
    const handler = () => {
        el.classList.remove("anim-in");
        el.removeEventListener("animationend", handler);
    };
    el.addEventListener("animationend", handler);
}

async function animateOut(el) {
    return new Promise((resolve) => {
        el.classList.add("anim-out");
        const handler = () => {
            el.classList.remove("anim-out");
            el.classList.add("hidden");
            el.removeEventListener("animationend", handler);
            resolve();
        };
        el.addEventListener("animationend", handler);
    });
}

async function switchPage(toEl) {
    const visible = Array.from(pages).find(p => !p.classList.contains("hidden") && p !== toEl);
    if (visible) await animateOut(visible);
    animateIn(toEl);
}

function showLogin() { clearForms(); switchPage(loginPage); toggleFloatingButtons(true); }
function showRegister() { clearForms(); switchPage(registerPage); toggleFloatingButtons(true); }

function showDashboard() {
    clearForms();
    if (currentUserEl) currentUserEl.textContent = currentUser;
    switchPage(dashboardPage);
    initializeBarangays(); 
    loadUserIssues();
    toggleFloatingButtons(true); 
}

function showAdminDashboard() {
    clearForms();
    switchPage(adminDashboardPage);
    loadAllIssues();
    if (tutorialBtn) tutorialBtn.style.display = "none"; 
    const adminBtn = document.getElementById("adminTutorialBtn");
    if (adminBtn) adminBtn.style.display = "flex"; 
    toggleFloatingButtons(false); 
}

function logout() {
    clearForms();
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    const adminBtn = document.getElementById("adminTutorialBtn");
    if (adminBtn) adminBtn.style.display = "none";
    if (tutorialBtn) tutorialBtn.style.display = "flex";
    switchPage(loginPage);
    toggleFloatingButtons(true);
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return alert(message);
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(-10px) scale(0.98)"; }, 3000);
    setTimeout(() => { if(t.parentNode) container.removeChild(t); }, 3500);
}

function generateTrackingNumber() { return "PID-" + Date.now().toString().slice(-6); }

function clearForms() {
    document.querySelectorAll("#loginForm input, #registerForm input, #issueForm input, #issueForm textarea").forEach(el => {
        if (el.type !== "button" && el.type !== "submit" && el.type !== "file") el.value = "";
        if (el.type === "file") el.value = null;
    });
    const streetSelect = document.getElementById("issueStreet");
    if (streetSelect) { streetSelect.innerHTML = '<option value="" disabled selected>Select Street</option>'; streetSelect.disabled = true; }
    const brgySelect = document.getElementById("issueBarangay");
    if (brgySelect) brgySelect.selectedIndex = 0; 
}

// --- AUTHENTICATION LOGIC (LocalStorage) ---

document.getElementById("deleteAllUsers")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all users?")) {
        saveLocalUsers([]);
        showToast("All users deleted");
    }
});

document.getElementById("registerForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("regUsername").value;
    const email = document.getElementById("regEmail").value;
    const gender = document.getElementById("regGender").value;
    const password = document.getElementById("regPassword").value;

    let users = getLocalUsers();
    if (users.find(u => u.username === username)) {
        showToast("Username already exists", "error");
        return;
    }

    users.push({ username, email, gender, password });
    saveLocalUsers(users);
    showToast("Registration successful!", "success");
    showLogin();
});

document.getElementById("loginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        localStorage.setItem("userRole", "admin");
        currentUser = "Admin";
        isAdmin = true;
        showToast("Admin logged in", "success");
        showAdminDashboard();
        return;
    }

    let users = getLocalUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user.username;
        localStorage.setItem("currentUser", currentUser);
        localStorage.setItem("userRole", "user");
        showToast("Logged in — welcome " + currentUser + "!", "success"); 
        showDashboard();
    } else {
        showToast("Invalid credentials", "error");
    }
});

// --- ISSUE MANAGEMENT (LocalStorage) ---

issueForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const brgyValue = document.getElementById("issueBarangay")?.value;
    const streetValue = document.getElementById("issueStreet")?.value;
    if (!brgyValue || !streetValue) {
        showToast("Please select a Barangay and Street.", "error");
        return;
    }
    const imageFile = issueImageInput.files[0];
    let imageData = null;
    if (imageFile) imageData = await compressImage(imageFile);

    const newIssue = {
        tracking_id: generateTrackingNumber(),
        user: currentUser,
        title: issueTitleInput.value,
        description: issueDescInput.value,
        category: issueCategoryInput.value,
        barangay: brgyValue,
        street: streetValue,
        image_data: imageData, // LocalStorage saves the base64 string
        status: "Pending",
        messages: [],
        timestamp: new Date().toISOString()
    };

    let issues = getLocalIssues();
    issues.push(newIssue);
    saveLocalIssues(issues);

    showToast(`Submitted! Tracking: ${newIssue.tracking_id}`, "success");
    issueForm.reset();
    if(document.getElementById("issueStreet")) document.getElementById("issueStreet").disabled = true;
    loadUserIssues();
});

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            cardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

function loadUserIssues() {
    if(!issuesList) return;
    const issues = getLocalIssues().filter(i => i.user === currentUser);
    issuesList.innerHTML = "";
    if (issues.length === 0) {
        issuesList.innerHTML = "<p>No reports found.</p>";
        return;
    }
    issues.forEach((issue) => {
        const div = document.createElement("div");
        div.classList.add("issue-card");
        let imageHtml = issue.image_data ? `<img src="${issue.image_data}" alt="Issue" onclick="openImageModal('${issue.image_data}')" style="cursor:zoom-in;">` : "";
        let chatHtml = (issue.messages || []).map((m) => formatChatMessage(m, m.sender === currentUser ? "chat-user" : "chat-admin")).join("");
        div.innerHTML = `
            ${imageHtml}
            <h4>${issue.title} <small>[${issue.tracking_id}]</small></h4>
            <p><strong>Location:</strong> ${issue.barangay}, ${issue.street}</p>
            <p><strong>Category:</strong> ${issue.category}</p>
            <p>${issue.description}</p>
            <p>Status: <span class="status-badge status-${issue.status.replace(/\s/g, "")}">${issue.status}</span></p>
            <div class="chat-box">${chatHtml || "<p>No messages yet.</p>"}</div>
            <div class="chat-input-container">
                <textarea placeholder="Type a message..." class="chat-input"></textarea>
                <button class="btn-chat" data-id="${issue.tracking_id}">Send</button>
            </div>
        `;
        issuesList.appendChild(div);
        cardObserver.observe(div);
    });
    attachChatListeners(loadUserIssues);
}

function loadAllIssues() {
    if(!adminIssuesList) return;
    let issues = getLocalIssues();
    const filterStatus = statusFilter.value || "all";
    const filterCategory = categoryFilter.value || "all";
    const searchQuery = searchIssuesInput.value?.toLowerCase() || "";

    issues = issues.filter((issue) => {
        const matchStatus = filterStatus === "all" || issue.status === filterStatus;
        const matchCategory = filterCategory === "all" || issue.category === filterCategory;
        const matchSearch = issue.tracking_id.toLowerCase().includes(searchQuery);
        return matchStatus && matchCategory && matchSearch;
    });

    adminIssuesList.innerHTML = "";
    if (issues.length === 0) {
        adminIssuesList.innerHTML = "<p>No issues found.</p>";
        return;
    }
    issues.forEach((issue) => {
        const div = document.createElement("div");
        div.classList.add("issue-card");
        let imageHtml = issue.image_data ? `<img src="${issue.image_data}" alt="Issue" onclick="openImageModal('${issue.image_data}')" style="cursor:zoom-in;">` : "";
        let chatHtml = (issue.messages || []).map((m) => formatChatMessage(m, m.sender === "Admin" ? "chat-admin" : "chat-user")).join("");
        div.innerHTML = `
            ${imageHtml}
            <h4>${issue.title} <small>[${issue.tracking_id}]</small></h4>
            <p><strong>Location:</strong> <span style="color:#006633; font-weight:bold;">${issue.barangay}</span>, ${issue.street}</p>
            <p><strong>Category:</strong> ${issue.category}</p>
            <p><strong>User:</strong> ${issue.user}</p>
            <p>${issue.description}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${issue.status.replace(/\s/g, "")}">${issue.status}</span></p>
            <div class="chat-box">${chatHtml || "<p>No messages yet.</p>"}</div>
            <div class="admin-chat-area">
                <textarea placeholder="Type a reply..." class="chat-input"></textarea>
                <div id="status-msg-${issue.tracking_id}" style="font-size: 0.8rem; color: #27ae60; margin-bottom: 5px;"></div>
                <div class="chat-controls">
                    <input type="file" class="admin-proof-file hidden" id="proof-${issue.tracking_id}" accept="image/*">
                    <button class="btn-attachment" onclick="document.getElementById('proof-${issue.tracking_id}').click()" title="Attach Proof">📎</button>
                    <button class="btn-chat" data-id="${issue.tracking_id}">Reply</button>
                </div>
            </div>
            <div class="admin-controls">
                <label>Update Status:</label>
                <select class="status-select" data-id="${issue.tracking_id}">
                    <option value="Pending" ${issue.status === "Pending" ? "selected" : ""}>Pending</option>
                    <option value="In Progress" ${issue.status === "In Progress" ? "selected" : ""}>In Progress</option>
                    <option value="Resolved" ${issue.status === "Resolved" ? "selected" : ""}>Resolved</option>
                </select>
                <button class="btn-danger delete-btn" data-id="${issue.tracking_id}">Delete</button>
            </div>
        `;
        adminIssuesList.appendChild(div);
        cardObserver.observe(div);
    });
    attachChatListeners(loadAllIssues);
    attachAdminActionListeners();
}

function attachChatListeners(refreshCallback) {
    document.querySelectorAll(".admin-proof-file").forEach((fileInput) => {
        fileInput.onchange = (e) => {
            const issueId = e.target.id.replace('proof-', '');
            const statusMsg = document.getElementById(`status-msg-${issueId}`);
            if (e.target.files.length > 0) statusMsg.textContent = "Image ready to send";
            else statusMsg.textContent = "";
        };
    });
    document.querySelectorAll(".btn-chat").forEach((btn) => {
        btn.onclick = async (e) => {
            const issueId = e.target.dataset.id;
            const container = e.target.closest('.admin-chat-area') || e.target.closest('.chat-input-container');
            const input = container.querySelector('.chat-input');
            const fileInput = container.querySelector('.admin-proof-file');
            const text = input.value.trim();
            const senderName = isAdmin ? "Admin" : currentUser;

            if (text) sendMessageLocal(issueId, text, senderName);
            if (fileInput && fileInput.files[0]) {
                const compressedImg = await compressImage(fileInput.files[0]);
                sendMessageLocal(issueId, compressedImg, senderName);
                fileInput.value = ""; 
            }
            if (text || (fileInput && fileInput.files[0])) {
                input.value = "";
                refreshCallback();
            }
        };
    });
}

function attachAdminActionListeners() {
    document.querySelectorAll(".status-select").forEach((select) => {
        select.onchange = (e) => {
            updateIssueStatusLocal(e.target.dataset.id, e.target.value);
            loadAllIssues();
        };
    });
    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.onclick = (e) => {
            if (confirm("Delete this issue?")) {
                deleteIssueLocal(e.target.dataset.id);
                loadAllIssues();
            }
        };
    });
}

// --- MGA LOCAL DATA UPDATERS ---

function sendMessageLocal(tracking_id, text, sender) {
    let issues = getLocalIssues();
    const index = issues.findIndex(i => i.tracking_id === tracking_id);
    if (index !== -1) {
        issues[index].messages.push({ sender, text, timestamp: new Date().toISOString() });
        saveLocalIssues(issues);
    }
}

function updateIssueStatusLocal(tracking_id, status) {
    let issues = getLocalIssues();
    const index = issues.findIndex(i => i.tracking_id === tracking_id);
    if (index !== -1) {
        issues[index].status = status;
        saveLocalIssues(issues);
    }
}

function deleteIssueLocal(tracking_id) {
    let issues = getLocalIssues();
    issues = issues.filter(i => i.tracking_id !== tracking_id);
    saveLocalIssues(issues);
}

function loadAnalytics(issues) {
    const total = issues.length;
    const pending = issues.filter(i => i.status === "Pending").length;
    const inProgress = issues.filter(i => i.status === "In Progress").length;
    const resolved = issues.filter(i => i.status === "Resolved").length;

    document.getElementById("totalIssuesCard").textContent = `Total Feedback: ${total}`;
    document.getElementById("pendingIssuesCard").textContent = `Pending: ${pending}`;
    document.getElementById("progressIssuesCard").textContent = `In Progress: ${inProgress}`;
    document.getElementById("resolvedIssuesCard").textContent = `Resolved: ${resolved}`;

    const chartLabels = ["Garbage Collection", "Traffic & Stoplights", "Road Maintenance", "Street Lighting", "Public Safety", "Others"];
    const counts = { "Garbage Collection": 0, "Traffic & Stoplights": 0, "Road Maintenance": 0, "Street Lighting": 0, "Public Safety": 0, "Others": 0 };
    issues.forEach(i => {
        const cat = i.category || "Others";
        if (counts.hasOwnProperty(cat)) counts[cat]++;
        else counts["Others"]++;
    });
    const ctx = document.getElementById("issuesByCategoryChart");
    if (!ctx) return;
    if (window.categoryChart) window.categoryChart.destroy();
    window.categoryChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "Number of Feedback",
                data: chartLabels.map(l => counts[l]),
                backgroundColor: ["#27ae60", "#e67e22", "#2980b9", "#f1c40f", "#e74c3c", "#95a5a6"],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin") {
        currentUser = "Admin";
        isAdmin = true;
        showAdminDashboard();
    } else if (userRole === "user" && currentUser) {
        showDashboard();
    } else {
        showLogin();
    }

    statusFilter?.addEventListener("change", loadAllIssues);
    categoryFilter?.addEventListener("change", loadAllIssues);
    searchIssuesInput?.addEventListener("input", loadAllIssues);
    document.getElementById("issueBarangay")?.addEventListener("change", populateStreets);

    document.getElementById("viewAnalyticsBtn")?.addEventListener("click", () => {
        adminDashboardPage.classList.add("hidden");
        analyticsPage.classList.remove("hidden");
        loadAnalytics(getLocalIssues());
    });

    document.getElementById("backToIssuesBtn")?.addEventListener("click", () => {
        analyticsPage.classList.add("hidden");
        adminDashboardPage.classList.remove("hidden");
    });

    document.getElementById("exportCSV")?.addEventListener("click", () => {
        const issues = getLocalIssues();
        let csvContent = "data:text/csv;charset=utf-8,Tracking ID,User,Title,Category,Status,Barangay,Street\n";
        issues.forEach(i => {
            csvContent += `${i.tracking_id},${i.user},${i.title},${i.category},${i.status},${i.barangay},${i.street}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "feedback_reports.csv");
        document.body.appendChild(link);
        link.click();
    });
});

function toggleEmergencyModal(show) {
    const modal = document.getElementById('emergencyModal');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function toggleAdminTutorial(show) {
    const modal = document.getElementById('adminTutorialModal');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

window.onclick = function(event) {
    const modal = document.getElementById('emergencyModal');
    const imgModal = document.getElementById('imageModal');
    if (event.target == modal) toggleEmergencyModal(false);
    if (event.target == imgModal) closeImageModal();
}