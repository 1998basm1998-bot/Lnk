const BACKEND_URL = 'https://5b24da97-5865-4f70-9364-aa0189c80879.a0.dev'; 

let users = Storage.getUsers();
let currentUserId = null;

// رسالة الترحيب عند فتح المشروع
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderHome();
    setTimeout(() => {
        customAlert("المشروع الوطني باسم عمارة");
    }, 500);
});

// ================= وظيفة المزامنة الحقيقية من البرج =================
window.syncFromTower = async function() {
    const config = Storage.getApiSettings();
    if (!config.ip || !config.user || !config.pass) {
        customAlert("يرجى ضبط إعدادات الـ API أولاً من أيقونة الترس ⚙️");
        return;
    }

    const btn = document.getElementById('syncBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
    btn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/fetch-secrets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const result = await response.json();

        if (result.success) {
            const towerUsers = result.data.map(tUser => {
                let existingUser = users.find(u => u.user === tUser.user);
                
                return {
                    id: existingUser ? existingUser.id : Date.now() + Math.random(),
                    name: tUser.name || tUser.user,
                    phone: existingUser ? existingUser.phone : '',
                    package: tUser.profile || 'Default',
                    price: existingUser ? existingUser.price : 0,
                    tower: config.ip,
                    user: tUser.user,
                    startDate: existingUser ? existingUser.startDate : new Date().toISOString(),
                    endDate: existingUser ? existingUser.endDate : new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                    status: tUser.status, 
                    history: existingUser ? existingUser.history : []
                };
            });

            users = towerUsers;
            Storage.saveUsers(users);
            renderHome();
            customAlert(`تمت المزامنة بنجاح! تم جلب ${users.length} مشترك.`);
        } else {
            customAlert("خطأ في المزامنة: " + result.error);
        }
    } catch (error) {
        customAlert("فشل الاتصال بمحرك الـ Backend.");
    } finally {
        btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        btn.disabled = false;
    }
}

// ================= النوافذ المنبثقة المخصصة =================
window.customAlert = function(msg) { document.getElementById('alertMsg').innerText = msg; document.getElementById('customAlertModal').classList.add('active'); }
window.closeCustomAlert = function() { document.getElementById('customAlertModal').classList.remove('active'); }
window.customConfirm = function(msg, onYes) {
    document.getElementById('confirmMsg').innerText = msg;
    document.getElementById('confirmYesBtn').onclick = function() { closeCustomConfirm(); onYes(); };
    document.getElementById('customConfirmModal').classList.add('active');
}
window.closeCustomConfirm = function() { document.getElementById('customConfirmModal').classList.remove('active'); }

// ================= إعدادات المظهر =================
window.toggleTheme = function() {
    let body = document.body;
    let isDark = body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        body.removeAttribute('data-theme'); localStorage.setItem('theme', 'light');
        document.querySelectorAll('.theme-icon').forEach(icon => { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); });
    } else {
        body.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark');
        document.querySelectorAll('.theme-icon').forEach(icon => { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); });
    }
}
function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.querySelectorAll('.theme-icon').forEach(icon => { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); });
    }
}

// ================= إعدادات الربط API =================
window.openApiSettings = function() {
    let data = Storage.getApiSettings();
    document.getElementById('api-ip').value = data.ip || '';
    document.getElementById('api-port').value = data.port || '';
    document.getElementById('api-user').value = data.user || '';
    document.getElementById('api-pass').value = data.pass || '';
    document.getElementById('apiSettingsModal').classList.add('active');
}

window.saveApiSettings = function() {
    let config = {
        ip: document.getElementById('api-ip').value,
        port: document.getElementById('api-port').value,
        user: document.getElementById('api-user').value,
        pass: document.getElementById('api-pass').value
    };
    Storage.saveApiSettings(config);
    closeModals();
    customAlert("تم حفظ الإعدادات بنجاح.");
}

// ================= الدوال المساعدة =================
function formatDateTimeLocal(date) {
    let d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}
function formatDateDisplay(dateStr) {
    let d = new Date(dateStr); let yyyy = d.getFullYear(); let mm = String(d.getMonth() + 1).padStart(2, '0'); let dd = String(d.getDate()).padStart(2, '0');
    let hours = d.getHours(); let minutes = String(d.getMinutes()).padStart(2, '0'); let ampm = hours >= 12 ? 'PM' : 'AM'; hours = hours % 12 || 12;
    return `${yyyy}/${mm}/${dd} ${hours}:${minutes} ${ampm}`;
}
function calculateTimeStatus(startDateStr, endDateStr) {
    let now = new Date(); let end = new Date(endDateStr); let diffMs = end - now;
    if (diffMs <= 0) return { status: 'غير متصل', text: 'منتهي', colorClass: 'status-offline' };
    let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)); let diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { status: 'متصل', text: `باقي ${diffDays} يوم و ${diffHours} ساعة`, colorClass: 'status-online' };
}
function showView(viewId) { document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active')); document.getElementById(viewId).classList.add('active'); }

// ================= الوظائف الرئيسية =================
window.goHome = function() { showView('view-home'); currentUserId = null; renderHome(); }

window.renderHome = function() {
    const list = document.getElementById('subscribersList');
    list.innerHTML = '';
    if(users.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:20px;">لا يوجد مشتركين. قم بالضغط على 🔄 للمزامنة.</p>';
        return;
    }
    users.sort((a,b) => b.id - a.id).forEach(user => {
        let timeData = calculateTimeStatus(user.startDate, user.endDate);
        let liveStatus = user.status || timeData.status;
        let colorClass = liveStatus === 'متصل' ? 'status-online' : 'status-offline';

        let card = document.createElement('div'); card.className = 'user-card'; card.onclick = () => openProfile(user.id);
        card.innerHTML = `
            <div class="user-info">
                <h4>${user.name}</h4>
                <p><span class="${colorClass}">● ${liveStatus}</span> | ${Number(user.price).toLocaleString()} د.ع</p>
            </div>
            <div class="user-actions-list">
                <button class="btn-icon-small edit-btn" onclick="openEditModalFromList(${user.id}, event)"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-small delete-btn" onclick="deleteUserBtn(${user.id}, event)"><i class="fas fa-trash"></i></button>
            </div>`;
        list.appendChild(card);
    });
}

window.openAddModal = function() {
    currentUserId = null; document.getElementById('modalTitle').innerText = 'إضافة مشترك جديد';
    ['f-id','f-name','f-phone','f-package','f-price','f-tower','f-user'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-start-date').value = formatDateTimeLocal(new Date());
    document.getElementById('userModal').classList.add('active');
}

window.openEditModalFromList = function(id, event) { event.stopPropagation(); currentUserId = id; window.openEditModal(); }
window.openEditModal = function() {
    let user = users.find(u => u.id === currentUserId); if(!user) return;
    document.getElementById('modalTitle').innerText = 'تعديل معلومات المشترك';
    document.getElementById('f-id').value = user.id; document.getElementById('f-name').value = user.name; document.getElementById('f-phone').value = user.phone;
    document.getElementById('f-package').value = user.package; document.getElementById('f-price').value = user.price; document.getElementById('f-tower').value = user.tower;
    document.getElementById('f-user').value = user.user; document.getElementById('f-start-date').value = formatDateTimeLocal(user.startDate);
    document.getElementById('userModal').classList.add('active');
}

window.closeModals = function() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); }

window.saveUser = function() {
    let fIdVal = document.getElementById('f-id').value; let finalId = fIdVal ? parseInt(fIdVal) : Date.now(); 
    let startDateObj = new Date(document.getElementById('f-start-date').value || new Date());
    let endDateObj = new Date(startDateObj.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    let newUser = {
        id: finalId, name: document.getElementById('f-name').value, phone: document.getElementById('f-phone').value,
        package: document.getElementById('f-package').value || 'Default', price: document.getElementById('f-price').value || 0,
        tower: document.getElementById('f-tower').value || 'N/A', user: document.getElementById('f-user').value || 'N/A',
        startDate: startDateObj.toISOString(), endDate: endDateObj.toISOString(), history: []
    };
    
    if(!newUser.name || !newUser.phone) { customAlert("الاسم ورقم الهاتف مطلوبان!"); return; }
    
    if (fIdVal) {
        let index = users.findIndex(u => u.id === finalId);
        if(index !== -1) { newUser.history = users[index].history; users[index] = newUser; }
    } else {
        if (newUser.price > 0 || newUser.price < 0) {
            newUser.history.push({ id: Date.now(), type: 'deposit', amount: parseFloat(newUser.price), date: formatDateDisplay(new Date().toISOString()), balance: parseFloat(newUser.price) });
        }
        users.unshift(newUser); 
    }
    
    Storage.saveUsers(users);
    closeModals();
    goHome();
}

window.deleteUserBtn = function(id, event) {
    if(event) event.stopPropagation(); 
    customConfirm('هل أنت متأكد من حذف المشترك نهائياً؟', () => {
        users = users.filter(u => u.id !== id); 
        Storage.saveUsers(users);
        goHome();
    });
}

window.openProfile = function(id) {
    currentUserId = id; let user = users.find(u => u.id === id); if(!user) return;
    let timeData = calculateTimeStatus(user.startDate, user.endDate);
    document.getElementById('p-name').innerText = user.name; document.getElementById('p-deposit').innerText = `${Number(user.price).toLocaleString()} د.ع`;
    document.getElementById('p-package').innerText = user.package; document.getElementById('p-tower').innerText = user.tower; document.getElementById('p-user').innerText = user.user;
    
    let cleanPhone = user.phone.replace(/\D/g, ''); if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    let phoneLink = document.getElementById('p-phone'); phoneLink.innerText = `+964 ${cleanPhone}`; phoneLink.href = `tel:+964${cleanPhone}`; 
    
    let liveStatus = user.status || timeData.status;
    document.getElementById('p-status').innerHTML = `<i class="fas fa-circle" style="color: ${liveStatus === 'متصل' ? 'var(--success-green)' : 'var(--text-main)'}"></i>`;
    document.getElementById('p-days').innerText = timeData.text; document.getElementById('p-end-date').innerText = formatDateDisplay(user.endDate);
    showView('view-profile');
}

window.openRenewModal = function() { document.getElementById('r-date').value = formatDateTimeLocal(new Date()); document.getElementById('renewModal').classList.add('active'); }
window.confirmRenew = function() {
    let user = users.find(u => u.id === currentUserId); let selectedDate = new Date(document.getElementById('r-date').value);
    user.startDate = selectedDate.toISOString(); user.endDate = new Date(selectedDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();
    Storage.saveUsers(users);
    closeModals(); openProfile(currentUserId);
}

window.sendWhatsApp = function() {
    let user = users.find(u => u.id === currentUserId); let text = encodeURIComponent(document.getElementById('shareText').value);
    let phone = user.phone.replace(/\D/g, ''); if (phone.startsWith('0')) phone = phone.substring(1);
    window.open(`https://wa.me/964${phone}?text=${text}`, '_blank'); closeModals();
}
window.openShareModal = function() { let user = users.find(u => u.id === currentUserId); document.getElementById('shareText').value = `مرحباً ${user.name}، ينتهي اشتراكك بتاريخ ${formatDateDisplay(user.endDate)}.`; document.getElementById('shareModal').classList.add('active'); }
window.openDepositModal = function() { document.getElementById('t-amount').value = ''; document.getElementById('depositModal').classList.add('active'); }

window.saveTransaction = function() {
    let user = users.find(u => u.id === currentUserId); let type = document.getElementById('t-type').value; let amount = parseFloat(document.getElementById('t-amount').value);
    if(!amount) return;
    let currentBalance = parseFloat(user.price) || 0; let newBalance = type === 'deposit' ? currentBalance + amount : currentBalance - amount;
    user.history.unshift({ id: Date.now(), type: type, amount: amount, date: formatDateDisplay(new Date().toISOString()), balance: newBalance });
    user.price = newBalance; 
    Storage.saveUsers(users);
    closeModals(); openProfile(currentUserId);
}

window.openHistory = function() {
    let user = users.find(u => u.id === currentUserId); let list = document.getElementById('historyList'); list.innerHTML = '';
    if(!user.history || user.history.length === 0) { list.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:20px;">لا يوجد سجل حركات حتى الآن.</p>'; } 
    else {
        user.history.forEach(tx => {
            let isDeposit = tx.type === 'deposit';
            list.innerHTML += `<div class="history-card"><div style="display:flex; align-items:center; gap:15px;"><div class="history-icon ${isDeposit ? 'bg-green' : 'bg-orange'}"><i class="fas ${isDeposit ? 'fa-money-bill-wave' : 'fa-hand-holding-usd'}"></i></div><div><h4>${isDeposit ? 'إيداع' : 'إضافة دين'} ${tx.amount.toLocaleString()} د.ع</h4><p style="font-size:12px; color:var(--text-muted); margin-top:2px;"><i class="fas fa-clock"></i> ${tx.date || 'تاريخ غير متوفر'}</p><p style="font-size:12px; margin-top:5px; font-weight:bold; color:var(--primary-blue);">الرصيد بعد العملية: ${tx.balance.toLocaleString()} د.ع</p></div></div></div>`;
        });
    }
    showView('view-history');
}
window.closeHistory = function() { showView('view-profile'); }
window.filterUsers = function() { let val = document.getElementById('searchInput').value.toLowerCase(); document.querySelectorAll('.user-card').forEach(card => { let name = card.querySelector('h4').innerText.toLowerCase(); card.style.display = name.includes(val) ? 'flex' : 'none'; }); }
