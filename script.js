let currentSessionId = null;
let scores = { mistakes: 0, prompts: 0 };

let startTime = 0;
let elapsedBeforePause = 0;
let difference = 0;
let timerAnimationId = null;
let isRunning = false;

const display = document.getElementById('display');
const mainBtn = document.getElementById('mainBtn');
const resetBtn = document.getElementById('resetBtn');
const mainIcon = document.getElementById('mainIcon');
const mainCard = document.getElementById('mainCard');
const titleInput = document.getElementById('sessionTitleInput');

function getUniqueDefaultName() {
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    let i = 1;
    let name = `السرد ${i}`;
    while (sessions.some(s => s.title === name)) {
        i++;
        name = `السرد ${i}`;
    }
    return name;
}

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem("sard_user_theme");
    const themeIconImg = document.getElementById("themeIconImg");
    
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        if (themeIconImg) {
            themeIconImg.src = "Dark_Mode.png";
        }
    } else {
        if (themeIconImg) {
            themeIconImg.src = "Light_Mode.png";
        }
    }

    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    if (sessions.length > 0) {
        loadSession(sessions[0].id);
    } else {
        createNewSession(true);
    }
});

function toggleAppTheme() {
    const body = document.body;
    const themeIconImg = document.getElementById("themeIconImg");
    
    body.classList.toggle("light-mode");
    
    if (body.classList.contains("light-mode")) {
        localStorage.setItem("sard_user_theme", "light");
        if (themeIconImg) {
            themeIconImg.src = "Dark_Mode.png";
        }
    } else {
        localStorage.setItem("sard_user_theme", "dark");
        if (themeIconImg) {
            themeIconImg.src = "Light_Mode.png";
        }
    }
}

function showCustomPrompt(title, defaultValue, onConfirm) {
    const overlay = document.getElementById('customModalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalMsg = document.getElementById('modalMessage');
    const container = document.getElementById('modalContentContainer');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const confirmBtn = document.getElementById('modalConfirmBtn');

    modalTitle.innerText = title;
    modalMsg.style.display = 'none';
    container.innerHTML = `<input type="text" id="customModalInput" class="modal-input" value="${defaultValue}">`;
    
    confirmBtn.className = 'modal-btn modal-btn-confirm';
    confirmBtn.innerText = 'موافق';
    cancelBtn.innerText = 'إلغاء';

    overlay.classList.add('active');
    const input = document.getElementById('customModalInput');
    input.focus();
    input.select();

    const newCancel = cancelBtn.cloneNode(true);
    const newConfirm = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    newCancel.onclick = () => {
        overlay.classList.remove('active');
    };

    const submit = () => {
        const val = input.value.trim();
        overlay.classList.remove('active');
        if (val !== '') {
            onConfirm(val);
        }
    };

    newConfirm.onclick = submit;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') submit();
    };
}

function showCustomConfirm(title, message, isDanger, onConfirm) {
    const overlay = document.getElementById('customModalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalMsg = document.getElementById('modalMessage');
    const container = document.getElementById('modalContentContainer');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const confirmBtn = document.getElementById('modalConfirmBtn');

    modalTitle.innerText = title;
    modalMsg.style.display = 'block';
    modalMsg.innerText = message;
    container.innerHTML = '';

    confirmBtn.className = `modal-btn ${isDanger ? 'modal-btn-danger' : 'modal-btn-confirm'}`;
    confirmBtn.innerText = 'تأكيد';
    cancelBtn.innerText = 'إلغاء';

    overlay.classList.add('active');

    const newCancel = cancelBtn.cloneNode(true);
    const newConfirm = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    newCancel.onclick = () => {
        overlay.classList.remove('active');
    };

    newConfirm.onclick = () => {
        overlay.classList.remove('active');
        onConfirm();
    };
}

function createNewSession(isInitialLoad = false) {
    let newName = getUniqueDefaultName();
    
    if (!isInitialLoad) {
        showCustomPrompt("أدخل اسم الحلقة الجديدة:", newName, (userInput) => {
            executeCreateSession(userInput);
        });
    } else {
        executeCreateSession(newName);
    }
}

function executeCreateSession(name) {
    if (isRunning) toggleStopwatch();
    currentSessionId = Date.now();
    titleInput.value = name;
    scores = { mistakes: 0, prompts: 0 };
    document.getElementById('mistakes').innerText = '0';
    document.getElementById('prompts').innerText = '0';
    resetStopwatchStateOnly();
    autoSave();
    if(document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function resetStopwatchStateOnly() {
    if (timerAnimationId) cancelAnimationFrame(timerAnimationId);
    isRunning = false;
    difference = 0;
    elapsedBeforePause = 0;
    display.innerHTML = '00:00:00<span class="ms">.00</span>';
    mainBtn.classList.remove('pause-state');
    mainBtn.classList.add('play-state');
    mainIcon.className = 'icon-mask start-icon';
    mainCard.classList.remove('running-glow', 'paused-glow');
}

function autoSave() {
    if (!currentSessionId) return;
    let title = titleInput.value.trim() !== '' ? titleInput.value.trim() : 'جلسة بدون عنوان';
    let timeText = display.innerHTML;

    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    let existingIndex = sessions.findIndex(s => s.id === currentSessionId);

    let sessionData = {
        id: currentSessionId,
        title: title,
        time: timeText,
        mistakes: scores.mistakes,
        prompts: scores.prompts,
        date: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    };

    if (existingIndex !== -1) {
        sessions[existingIndex] = sessionData;
    } else {
        sessions.unshift(sessionData);
    }
    localStorage.setItem('sard_sessions', JSON.stringify(sessions));
}

function handleTitleChange() {
    let val = titleInput.value.trim();
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    
    let isDuplicate = sessions.some(s => s.id !== currentSessionId && s.title === val);
    if (isDuplicate && val !== '') {
        let i = 1;
        let newval = `${val} (${i})`;
        while (sessions.some(s => s.id !== currentSessionId && s.title === newval)) {
            i++;
            newval = `${val} (${i})`;
        }
        titleInput.value = newval;
    }
    autoSave();
}

function runTimer() {
    if (!isRunning) return;
    
    let currentTime = Date.now();
    difference = elapsedBeforePause + (currentTime - startTime);

    let hours = Math.floor(difference / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);
    let milliseconds = Math.floor((difference % 1000) / 10); 

    let hStr = (hours < 10) ? "0" + hours : hours;
    let mStr = (minutes < 10) ? "0" + minutes : minutes;
    let sStr = (seconds < 10) ? "0" + seconds : seconds;
    let msStr = (milliseconds < 10) ? "0" + milliseconds : milliseconds;

    display.innerHTML = hStr + ':' + mStr + ':' + sStr + '<span class="ms">.' + msStr + '</span>';
    autoSave();

    if (document.getElementById('sidebar').classList.contains('active')) {
        let liveTimeEl = document.getElementById(`sidebar-time-${currentSessionId}`);
        if (liveTimeEl) {
            liveTimeEl.innerText = `${hStr}:${mStr}:${sStr}`;
        }
    }

    timerAnimationId = requestAnimationFrame(runTimer);
}

function toggleStopwatch() {
    animateButton(mainBtn);
    if (!isRunning) {
        isRunning = true;
        startTime = Date.now();
        timerAnimationId = requestAnimationFrame(runTimer);
        
        mainBtn.classList.remove('play-state');
        mainBtn.classList.add('pause-state');
        mainIcon.className = 'icon-mask stop-icon';
        
        mainCard.classList.remove('running-glow');
        mainCard.classList.add('running-glow');
    } else {
        isRunning = false;
        cancelAnimationFrame(timerAnimationId);
        elapsedBeforePause = difference;
        
        mainBtn.classList.remove('pause-state');
        mainBtn.classList.add('play-state');
        mainIcon.className = 'icon-mask start-icon';
        
        mainCard.classList.remove('running-glow');
        mainCard.classList.add('paused-glow');
    }
    autoSave();
    if (document.getElementById('sidebar').classList.contains('active')) {
        loadSessionsHistory();
    }
}

window.toggleStopwatch = toggleStopwatch;

function resetStopwatch() {
    animateButton(resetBtn);
    showCustomConfirm("تصفير العداد", "هل أنت متأكد من تصفير العداد؟ سيتم مسح الوقت الحالي.", true, () => {
        resetStopwatchStateOnly();
        autoSave();
        if (document.getElementById('sidebar').classList.contains('active')) {
            loadSessionsHistory();
        }
    });
}

function animateButton(btn) {
    btn.style.transform = "scale(0.85)";
    setTimeout(() => btn.style.transform = "scale(1)", 150);
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && event.target.tagName !== 'INPUT') {
        event.preventDefault(); 
        toggleStopwatch();
    }
    if (event.key.toLowerCase() === 'r' || event.key.toLowerCase() === 'ث') {
        if (event.target.tagName !== 'INPUT') {
            event.preventDefault();
            resetStopwatch();
        }
    }
});

function updateCounter(type, value) {
    scores[type] += value;
    if (scores[type] < 0) scores[type] = 0; 
    
    let el = document.getElementById(type);
    el.innerText = scores[type];
    
    el.style.transform = "scale(1.4)";
    setTimeout(() => el.style.transform = "scale(1)", 150);
    autoSave();
    if (document.getElementById('sidebar').classList.contains('active')) {
        loadSessionsHistory();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    if (sidebar.classList.contains('active')) {
        loadSessionsHistory();
    }
}

function loadSessionsHistory() {
    const container = document.getElementById('sessionsList');
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');

    if (sessions.length === 0) {
        container.innerHTML = '<div class="empty-history">لا توجد جلسات في السجل حتى الآن.</div>';
        return;
    }

    container.innerHTML = '';
    sessions.forEach(s => {
        const item = document.createElement('div');
        item.className = 'session-item';
        if(s.id === currentSessionId) {
            item.style.borderColor = 'var(--accent-cyan)';
            item.style.background = 'rgba(34, 211, 238, 0.08)';
        }

        let liveIndicator = (s.id === currentSessionId && isRunning) ? '<span class="live-dot" title="جاري السرد..."></span>' : '';
        let rawTime = s.time.split('<span')[0].trim();

        item.innerHTML = `
            <button class="del-session" onclick="event.stopPropagation(); confirmDeleteSession(${s.id})" title="حذف">
                <i class="icon-mask delete-icon"></i>
            </button>
            <div class="session-item-title">${s.title} ${liveIndicator}</div>
            <div class="session-item-details">
                <span>الزمن: <span id="sidebar-time-${s.id}">${rawTime}</span></span>
                <span style="color:var(--accent-red)">أخطاء: ${s.mistakes}</span>
                <span style="color:var(--accent-cyan)">تنبيهات: ${s.prompts}</span>
            </div>
            <div class="session-item-date">${s.date}</div>
        `;
        item.onclick = () => loadSession(s.id);
        container.appendChild(item);
    });
}

function confirmDeleteSession(id) {
    showCustomConfirm("حذف الجلسة", "هل أنت متأكد من رغبتك في حذف هذه الجلسة من السجل نهائياً؟", true, () => {
        deleteSession(id);
    });
}

function loadSession(id) {
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    let s = sessions.find(item => item.id === id);
    if (!s) return;

    if (isRunning) {
        toggleStopwatch();
    }

    currentSessionId = s.id;
    titleInput.value = s.title;
    scores.mistakes = s.mistakes;
    scores.prompts = s.prompts;
    document.getElementById('mistakes').innerText = scores.mistakes;
    document.getElementById('prompts').innerText = s.prompts;
    display.innerHTML = s.time;

    try {
        let timePart = s.time.split('<span')[0].trim();
        let parts = timePart.split(':');
        let h = parseInt(parts[0]) || 0;
        let m = parseInt(parts[1]) || 0;
        let sec = parseInt(parts[2]) || 0;
        difference = (h * 3600 + m * 60 + sec) * 1000;
        elapsedBeforePause = difference;
    } catch(e) {
        difference = 0;
        elapsedBeforePause = 0;
    }

    if(document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function deleteSession(id) {
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    sessions = sessions.filter(s => s.id !== id);
    localStorage.setItem('sard_sessions', JSON.stringify(sessions));
    if (id === currentSessionId) {
        if (sessions.length > 0) {
            loadSession(sessions[0].id);
        } else {
            createNewSession();
        }
    } else {
        loadSessionsHistory();
    }
}

function takeScreenshot() {
    const captureElement = document.getElementById('captureArea');
    
    // أيقونات SVG بمعايير صريحة (xmlns و width و height) لضمان رسمها بواسطة html2canvas
    const svgIcons = {
        'start-icon': `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="#4ade80"><path d="M8 5v14l11-7z"/></svg>`,
        'stop-icon': `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="#f43f5e"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
        'restart-icon': `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="#94a3b8"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
        'save-icon': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`,
        'history-icon': `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#22d3ee"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`,
        'add-icon': `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#22d3ee"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
        'delete-icon': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f43f5e"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
    };

    html2canvas(captureElement, {
        backgroundColor: document.body.classList.contains('light-mode') ? '#e4e9f0' : '#0b1120',
        scale: 2,
        onclone: (clonedDoc) => {
            const maskedIcons = clonedDoc.querySelectorAll('.icon-mask');
            maskedIcons.forEach(icon => {
                let svgContent = null;

                if (icon.id === 'mainIcon') {
                    if (icon.classList.contains('stop-icon')) {
                        svgContent = svgIcons['stop-icon'];
                    } else {
                        svgContent = svgIcons['start-icon'];
                    }
                } else {
                    for (const [className, svg] of Object.entries(svgIcons)) {
                        if (icon.classList.contains(className)) {
                            svgContent = svg;
                            break;
                        }
                    }
                }

                if (svgContent) {
                    icon.style.webkitMaskImage = 'none';
                    icon.style.maskImage = 'none';
                    icon.style.backgroundColor = 'transparent';
                    icon.style.display = 'inline-flex';
                    icon.style.alignItems = 'center';
                    icon.style.justifyContent = 'center';
                    icon.innerHTML = svgContent;
                }
            });
        }
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'sard-session-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}