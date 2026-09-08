// =========================================================
// AUTHENTICATION & LOGIN MANAGEMENT
// =========================================================
const AUTH_ACCOUNTS = [
    { username: 'admin',   password: 'p99l@2026', role: 'Administrator', displayName: 'Admin' },
    { username: 'mradmin', password: 'p99l@2026', role: 'Super Admin',   displayName: 'MrAdmin' },
    { username: 'viewer',  password: '123456',    role: 'Viewer Member', displayName: 'Viewer' }
];

function checkAuthStatus() {
    const sessionUserStr = localStorage.getItem('p99l_auth_session') || sessionStorage.getItem('p99l_auth_session');
    const overlay = document.getElementById('login-overlay');
    const mainApp = document.getElementById('main-app-container');

    if (sessionUserStr) {
        try {
            const userObj = JSON.parse(sessionUserStr);
            if (overlay) overlay.style.display = 'none';
            if (mainApp) mainApp.style.display = 'flex';
            const userEl = document.getElementById('logged-in-user');
            const roleEl = document.getElementById('user-role-text');
            if (userEl) userEl.innerText = userObj.displayName || userObj.username;
            if (roleEl) roleEl.innerText = userObj.role || 'User';
            return true;
        } catch (e) {
            localStorage.removeItem('p99l_auth_session');
            sessionStorage.removeItem('p99l_auth_session');
        }
    }

    if (overlay) overlay.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
    const uInput = document.getElementById('login-username');
    if (uInput) setTimeout(() => uInput.focus(), 100);
    return false;
}

function handleLoginSubmit(event) {
    if (event) event.preventDefault();
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error-msg');

    const username = (uInput?.value || '').trim().toLowerCase();
    const password = (pInput?.value || '').trim();

    const matched = AUTH_ACCOUNTS.find(acc => acc.username.toLowerCase() === username && acc.password === password);

    if (matched) {
        if (errorMsg) errorMsg.style.display = 'none';
        localStorage.setItem('p99l_auth_session', JSON.stringify({
            username: matched.username,
            displayName: matched.displayName,
            role: matched.role,
            loginTime: new Date().toISOString()
        }));

        if (pInput) pInput.value = '';
        checkAuthStatus();
    } else {
        if (errorMsg) {
            errorMsg.style.display = 'flex';
            errorMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ឈ្មោះអ្នកប្រើប្រាស់ ឬលេខសម្ងាត់មិនត្រឹមត្រូវឡើយ!`;
        }
    }
}

function logoutUser() {
    localStorage.removeItem('p99l_auth_session');
    sessionStorage.removeItem('p99l_auth_session');
    checkAuthStatus();
}

function togglePasswordVisibility() {
    const pInput = document.getElementById('login-password');
    const toggleIcon = document.getElementById('toggle-pw-visibility');
    if (!pInput || !toggleIcon) return;

    if (pInput.type === 'password') {
        pInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        pInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

let rawData = null;
let selectedDateKey = 'MONTH_AGGREGATE';
let selectedSuperSeniorKey = 'ALL';
let selectedLotteryType = 'ALL';
let dashSelectedLottery = 'ALL';
let currentLevelKey = 'member';
let activeCurrency = 'KHR';
let showActiveSalesOnly = false;

function onLotteryTypeChange(val) {
    selectedLotteryType = val;
    loadLevelData();
}

function onDashLotteryChange(val) {
    dashSelectedLottery = val;
    renderDashboardView();
}

let activeSettlements = [];
let filteredSettlements = [];
let combinedDailyChart = null;
let superSeniorList = [];

let currentPage = 1;
const pageSize = 25;

function formatNum(val) {
    if (val === undefined || val === null || val === 0) return '<span class="dimmed-zero">-</span>';
    if (typeof val === 'number') {
        const rounded = Math.round(val);
        if (rounded < 0) {
            return `<span class="text-red-bold">-${Math.abs(rounded).toLocaleString()}</span>`;
        }
        return rounded.toLocaleString();
    }
    return val;
}

function formatWinNum(val) {
    if (val === undefined || val === null || val === 0) return '<span class="dimmed-zero">-</span>';
    const rounded = Math.round(val);
    return `<span class="text-blue">${rounded.toLocaleString()}</span>`;
}

let reportSelectedDate = '26/08/2026';
let reportP3SelectedDate = '26/08/2026';
let reportSelectedSuperSenior = 'ALL';
let reportActiveCurrency = 'KHR';

function onReportFilterChange() {
    reportSelectedDate = document.getElementById('report-date-dropdown').value;
    reportSelectedSuperSenior = document.getElementById('report-supersenior-dropdown').value;
    renderReportView();
}

function onReportP3DateChange(val) {
    reportP3SelectedDate = val;
    renderReportView();
}

function setReportCurrency(curr) {
    reportActiveCurrency = curr;
    document.getElementById('btn-report-khr').classList.toggle('active', curr === 'KHR');
    document.getElementById('btn-report-usd').classList.toggle('active', curr === 'USD');
    renderReportView();
}

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
}

function showSection(sec, event) {
    if (event) event.preventDefault();
    if (history.replaceState) {
        history.replaceState(null, null, '#' + sec + '-section');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));

    const mobNav = document.getElementById('mob-nav-' + sec);
    if (mobNav) mobNav.classList.add('active');

    document.getElementById('dash-section').style.display = 'none';
    document.getElementById('report-section').style.display = 'none';
    const monthlySec = document.getElementById('monthly-report-section');
    if (monthlySec) monthlySec.style.display = 'none';
    const sangSec = document.getElementById('sang-report-section');
    if (sangSec) sangSec.style.display = 'none';
    document.getElementById('table-section').style.display = 'none';

    const mInfo = getActiveMonthInfo();
    const datesArr = rawData?.dates_available || [];
    const dateRangeStr = datesArr.length > 0 
        ? `${datesArr[datesArr.length - 1]} ដល់ ${datesArr[0]}` 
        : `01 ដល់ 05/09/2026`;

    if (sec === 'dash') {
        document.getElementById('dash-section').style.display = 'block';
        document.getElementById('nav-dash').classList.add('active');
        document.getElementById('header-main-title').innerText = `P99L Dashboard - សរុបស៊ីខាតប្រចាំថ្ងៃ (${mInfo.mUpper} ${mInfo.yStr})`;
        document.getElementById('header-sub-title').innerText = `គំនូសតាង (Chart by Date) និង តារាងសរុបស៊ីខាតប្រចាំថ្ងៃ (${dateRangeStr})`;
        renderDashboardView();
    } else if (sec === 'report') {
        document.getElementById('report-section').style.display = 'block';
        document.getElementById('nav-report').classList.add('active');
        document.getElementById('header-main-title').innerText = `របាយការណ៍សង្ខេបតាមប្រភេទឆ្នោត (Report View - ${mInfo.mKh} ${mInfo.yStr})`;
        document.getElementById('header-sub-title').innerText = 'ផ្ទាំងទី ១ (ប្រចាំថ្ងៃ) និង ផ្ទាំងទី ២ (របាយការណ៍សរុបពីថ្ងៃ 01 ដល់ថ្ងៃជ្រើសរើស)';
        renderReportView();
    } else if (sec === 'monthly-report') {
        if (monthlySec) monthlySec.style.display = 'block';
        const navMonthly = document.getElementById('nav-monthly-report');
        if (navMonthly) navMonthly.classList.add('active');
        document.getElementById('header-main-title').innerText = `តារាងស៊ីខាតសរុបប្រចាំខែ 100% (Monthly Net Win/Loss Report - ${mInfo.mKh} ${mInfo.yStr})`;
        document.getElementById('header-sub-title').innerText = `របាយការណ៍ស៊ីខាតតាម SuperSenior នីមួយៗ បំបែកតាមប្រភេទឆ្នោតទាំង ៨ (${mInfo.mUpper} ${mInfo.yStr})`;
        renderMonthlyReportView();
    } else if (sec === 'sang-report') {
        if (sangSec) sangSec.style.display = 'block';
        const navSang = document.getElementById('nav-sang-report');
        if (navSang) navSang.classList.add('active');
        document.getElementById('header-main-title').innerText = `📋 របាយការណ៍សាង (Sang Report) - Super Senior (${mInfo.mKh} ${mInfo.yStr})`;
        document.getElementById('header-sub-title').innerText = `របាយការណ៍សរុបរួម សាង ចេញផ្ទាល់ពី System P99L (admin.p99l.com)`;
        renderSangReportView();
    } else {
        document.getElementById('table-section').style.display = 'block';
        document.getElementById('nav-table').classList.add('active');
        document.getElementById('header-main-title').innerText = `របាយការណ៍សរុបរួម System Data (ខែ ${mInfo.mKh} ${mInfo.yStr})`;
        document.getElementById('header-sub-title').innerText = `ទិន្នន័យដើមដែលបាន Copy ផ្ទាល់ចេញពី System P99L ( ${dateRangeStr} )`;
        renderTable();
    }
}

// Fetch & Initialize Data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        checkAuthStatus();

        const response = await fetch('total_summary_report.json');
        rawData = await response.json();

        initSuperSeniorFilter();
        initDateSelector();
        initReportFilters();
        initMonthlyFilters();
        loadLevelData();

        const hash = window.location.hash.replace('#', '').replace('-section', '');
        if (hash === 'monthly-report' || hash === 'monthly') {
            showSection('monthly-report');
        } else if (hash === 'sang-report' || hash === 'sang') {
            showSection('sang-report');
        } else if (hash === 'table') {
            showSection('table');
        } else if (hash === 'dash') {
            showSection('dash');
        } else {
            showSection('report');
        }

        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace('#', '').replace('-section', '');
            if (h === 'dash') showSection('dash');
            else if (h === 'report') showSection('report');
            else if (h === 'monthly-report' || h === 'monthly') showSection('monthly-report');
            else if (h === 'sang-report' || h === 'sang') showSection('sang-report');
            else if (h === 'table') showSection('table');
        });

        // Search Listener
        document.getElementById('global-search').addEventListener('input', (e) => {
            applyFilters();
        });

    } catch (err) {
        console.error('Error loading report JSON:', err);
    }
});

function initSuperSeniorFilter() {
    const ssDropdown = document.getElementById('supersenior-dropdown');
    const ssDatalist = document.getElementById('supersenior-datalist');
    const quickPills = document.getElementById('quick-ss-pills');

    ssDropdown.innerHTML = '<option value="ALL">👑 SuperSenior ទាំងអស់ (All)</option>';
    ssDatalist.innerHTML = '<option value="ALL (SuperSenior ទាំងអស់)"></option>';
    quickPills.innerHTML = '';

    const reportsObj = rawData.reports || {};
    const ssMap = new Map();

    Object.values(reportsObj).forEach(rep => {
        const supData = rep.super_senior || {};
        const sett = supData.settlements || [];
        sett.forEach(item => {
            if (item.username) {
                ssMap.set(item.username, item.nickname || item.username);
            }
        });
    });

    superSeniorList = [];
    const sortedUsernames = Array.from(ssMap.keys()).sort();

    const pillAll = document.createElement('button');
    pillAll.className = 'ss-pill active';
    pillAll.dataset.ss = 'ALL';
    pillAll.innerText = 'ALL (ទាំងអស់)';
    pillAll.onclick = () => selectSuperSenior('ALL');
    quickPills.appendChild(pillAll);

    sortedUsernames.forEach(u => {
        const nick = ssMap.get(u);
        const label = `${u} - ${nick}`;
        superSeniorList.push({ username: u, nickname: nick, label: label });

        const opt = document.createElement('option');
        opt.value = u;
        opt.innerText = `👑 ${u} (${nick})`;
        ssDropdown.appendChild(opt);

        const optData = document.createElement('option');
        optData.value = `${u} - ${nick}`;
        ssDatalist.appendChild(optData);
    });

    sortedUsernames.slice(0, 6).forEach(u => {
        const nick = ssMap.get(u);
        const btn = document.createElement('button');
        btn.className = 'ss-pill';
        btn.dataset.ss = u;
        btn.innerText = `${u} (${nick})`;
        btn.onclick = () => selectSuperSenior(u);
        quickPills.appendChild(btn);
    });
}

function onSuperSeniorAutoSelectInput(val) {
    const query = val.toLowerCase().trim();
    
    if (!query || query.includes('all') || query.includes('ទាំងអស់')) {
        selectSuperSenior('ALL', false);
        return;
    }

    const matched = superSeniorList.find(item => 
        item.username.toLowerCase() === query ||
        item.nickname.toLowerCase() === query ||
        item.label.toLowerCase() === query ||
        item.label.toLowerCase().includes(query)
    );

    if (matched) {
        selectSuperSenior(matched.username, false);
    }
}

function onSuperSeniorFilterChange(ssVal) {
    selectSuperSenior(ssVal, true);
}

function selectSuperSenior(ssVal, updateInputText = true) {
    selectedSuperSeniorKey = ssVal;
    
    const ssDropdown = document.getElementById('supersenior-dropdown');
    const ssInput = document.getElementById('supersenior-auto-input');
    const statusText = document.getElementById('supersenior-status-text');

    ssDropdown.value = ssVal;

    if (updateInputText) {
        if (ssVal === 'ALL') {
            ssInput.value = '';
        } else {
            const item = superSeniorList.find(s => s.username === ssVal);
            if (item) ssInput.value = item.label;
            else ssInput.value = ssVal;
        }
    }

    document.querySelectorAll('#quick-ss-pills .ss-pill').forEach(b => {
        if (b.dataset.ss === ssVal) b.classList.add('active');
        else b.classList.remove('active');
    });

    if (ssVal === 'ALL') {
        statusText.innerText = 'បង្ហាញទិន្នន័យ៖ SuperSenior ទាំងអស់';
    } else {
        const item = superSeniorList.find(s => s.username === ssVal);
        const nick = item ? item.nickname : ssVal;
        statusText.innerText = `បង្ហាញទិន្នន័យ៖ SuperSenior "${ssVal}" (${nick})`;
    }

    renderDashboardView();
}

function initDateSelector() {
    const datesArr = rawData.dates_available || [];
    const dateDropdown = document.getElementById('date-dropdown');

    dateDropdown.innerHTML = '';

    if (datesArr.length === 0) {
        datesArr.push(rawData.date || '25/08/2026');
    }

    const optMonthly = document.createElement('option');
    optMonthly.value = 'MONTH_AGGREGATE';
    optMonthly.innerText = '📊 សរុបប្រចាំខែ (សរុបនីមួយៗរៀងៗខ្លួន - Monthly Total)';
    dateDropdown.appendChild(optMonthly);

    const optAllDays = document.createElement('option');
    optAllDays.value = 'ALL_ROWS';
    optAllDays.innerText = '📑 គ្រប់ថ្ងៃទាំងអស់ (ទិន្នន័យរាយថ្ងៃទាំងអស់)';
    dateDropdown.appendChild(optAllDays);

    datesArr.forEach(dStr => {
        const opt = document.createElement('option');
        opt.value = dStr;
        opt.innerText = `📅 ថ្ងៃ ${dStr}`;
        dateDropdown.appendChild(opt);
    });

    selectedDateKey = 'MONTH_AGGREGATE';
    dateDropdown.value = selectedDateKey;
}

function onDateDropdownChange(dVal) {
    selectedDateKey = dVal;
    loadLevelData();
}

function onActiveSalesToggle(checked) {
    showActiveSalesOnly = checked;
    applyFilters();
}

function switchLevelTab(levelKey) {
    currentLevelKey = levelKey;
    document.querySelectorAll('.level-tab').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    loadLevelData();
}

function loadLevelData() {
    activeSettlements = [];
    if (!rawData) return;

    const reportsObj = rawData.reports || {};
    const sortedDates = (rawData.dates_available || Object.keys(reportsObj)).slice(); // Latest to earliest
    const chronologicalDates = sortedDates.slice().reverse(); // Earliest to latest

    if (selectedDateKey === 'MONTH_AGGREGATE') {
        // AGGREGATE BY EACH INDIVIDUAL ACCOUNT ACROSS ALL DATES
        const accountMap = new Map();

        chronologicalDates.forEach((dKey, dIdx) => {
            const repData = reportsObj[dKey] || {};
            const lvlObj = repData[currentLevelKey] || {};
            const sett = lvlObj.settlements || [];

            sett.forEach(item => {
                const uKey = item.username || item.userCode || 'UNKNOWN';
                
                if (!accountMap.has(uKey)) {
                    accountMap.set(uKey, {
                        _displayDate: 'ខែសីហា (សរុប)',
                        username: item.username || '',
                        nickname: item.nickname || '',
                        userCode: item.userCode || '',
                        betAmount1DKhr: 0, betAmount2DKhr: 0, betAmount3DKhr: 0, betAmount4DKhr: 0, betAmount5DKhr: 0,
                        betAmount1DUsd: 0, betAmount2DUsd: 0, betAmount3DUsd: 0, betAmount4DUsd: 0, betAmount5DUsd: 0,
                        winAmount1DKhr: 0, winAmount2DKhr: 0, winAmount3DKhr: 0, winAmount4DKhr: 0, winAmount5DKhr: 0,
                        winAmount1DUsd: 0, winAmount2DUsd: 0, winAmount3DUsd: 0, winAmount4DUsd: 0, winAmount5DUsd: 0,
                        winLoseAmountKhr: 0,
                        winLoseAmountUsd: 0,
                        oldAmountKhr: item.oldAmountKhr || 0, // initial old amount from earliest day
                        oldAmountUsd: item.oldAmountUsd || 0,
                        borrow: { amountKhr: 0, amountUsd: 0 },
                        give: { amountKhr: 0, amountUsd: 0 },
                        protestAmount: { amountKhr: 0, amountUsd: 0 },
                        totalAmountKhr: item.totalAmountKhr || 0,
                        totalAmountUsd: item.totalAmountUsd || 0
                    });
                }

                const acc = accountMap.get(uKey);
                if (item.nickname && !acc.nickname) acc.nickname = item.nickname;

                // Sum all sales
                acc.betAmount1DKhr += (item.betAmount1DKhr || 0);
                acc.betAmount2DKhr += (item.betAmount2DKhr || 0);
                acc.betAmount3DKhr += (item.betAmount3DKhr || 0);
                acc.betAmount4DKhr += (item.betAmount4DKhr || 0);
                acc.betAmount5DKhr += (item.betAmount5DKhr || 0);

                acc.betAmount1DUsd += (item.betAmount1DUsd || 0);
                acc.betAmount2DUsd += (item.betAmount2DUsd || 0);
                acc.betAmount3DUsd += (item.betAmount3DUsd || 0);
                acc.betAmount4DUsd += (item.betAmount4DUsd || 0);
                acc.betAmount5DUsd += (item.betAmount5DUsd || 0);

                // Sum all wins
                acc.winAmount1DKhr += (item.winAmount1DKhr || 0);
                acc.winAmount2DKhr += (item.winAmount2DKhr || 0);
                acc.winAmount3DKhr += (item.winAmount3DKhr || 0);
                acc.winAmount4DKhr += (item.winAmount4DKhr || 0);
                acc.winAmount5DKhr += (item.winAmount5DKhr || 0);

                acc.winAmount1DUsd += (item.winAmount1DUsd || 0);
                acc.winAmount2DUsd += (item.winAmount2DUsd || 0);
                acc.winAmount3DUsd += (item.winAmount3DUsd || 0);
                acc.winAmount4DUsd += (item.winAmount4DUsd || 0);
                acc.winAmount5DUsd += (item.winAmount5DUsd || 0);

                // Sum Net Win/Loss
                acc.winLoseAmountKhr += (item.winLoseAmountKhr || 0);
                acc.winLoseAmountUsd += (item.winLoseAmountUsd || 0);

                // Sum Loans & Protests
                acc.borrow.amountKhr += (item.borrow?.amountKhr || 0);
                acc.give.amountKhr += (item.give?.amountKhr || 0);
                acc.borrow.amountUsd += (item.borrow?.amountUsd || 0);
                acc.give.amountUsd += (item.give?.amountUsd || 0);
                acc.protestAmount.amountKhr += (item.protestAmount?.amountKhr || 0);
                acc.protestAmount.amountUsd += (item.protestAmount?.amountUsd || 0);

                // Latest final balance
                acc.totalAmountKhr = item.totalAmountKhr || 0;
                acc.totalAmountUsd = item.totalAmountUsd || 0;
            });
        });

        activeSettlements = Array.from(accountMap.values());

        // Sort accounts with highest sales first
        activeSettlements.sort((a, b) => {
            const totA = (a.betAmount1DKhr+a.betAmount2DKhr+a.betAmount3DKhr+a.betAmount4DKhr) + (a.betAmount1DUsd+a.betAmount2DUsd+a.betAmount3DUsd+a.betAmount4DUsd)*4000;
            const totB = (b.betAmount1DKhr+b.betAmount2DKhr+b.betAmount3DKhr+b.betAmount4DKhr) + (b.betAmount1DUsd+b.betAmount2DUsd+b.betAmount3DUsd+b.betAmount4DUsd)*4000;
            return totB - totA;
        });

    } else if (selectedDateKey === 'ALL_ROWS') {
        sortedDates.forEach(dKey => {
            const repData = reportsObj[dKey] || {};
            const lvlObj = repData[currentLevelKey] || {};
            const sett = lvlObj.settlements || [];
            sett.forEach(item => {
                activeSettlements.push({ ...item, _displayDate: dKey });
            });
        });
    } else {
        const repData = reportsObj[selectedDateKey] || {};
        const lvlObj = repData[currentLevelKey] || {};
        const sett = lvlObj.settlements || [];
        sett.forEach(item => {
            activeSettlements.push({ ...item, _displayDate: selectedDateKey });
        });
    }

    applyFilters();
}

function applyFilters() {
    const query = document.getElementById('global-search').value.toLowerCase().trim();
    
    filteredSettlements = activeSettlements.filter(item => {
        const matchesSearch = !query || 
            (item.username && item.username.toLowerCase().includes(query)) ||
            (item.nickname && item.nickname.toLowerCase().includes(query)) ||
            (item.userCode && item.userCode.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        if (showActiveSalesOnly) {
            const totSalesKhr = (item.betAmount1DKhr||0) + (item.betAmount2DKhr||0) + (item.betAmount3DKhr||0) + (item.betAmount4DKhr||0) + (item.betAmount5DKhr||0);
            const totSalesUsd = (item.betAmount1DUsd||0) + (item.betAmount2DUsd||0) + (item.betAmount3DUsd||0) + (item.betAmount4DUsd||0) + (item.betAmount5DUsd||0);
            if (totSalesKhr === 0 && totSalesUsd === 0) return false;
        }

        return true;
    });

    currentPage = 1;
    renderTable();
}

// Render Dashboard View: Daily Net Summary Table & 2-Bars Per Day Grouped Chart
let lotteryDonutChart = null;
let leaderboardMode = 'sales'; // 'sales' or 'net'

function setLeaderboardMode(mode) {
    leaderboardMode = mode;
    const btnSales = document.getElementById('btn-lb-sales');
    const btnNet = document.getElementById('btn-lb-net');
    if (btnSales) btnSales.classList.toggle('active', mode === 'sales');
    if (btnNet) btnNet.classList.toggle('active', mode === 'net');
    renderLeaderboardWidget();
}

function renderDashboardView() {
    if (!rawData) return;

    const reportsObj = rawData.reports || {};
    const datesArr = (rawData.dates_available || Object.keys(reportsObj)).slice().reverse(); // Chronological: 01/09 -> 07/09

    let monthTotSalesKhr = 0, monthTotSalesUsd = 0;
    let monthTotNetKhr = 0, monthTotNetUsd = 0;
    let sangTotKhr = 0, sangTotUsd = 0;

    const dailySummaryChronological = [];

    datesArr.forEach(dStr => {
        const repData = reportsObj[dStr] || {};
        let bKhr = 0, bUsd = 0, netKhr = 0, netUsd = 0;

        if (dashSelectedLottery === 'ALL') {
            if (selectedSuperSeniorKey === 'ALL') {
                const memberData = repData.member || {};
                const summery = memberData.summery || {};

                bKhr = (summery.betAmount1DKhr||0) + (summery.betAmount2DKhr||0) + (summery.betAmount3DKhr||0) + (summery.betAmount4DKhr||0) + (summery.betAmount5DKhr||0);
                bUsd = (summery.betAmount1DUsd||0) + (summery.betAmount2DUsd||0) + (summery.betAmount3DUsd||0) + (summery.betAmount4DUsd||0) + (summery.betAmount5DUsd||0);

                netKhr = summery.winLoseAmountKhr || 0;
                netUsd = summery.winLoseAmountUsd || 0;

                const sangSumm = repData.super_senior_sang?.summery || {};
                sangTotKhr += (sangSumm.winLoseAmountKhr || 0);
                sangTotUsd += (sangSumm.winLoseAmountUsd || 0);
            } else {
                const supData = repData.super_senior || {};
                const sett = supData.settlements || [];
                const targetItem = sett.find(item => item.username === selectedSuperSeniorKey || item.nickname === selectedSuperSeniorKey);
                if (targetItem) {
                    bKhr = (targetItem.betAmount1DKhr||0) + (targetItem.betAmount2DKhr||0) + (targetItem.betAmount3DKhr||0) + (targetItem.betAmount4DKhr||0) + (targetItem.betAmount5DKhr||0);
                    bUsd = (targetItem.betAmount1DUsd||0) + (targetItem.betAmount2DUsd||0) + (targetItem.betAmount3DUsd||0) + (targetItem.betAmount4DUsd||0) + (targetItem.betAmount5DUsd||0);

                    netKhr = targetItem.winLoseAmountKhr || 0;
                    netUsd = targetItem.winLoseAmountUsd || 0;
                }

                const sangSett = repData.super_senior_sang?.settlements || [];
                const targetSang = sangSett.find(item => item.username === selectedSuperSeniorKey || item.nickname === selectedSuperSeniorKey);
                if (targetSang) {
                    sangTotKhr += (targetSang.winLoseAmountKhr || 0);
                    sangTotUsd += (targetSang.winLoseAmountUsd || 0);
                }
            }
        } else {
            // Specific Lottery Selected (MHSB, MC, MT, KH, TC, SC, TH, KP)
            if (selectedSuperSeniorKey === 'ALL') {
                const lotSummary = repData.lottery_sales_summary || {};
                const lotObj = lotSummary[dashSelectedLottery] || {};

                bKhr = lotObj.sales_khr || 0;
                bUsd = lotObj.sales_usd || 0;
                netKhr = lotObj.net_khr || 0;
                netUsd = lotObj.net_usd || 0;
            } else {
                const ssLots = (repData.super_senior_lotteries || {})[dashSelectedLottery] || {};
                const targetObj = ssLots[selectedSuperSeniorKey] || {};

                bKhr = targetObj.sales_khr || 0;
                bUsd = targetObj.sales_usd || 0;
                netKhr = targetObj.net_khr || 0;
                netUsd = targetObj.net_usd || 0;
            }
        }

        monthTotSalesKhr += bKhr;
        monthTotSalesUsd += bUsd;
        monthTotNetKhr += netKhr;
        monthTotNetUsd += netUsd;

        dailySummaryChronological.push({
            dateStr: dStr,
            bKhr, bUsd,
            netKhr, netUsd
        });
    });

    // 1. KPI 1: Net Win/Loss
    const elNetKhr = document.getElementById('dash-month-net-khr');
    const elNetUsd = document.getElementById('dash-month-net-usd');
    const elDailyAvg = document.getElementById('dash-daily-avg-badge');

    if (elNetKhr) {
        elNetKhr.innerText = `${Math.round(monthTotNetKhr).toLocaleString()} ៛`;
        elNetKhr.style.color = monthTotNetKhr < 0 ? '#dc2626' : (monthTotNetKhr > 0 ? '#16a34a' : '#0f172a');
    }
    if (elNetUsd) elNetUsd.innerText = `USD: $${monthTotNetUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    const dailyAvgKhr = datesArr.length > 0 ? Math.round(monthTotNetKhr / datesArr.length) : 0;
    if (elDailyAvg) {
        elDailyAvg.className = `sub-badge-chip ${dailyAvgKhr >= 0 ? 'pos' : 'neg'}`;
        elDailyAvg.innerHTML = `<i class="fa-solid fa-chart-line"></i> មធ្យម: ${dailyAvgKhr >= 0 ? '+' : ''}${(dailyAvgKhr / 1000000).toFixed(1)}M ៛/ថ្ងៃ`;
    }

    // 2. KPI 2: Total Sales
    const elSalesKhr = document.getElementById('dash-month-sales-khr');
    const elSalesUsd = document.getElementById('dash-month-sales-usd');
    const elSalesDays = document.getElementById('dash-sales-days-badge');

    if (elSalesKhr) elSalesKhr.innerText = `${Math.round(monthTotSalesKhr).toLocaleString()} ៛`;
    if (elSalesUsd) elSalesUsd.innerText = `USD: $${monthTotSalesUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if (elSalesDays) elSalesDays.innerHTML = `<i class="fa-solid fa-calendar-check"></i> សរុប ${datesArr.length} ថ្ងៃ`;

    // 3. KPI 3: Profit Margin % & Peak Day
    let peakBestDay = null;
    let peakWorstDay = null;
    if (dailySummaryChronological.length > 0) {
        peakBestDay = dailySummaryChronological.reduce((max, cur) => cur.netKhr > max.netKhr ? cur : max, dailySummaryChronological[0]);
        peakWorstDay = dailySummaryChronological.reduce((min, cur) => cur.netKhr < min.netKhr ? cur : min, dailySummaryChronological[0]);
    }

    const profitMargin = monthTotSalesKhr > 0 ? (monthTotNetKhr / monthTotSalesKhr) * 100 : 0;
    const elMargin = document.getElementById('dash-profit-margin-rate');
    const elPeakDay = document.getElementById('dash-peak-day-badge');

    if (elMargin) {
        elMargin.innerText = `${profitMargin >= 0 ? '+' : ''}${profitMargin.toFixed(2)}%`;
        elMargin.style.color = profitMargin >= 0 ? '#16a34a' : '#dc2626';
    }
    if (elPeakDay) {
        if (peakBestDay && peakBestDay.netKhr > 0) {
            elPeakDay.innerHTML = `<i class="fa-solid fa-trophy"></i> ថ្ងៃចំណេញខ្ពស់: ${peakBestDay.dateStr.slice(0, 5)}`;
        } else {
            elPeakDay.innerHTML = `<i class="fa-solid fa-calendar-day"></i> ស្ថិរភាព`;
        }
    }

    // 4. KPI 4: Sang Settlement (គុណនឹង -1)
    const sangDeductedKhr = -1 * sangTotKhr;
    const sangDeductedUsd = -1 * sangTotUsd;
    const elSangKhr = document.getElementById('dash-sang-total-khr');
    const elSangUsd = document.getElementById('dash-sang-total-usd');

    if (elSangKhr) {
        elSangKhr.innerText = `${sangDeductedKhr >= 0 ? '+' : ''}${Math.round(sangDeductedKhr).toLocaleString()} ៛`;
        elSangKhr.style.color = sangDeductedKhr < 0 ? '#dc2626' : (sangDeductedKhr > 0 ? '#16a34a' : '#64748b');
    }
    if (elSangUsd) {
        elSangUsd.innerText = `USD: $${sangDeductedUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }

    // Render 2-Column Analytics Charts
    renderCombinedChart(dailySummaryChronological);
    renderLotteryDonutChart();

    // Render Top 5 SuperSenior Leaderboard
    renderLeaderboardWidget();

    // Render Enhanced Daily Table
    renderDailySummaryTable(dailySummaryChronological, peakBestDay, peakWorstDay);
}

function setChartCurrency(curr) {
    activeCurrency = curr;
    document.getElementById('btn-chart-khr').classList.toggle('active', curr === 'KHR');
    document.getElementById('btn-chart-usd').classList.toggle('active', curr === 'USD');
    renderDashboardView();
}

// 2-Bars Per Day Grouped Bar Chart (Bar 1: លុយលក់ | Bar 2: ស៊ីខាត)
function renderCombinedChart(dailySummaryList) {
    const canvas = document.getElementById('combinedDailyChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = dailySummaryList.map(item => item.dateStr.slice(0, 5));
    const salesData = dailySummaryList.map(item => activeCurrency === 'KHR' ? item.bKhr : item.bUsd);
    const netData = dailySummaryList.map(item => activeCurrency === 'KHR' ? item.netKhr : item.netUsd);

    const netBackgroundColors = netData.map(v => v >= 0 ? 'rgba(22, 163, 74, 0.88)' : 'rgba(220, 38, 38, 0.88)');
    const netBorderColors = netData.map(v => v >= 0 ? '#15803d' : '#b91c1c');

    if (combinedDailyChart) combinedDailyChart.destroy();

    combinedDailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `លុយលក់ (${activeCurrency})`,
                    data: salesData,
                    backgroundColor: 'rgba(99, 102, 241, 0.85)',
                    borderColor: '#4f46e5',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.82,
                    categoryPercentage: 0.78
                },
                {
                    label: `ស៊ីខាត (${activeCurrency})`,
                    data: netData,
                    backgroundColor: netBackgroundColors,
                    borderColor: netBorderColors,
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.82,
                    categoryPercentage: 0.78
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    titleFont: { family: "'Outfit', 'Kantumruy Pro', sans-serif", size: 13, weight: '700' },
                    bodyFont: { family: "'Outfit', 'Kantumruy Pro', sans-serif", size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw || 0;
                            const labelName = context.dataset.label || '';
                            const prefix = activeCurrency === 'KHR' ? '' : '$';
                            const suffix = activeCurrency === 'KHR' ? ' ៛' : '';
                            return ` ${labelName}: ${prefix}${Math.round(val).toLocaleString()}${suffix}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "'Outfit', 'Kantumruy Pro', sans-serif", size: 11, weight: '600' }, color: '#475569' }
                },
                y: {
                    grid: { color: 'rgba(226, 232, 240, 0.6)' },
                    ticks: {
                        font: { family: "'Outfit', sans-serif", size: 11 },
                        color: '#64748b',
                        callback: function(value) {
                            if (activeCurrency === 'KHR') {
                                return (value / 1000000).toFixed(1) + 'M ៛';
                            } else {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        }
    });
}

// 8-Lottery Share Donut Chart
const LOTTERY_BRAND_COLORS = {
    'TC':   { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.9)' },
    'MC':   { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.9)' },
    'KH':   { color: '#10b981', bg: 'rgba(16, 185, 129, 0.9)' },
    'MT':   { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.9)' },
    'MHSB': { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.9)' },
    'KP':   { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.9)' },
    'SC':   { color: '#64748b', bg: 'rgba(100, 116, 139, 0.9)' },
    'TH':   { color: '#f97316', bg: 'rgba(249, 115, 22, 0.9)' }
};

function renderLotteryDonutChart() {
    const canvas = document.getElementById('lotteryDonutChart');
    const legendContainer = document.getElementById('donut-custom-legend');
    if (!canvas || !rawData) return;
    const ctx = canvas.getContext('2d');

    const reportsObj = rawData.reports || {};
    const datesArr = rawData.dates_available || Object.keys(reportsObj);
    const isKhr = activeCurrency === 'KHR';

    const lotteryTotals = {};
    OFFICIAL_LOTTERIES.forEach(l => { lotteryTotals[l.code] = { sales: 0, net: 0, name: l.name }; });

    let grandSales = 0;

    datesArr.forEach(dStr => {
        const rep = reportsObj[dStr] || {};
        OFFICIAL_LOTTERIES.forEach(lot => {
            let lObj = {};
            if (selectedSuperSeniorKey === 'ALL') {
                lObj = (rep.lottery_sales_summary || {})[lot.code] || {};
            } else {
                const ssMap = (rep.super_senior_lotteries || {})[lot.code] || {};
                lObj = ssMap[selectedSuperSeniorKey] || {};
            }

            const sVal = isKhr ? (lObj.sales_khr || 0) : (lObj.sales_usd || 0);
            const nVal = isKhr ? (lObj.net_khr || 0) : (lObj.net_usd || 0);

            lotteryTotals[lot.code].sales += sVal;
            lotteryTotals[lot.code].net += nVal;
            grandSales += sVal;
        });
    });

    const activeLots = OFFICIAL_LOTTERIES.filter(l => lotteryTotals[l.code].sales > 0);
    const chartLots = activeLots.length > 0 ? activeLots : OFFICIAL_LOTTERIES;

    const labels = chartLots.map(l => l.name);
    const dataVals = chartLots.map(l => lotteryTotals[l.code].sales);
    const bgColors = chartLots.map(l => (LOTTERY_BRAND_COLORS[l.code] || {}).bg || '#94a3b8');
    const borderColors = chartLots.map(l => (LOTTERY_BRAND_COLORS[l.code] || {}).color || '#64748b');

    if (lotteryDonutChart) lotteryDonutChart.destroy();

    lotteryDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataVals,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw || 0;
                            const pct = grandSales > 0 ? ((val / grandSales) * 100).toFixed(1) : 0;
                            const suffix = isKhr ? ' ៛' : '';
                            const prefix = isKhr ? '' : '$';
                            return ` ${context.label}: ${prefix}${Math.round(val).toLocaleString()}${suffix} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // Custom Legend Below
    if (legendContainer) {
        legendContainer.innerHTML = '';
        chartLots.forEach(lot => {
            const sVal = lotteryTotals[lot.code].sales;
            const pct = grandSales > 0 ? ((sVal / grandSales) * 100).toFixed(1) : '0.0';
            const bColor = (LOTTERY_BRAND_COLORS[lot.code] || {}).color || '#64748b';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'donut-legend-item';
            itemDiv.innerHTML = `
                <div class="donut-legend-left">
                    <span class="donut-legend-dot" style="background: ${bColor};"></span>
                    <span>${lot.name} (${lot.code})</span>
                </div>
                <div style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #1e293b;">
                    <span>${pct}%</span>
                    <span style="color: #64748b; font-size: 0.78rem; margin-left: 6px;">${isKhr ? (sVal/1000000).toFixed(1)+'M ៛' : '$'+(sVal/1000).toFixed(1)+'k'}</span>
                </div>
            `;
            legendContainer.appendChild(itemDiv);
        });
    }
}

// Top 5 SuperSenior Leaderboard Widget
function renderLeaderboardWidget() {
    const container = document.getElementById('dash-leaderboard-items');
    if (!container || !rawData) return;
    container.innerHTML = '';

    const reportsObj = rawData.reports || {};
    const datesArr = rawData.dates_available || Object.keys(reportsObj);
    const isKhr = activeCurrency === 'KHR';

    const ssAggregateMap = new Map();

    datesArr.forEach(dStr => {
        const rep = reportsObj[dStr] || {};
        const supData = rep.super_senior || {};
        const sett = supData.settlements || [];

        sett.forEach(item => {
            const u = item.username || item.userCode;
            if (!u) return;

            if (!ssAggregateMap.has(u)) {
                ssAggregateMap.set(u, {
                    username: u,
                    nickname: item.nickname || u,
                    salesKhr: 0,
                    salesUsd: 0,
                    netKhr: 0,
                    netUsd: 0
                });
            }

            const rec = ssAggregateMap.get(u);
            const bK = (item.betAmount1DKhr||0) + (item.betAmount2DKhr||0) + (item.betAmount3DKhr||0) + (item.betAmount4DKhr||0) + (item.betAmount5DKhr||0);
            const bU = (item.betAmount1DUsd||0) + (item.betAmount2DUsd||0) + (item.betAmount3DUsd||0) + (item.betAmount4DUsd||0) + (item.betAmount5DUsd||0);

            rec.salesKhr += bK;
            rec.salesUsd += bU;
            rec.netKhr += (item.winLoseAmountKhr || 0);
            rec.netUsd += (item.winLoseAmountUsd || 0);
        });
    });

    const list = Array.from(ssAggregateMap.values());
    if (leaderboardMode === 'sales') {
        list.sort((a, b) => (isKhr ? (b.salesKhr - a.salesKhr) : (b.salesUsd - a.salesUsd)));
    } else {
        list.sort((a, b) => (isKhr ? (b.netKhr - a.netKhr) : (b.netUsd - a.netUsd)));
    }

    const top5 = list.slice(0, 5);
    const maxVal = top5.length > 0 ? (leaderboardMode === 'sales' ? (isKhr ? top5[0].salesKhr : top5[0].salesUsd) : (isKhr ? Math.abs(top5[0].netKhr) : Math.abs(top5[0].netUsd))) : 1;

    top5.forEach((item, idx) => {
        const rank = idx + 1;
        let rankClass = 'rank-normal';
        let medalIcon = rank;
        if (rank === 1) { rankClass = 'rank-gold'; medalIcon = '🥇 1'; }
        else if (rank === 2) { rankClass = 'rank-silver'; medalIcon = '🥈 2'; }
        else if (rank === 3) { rankClass = 'rank-bronze'; medalIcon = '🥉 3'; }

        const sVal = isKhr ? item.salesKhr : item.salesUsd;
        const nVal = isKhr ? item.netKhr : item.netUsd;
        const targetCompareVal = leaderboardMode === 'sales' ? sVal : Math.abs(nVal);
        const progressPct = maxVal > 0 ? Math.min(100, Math.max(8, (targetCompareVal / maxVal) * 100)) : 0;

        const isCurrentSelected = selectedSuperSeniorKey === item.username;

        const card = document.createElement('div');
        card.className = 'leaderboard-card-item';
        if (isCurrentSelected) {
            card.style.borderColor = '#2e7d32';
            card.style.background = '#f0fdf4';
        }

        card.onclick = () => {
            selectSuperSenior(item.username);
        };

        const valFormatted = isKhr 
            ? `${(sVal / 1000000).toFixed(1)}M ៛` 
            : `$${(sVal / 1000).toFixed(1)}k`;

        const netFormatted = isKhr 
            ? `${nVal >= 0 ? '+' : ''}${Math.round(nVal).toLocaleString()} ៛` 
            : `${nVal >= 0 ? '+' : ''}$${nVal.toFixed(2)}`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="rank-badge-medal ${rankClass}">${medalIcon}</div>
                    <div>
                        <div style="font-weight: 800; color: #0f172a; font-size: 0.92rem;">${item.username}</div>
                        <div style="font-size: 0.76rem; color: #64748b;">${item.nickname}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.95rem; color: #0f172a;">${valFormatted}</div>
                    <div style="font-size: 0.78rem; font-weight: 700; color: ${nVal >= 0 ? '#16a34a' : '#dc2626'};">${netFormatted}</div>
                </div>
            </div>
            <div class="lb-progress-bar-bg">
                <div class="lb-progress-bar-fill" style="width: ${progressPct}%; background: ${leaderboardMode === 'net' ? (nVal >= 0 ? '#16a34a' : '#dc2626') : 'linear-gradient(90deg, #6366f1, #3b82f6)'};"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Enhanced Daily Summary Table
function renderDailySummaryTable(dailySummaryChronological, peakBestDay, peakWorstDay) {
    const tableRows = [...dailySummaryChronological].reverse();
    const tbody = document.getElementById('daily-summary-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    tableRows.forEach((item, idx) => {
        const chronoIndex = dailySummaryChronological.findIndex(d => d.dateStr === item.dateStr);
        let diffKhr = 0, diffUsd = 0;
        let khrBadgeHtml = '', usdBadgeHtml = '';

        if (chronoIndex > 0) {
            const prevItem = dailySummaryChronological[chronoIndex - 1];
            diffKhr = item.netKhr - prevItem.netKhr;
            diffUsd = item.netUsd - prevItem.netUsd;

            if (diffKhr > 0) {
                khrBadgeHtml = `<span class="trend-badge trend-up" title="កើនឡើងធៀបថ្ងៃចាស់"><i class="fa-solid fa-arrow-trend-up"></i> ▲ +${Math.round(diffKhr).toLocaleString()} ៛</span>`;
            } else if (diffKhr < 0) {
                khrBadgeHtml = `<span class="trend-badge trend-down" title="ធ្លាក់ចុះធៀបថ្ងៃចាស់"><i class="fa-solid fa-arrow-trend-down"></i> ▼ ${Math.round(diffKhr).toLocaleString()} ៛</span>`;
            } else {
                khrBadgeHtml = `<span class="trend-badge trend-flat" title="ស្មើថ្ងៃចាស់">= ០</span>`;
            }

            if (diffUsd > 0) {
                usdBadgeHtml = `<span class="trend-badge trend-up" title="កើនឡើងធៀបថ្ងៃចាស់"><i class="fa-solid fa-arrow-trend-up"></i> ▲ +$${diffUsd.toFixed(2)}</span>`;
            } else if (diffUsd < 0) {
                usdBadgeHtml = `<span class="trend-badge trend-down" title="ធ្លាក់ចុះធៀបថ្ងៃចាស់"><i class="fa-solid fa-arrow-trend-down"></i> ▼ -$${Math.abs(diffUsd).toFixed(2)}</span>`;
            } else {
                usdBadgeHtml = `<span class="trend-badge trend-flat" title="ស្មើថ្ងៃចាស់">= $0</span>`;
            }
        } else {
            khrBadgeHtml = `<span class="trend-badge trend-flat">ថ្ងៃដំបូង</span>`;
            usdBadgeHtml = `<span class="trend-badge trend-flat">ថ្ងៃដំបូង</span>`;
        }

        const marginRate = item.bKhr > 0 ? (item.netKhr / item.bKhr) * 100 : 0;
        const isPeakBest = peakBestDay && peakBestDay.dateStr === item.dateStr && item.netKhr > 0;
        const isPeakLoss = peakWorstDay && peakWorstDay.dateStr === item.dateStr && item.netKhr < 0;

        let statusBadge = `<span class="badge-profit-status"><i class="fa-solid fa-circle-check text-green"></i> ធម្មតា</span>`;
        if (isPeakBest) {
            statusBadge = `<span class="badge-best-day"><i class="fa-solid fa-crown"></i> Best Day</span>`;
        } else if (isPeakLoss) {
            statusBadge = `<span class="badge-loss-alert"><i class="fa-solid fa-triangle-exclamation"></i> Max Loss</span>`;
        } else if (item.netKhr < 0) {
            statusBadge = `<span class="badge-loss-alert"><i class="fa-solid fa-arrow-down"></i> ខាត</span>`;
        } else if (item.netKhr > 0) {
            statusBadge = `<span class="badge-best-day"><i class="fa-solid fa-arrow-up"></i> ចំណេញ</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-center font-bold text-blue">${item.dateStr}</td>
            <td class="text-right font-bold">${Math.round(item.bKhr).toLocaleString()} ៛</td>
            <td class="text-right font-bold">$${item.bUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td class="text-right ${item.netKhr < 0 ? 'text-red-bold' : ''}">
                <strong>${Math.round(item.netKhr).toLocaleString()} ៛</strong> ${khrBadgeHtml}
            </td>
            <td class="text-right ${item.netUsd < 0 ? 'text-red-bold' : ''}">
                <strong>$${item.netUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> ${usdBadgeHtml}
            </td>
            <td class="text-center">
                <span class="pct-badge ${marginRate >= 0 ? 'pct-pos' : 'pct-neg'}">${marginRate >= 0 ? '+' : ''}${marginRate.toFixed(2)}%</span>
            </td>
            <td class="text-center">${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Render Organized 32-Column Rows
function renderTable() {
    const tbody = document.getElementById('green-report-body');
    tbody.innerHTML = '';

    const totalPages = Math.ceil(filteredSettlements.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageRows = filteredSettlements.slice(startIdx, endIdx);

    if (pageRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="32" class="text-center" style="padding: 2.5rem; color: #64748b; font-size: 0.95rem;">មិនមានទិន្នន័យត្រូវបានស្វែងរកឃើញឡើយ</td></tr>`;
        document.getElementById('page-info').innerText = 'បង្ហាញ 0 នៃ 0';
        renderPaginationBar(totalPages);
        return;
    }

    pageRows.forEach(item => {
        const tr = document.createElement('tr');

        const displayDateStr = item._displayDate || selectedDateKey;
        const uName = item.username || '';
        const nick = item.nickname || '';

        const bet1d_khr = item.betAmount1DKhr || 0;
        const bet2d_khr = item.betAmount2DKhr || 0;
        const bet3d_khr = item.betAmount3DKhr || 0;
        const bet4d_khr = item.betAmount4DKhr || 0;

        const bet1d_usd = item.betAmount1DUsd || 0;
        const bet2d_usd = item.betAmount2DUsd || 0;
        const bet3d_usd = item.betAmount3DUsd || 0;
        const bet4d_usd = item.betAmount4DUsd || 0;

        const win1d_khr = item.winAmount1DKhr || 0;
        const win2d_khr = item.winAmount2DKhr || 0;
        const win3d_khr = item.winAmount3DKhr || 0;
        const win4d_khr = item.winAmount4DKhr || 0;

        const win1d_usd = item.winAmount1DUsd || 0;
        const win2d_usd = item.winAmount2DUsd || 0;
        const win3d_usd = item.winAmount3DUsd || 0;
        const win4d_usd = item.winAmount4DUsd || 0;

        const share_khr = item.winLoseAmountKhr || 0;
        const share_usd = item.winLoseAmountUsd || 0;

        const old_khr = item.oldAmountKhr || 0;
        const old_usd = item.oldAmountUsd || 0;

        const borrow_khr = item.borrow?.amountKhr || 0;
        const give_khr = item.give?.amountKhr || 0;

        const borrow_usd = item.borrow?.amountUsd || 0;
        const give_usd = item.give?.amountUsd || 0;

        const protest_khr = item.protestAmount?.amountKhr || 0;
        const protest_usd = item.protestAmount?.amountUsd || 0;

        const total_khr = item.totalAmountKhr || 0;
        const total_usd = item.totalAmountUsd || 0;

        tr.innerHTML = `
            <td class="text-center">${displayDateStr}</td>
            <td class="text-center text-blue-bold">${selectedLotteryType}</td>
            <td class="text-left text-blue-bold">${uName}</td>
            <td class="text-left text-blue-bold">${nick}</td>

            <td class="text-right">${formatNum(bet1d_khr)}</td>
            <td class="text-right">${formatNum(bet2d_khr)}</td>
            <td class="text-right">${formatNum(bet3d_khr)}</td>
            <td class="text-right">${formatNum(bet4d_khr)}</td>

            <td class="text-right">${formatNum(bet1d_usd)}</td>
            <td class="text-right">${formatNum(bet2d_usd)}</td>
            <td class="text-right">${formatNum(bet3d_usd)}</td>
            <td class="text-right">${formatNum(bet4d_usd)}</td>

            <td class="text-right">${formatWinNum(win1d_khr)}</td>
            <td class="text-right">${formatWinNum(win2d_khr)}</td>
            <td class="text-right">${formatWinNum(win3d_khr)}</td>
            <td class="text-right">${formatWinNum(win4d_khr)}</td>

            <td class="text-right">${formatWinNum(win1d_usd)}</td>
            <td class="text-right">${formatWinNum(win2d_usd)}</td>
            <td class="text-right">${formatWinNum(win3d_usd)}</td>
            <td class="text-right">${formatWinNum(win4d_usd)}</td>

            <td class="text-right">${formatNum(share_khr)}</td>
            <td class="text-right">${formatNum(share_usd)}</td>

            <td class="text-right">${formatNum(old_khr)}</td>
            <td class="text-right">${formatNum(old_usd)}</td>

            <td class="text-right">${formatNum(borrow_khr)}</td>
            <td class="text-right">${formatNum(give_khr)}</td>

            <td class="text-right">${formatNum(borrow_usd)}</td>
            <td class="text-right">${formatNum(give_usd)}</td>

            <td class="text-right">${formatNum(protest_khr)}</td>
            <td class="text-right">${formatNum(protest_usd)}</td>

            <td class="text-right">${formatNum(total_khr)}</td>
            <td class="text-right">${formatNum(total_usd)}</td>
        `;
        tbody.appendChild(tr);
    });

    const activeFilterText = showActiveSalesOnly ? ' (តែអ្នកមានការលក់)' : '';
    document.getElementById('page-info').innerText = `បង្ហាញ ${startIdx + 1} ដល់ ${Math.min(endIdx, filteredSettlements.length)} នៃ ${filteredSettlements.length} កំណត់ត្រា (${selectedDateKey})${activeFilterText}`;
    
    renderPaginationBar(totalPages);
}

// Render Clickable Page Numbers
function renderPaginationBar(totalPages) {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageNumContainer = document.getElementById('page-numbers');

    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage >= totalPages;

    pageNumContainer.innerHTML = '';

    if (totalPages <= 1) return;

    let pagesToDisplay = [];

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pagesToDisplay.push(i);
    } else {
        pagesToDisplay.push(1);

        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 3) {
            start = 2;
            end = 4;
        } else if (currentPage >= totalPages - 2) {
            start = totalPages - 3;
            end = totalPages - 1;
        }

        if (start > 2) pagesToDisplay.push('...');

        for (let i = start; i <= end; i++) {
            pagesToDisplay.push(i);
        }

        if (end < totalPages - 1) pagesToDisplay.push('...');

        pagesToDisplay.push(totalPages);
    }

    pagesToDisplay.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.className = 'page-ellipsis';
            span.innerText = '...';
            pageNumContainer.appendChild(span);
        } else {
            const btn = document.createElement('button');
            btn.className = `page-num-btn ${p === currentPage ? 'active' : ''}`;
            btn.innerText = p;
            btn.onclick = () => gotoPage(p);
            pageNumContainer.appendChild(btn);
        }
    });
}

function gotoPage(page) {
    currentPage = page;
    renderTable();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredSettlements.length / pageSize) || 1;
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

function getActiveMonthInfo() {
    const datesArr = rawData?.dates_available || [];
    let mNum = '09';
    let yStr = '2026';
    if (datesArr.length > 0) {
        const parts = datesArr[0].split('/');
        if (parts.length === 3) {
            mNum = parts[1];
            yStr = parts[2];
        }
    }
    const monthNames = {
        '01': { en: 'january', kh: 'មករា', upper: 'JANUARY' },
        '02': { en: 'february', kh: 'កុម្ភៈ', upper: 'FEBRUARY' },
        '03': { en: 'march', kh: 'មីនា', upper: 'MARCH' },
        '04': { en: 'april', kh: 'មេសា', upper: 'APRIL' },
        '05': { en: 'may', kh: 'ឧសភា', upper: 'MAY' },
        '06': { en: 'june', kh: 'មិថុនា', upper: 'JUNE' },
        '07': { en: 'july', kh: 'កក្កដា', upper: 'JULY' },
        '08': { en: 'august', kh: 'សីហា', upper: 'AUGUST' },
        '09': { en: 'september', kh: 'កញ្ញា', upper: 'SEPTEMBER' },
        '10': { en: 'october', kh: 'តុលា', upper: 'OCTOBER' },
        '11': { en: 'november', kh: 'វិច្ឆិកា', upper: 'NOVEMBER' },
        '12': { en: 'december', kh: 'ធ្នូ', upper: 'DECEMBER' }
    };
    const info = monthNames[mNum] || { en: 'september', kh: 'កញ្ញា', upper: 'SEPTEMBER' };
    return {
        mNum,
        yStr,
        mEn: info.en,
        mKh: info.kh,
        mUpper: info.upper,
        masterExcel: `p99l_master_database_${info.en}_${yStr}.xlsx`,
        monthlyMatrixExcel: `monthly_net_summary_${info.en}_${yStr}.xlsx`
    };
}

function downloadExcelReport() {
    const mInfo = getActiveMonthInfo();
    const filename = mInfo.masterExcel;
    const link = document.createElement('a');
    link.href = filename;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =========================================================================
// REPORT VIEW: PANEL 1 (DAILY) & PANEL 2 (CUMULATIVE MONTH-TO-DATE)
// Supports Both: 1) By 8 Lottery Types  2) By SuperSenior Search & List
// =========================================================================
let reportViewMode = 'lottery'; // 'lottery' or 'supersenior'
let reportSuperSeniorSearchQuery = '';

const OFFICIAL_LOTTERIES = [
    { code: "MHSB", rowLabel: "1. ឆ្នោត_MHSB", name: "លាភមហាសម្បត្តិ" },
    { code: "MC",   rowLabel: "2. ឆ្នោត_MC",   name: "មហាឈ្នះ" },
    { code: "MT",   rowLabel: "3. ឆ្នោត_MT",   name: "មហាទេព" },
    { code: "TC",   rowLabel: "4. ឆ្នោត_TC",   name: "ទិញឈ្នះ" },
    { code: "KH",   rowLabel: "5. ឆ្នោត_KH",   name: "ឆ្នោតខ្មែរ" },
    { code: "SC",   rowLabel: "6. ឆ្នោត_SC",   name: "ឆ្នោត SC" },
    { code: "TH",   rowLabel: "7. ឆ្នោត_TH",   name: "ឆ្នោត TH" },
    { code: "KP",   rowLabel: "8. ឆ្នោត_KP",   name: "ឆ្នោត កំពត" }
];

function setReportViewMode(mode) {
    reportViewMode = mode;
    document.getElementById('btn-report-view-lottery').classList.toggle('active', mode === 'lottery');
    document.getElementById('btn-report-view-ss').classList.toggle('active', mode === 'supersenior');
    renderReportView();
}

function onReportSuperSeniorSearchInput(val) {
    reportSuperSeniorSearchQuery = val.toLowerCase().trim();
    if (!reportSuperSeniorSearchQuery || reportSuperSeniorSearchQuery.includes('all') || reportSuperSeniorSearchQuery.includes('ទាំងអស់')) {
        reportSelectedSuperSenior = 'ALL';
    } else {
        const matched = superSeniorList.find(item => 
            item.username.toLowerCase() === reportSuperSeniorSearchQuery ||
            item.nickname.toLowerCase() === reportSuperSeniorSearchQuery ||
            item.label.toLowerCase().includes(reportSuperSeniorSearchQuery)
        );
        if (matched) {
            reportSelectedSuperSenior = matched.username;
        } else {
            reportSelectedSuperSenior = val.trim();
        }
    }
    renderReportView();
}

function onReportSuperSeniorDropdownChange(val) {
    reportSelectedSuperSenior = val;
    renderReportView();
}

function initReportFilters() {
    const datesArr = rawData.dates_available || [];
    const repDateDropdown = document.getElementById('report-date-dropdown');
    const repSsDatalist = document.getElementById('report-supersenior-datalist');
    const repSsDropdown = document.getElementById('report-supersenior-dropdown');

    if (repDateDropdown) {
        repDateDropdown.innerHTML = '';
        datesArr.forEach(dStr => {
            const opt = document.createElement('option');
            opt.value = dStr;
            opt.innerText = `📅 ថ្ងៃ ${dStr}`;
            repDateDropdown.appendChild(opt);
        });

        if (datesArr.length > 0) {
            reportSelectedDate = datesArr[0];
            repDateDropdown.value = reportSelectedDate;
        }
    }

    if (repSsDatalist) {
        repSsDatalist.innerHTML = '<option value="ALL (SuperSenior ទាំងអស់)"></option>';
    }
    if (repSsDropdown) {
        repSsDropdown.innerHTML = '<option value="ALL">👑 SuperSenior ទាំងអស់ (ALL)</option>';
    }

    const reportsObj = rawData.reports || {};
    const ssMap = new Map();
    Object.values(reportsObj).forEach(rep => {
        const supData = rep.super_senior || {};
        (supData.settlements || []).forEach(item => {
            const u = item.username || item.userCode;
            if (u && !ssMap.has(u)) {
                ssMap.set(u, item.nickname || '');
            }
        });
    });

    Array.from(ssMap.keys()).sort().forEach(u => {
        const nick = ssMap.get(u);
        if (repSsDatalist) {
            const optData = document.createElement('option');
            optData.value = `${u} - ${nick}`;
            repSsDatalist.appendChild(optData);
        }
        if (repSsDropdown) {
            const opt = document.createElement('option');
            opt.value = u;
            opt.innerText = `👑 ${u} (${nick})`;
            repSsDropdown.appendChild(opt);
        }
    });
}

function renderReportTable(theadId, tbodyId, rows, firstColHeader = 'ប្រភេទឆ្នោត', totalRowLabel = '9. TOTAL') {
    const thead = document.getElementById(theadId);
    const tbody = document.getElementById(tbodyId);
    if (!thead || !tbody) return;

    let tot1D = 0, tot2D = 0, tot3D = 0, tot4D = 0, totSales = 0, totNet = 0;
    rows.forEach(r => {
        tot1D += r.b1; tot2D += r.b2; tot3D += r.b3; tot4D += r.b4;
        totSales += r.sales; totNet += r.net;
    });
    const totPct = totSales > 0 ? (totNet / totSales) * 100 : 0;

    const show1D = tot1D > 0;
    const show2D = tot2D > 0;
    const show3D = tot3D > 0;
    const show4D = tot4D > 0;

    // Thead
    let headHtml = `<tr class="header-green-bar">
        <th class="text-left" style="min-width: 180px;">${firstColHeader}</th>`;
    if (show1D) headHtml += `<th class="text-right">លុយលក់ 1D</th>`;
    if (show2D) headHtml += `<th class="text-right">លុយលក់ 2D</th>`;
    if (show3D) headHtml += `<th class="text-right">លុយលក់ 3D</th>`;
    if (show4D) headHtml += `<th class="text-right">លុយលក់ 4D</th>`;
    headHtml += `<th class="text-right">លុយលក់សរុប</th>
        <th class="text-right">ស៊ីខាតសរុប</th>
        <th class="text-center" style="min-width: 110px;">ភាគរយ (%)</th>
    </tr>`;
    thead.innerHTML = headHtml;

    // Tbody
    tbody.innerHTML = '';
    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem; color: #64748b;">មិនមានទិន្នន័យឡើយ</td></tr>`;
        return;
    }

    rows.forEach(row => {
        const tr = document.createElement('tr');
        let rowHtml = `<td class="text-left font-semibold text-blue">${row.label}</td>`;
        if (show1D) rowHtml += `<td class="text-right">${formatNum(row.b1)}</td>`;
        if (show2D) rowHtml += `<td class="text-right">${formatNum(row.b2)}</td>`;
        if (show3D) rowHtml += `<td class="text-right">${formatNum(row.b3)}</td>`;
        if (show4D) rowHtml += `<td class="text-right">${formatNum(row.b4)}</td>`;

        const netCls = row.net < 0 ? 'text-red-bold' : (row.net > 0 ? 'text-green font-semibold' : '');
        const pctBadge = row.sales > 0 
            ? `<span class="pct-badge ${row.pct >= 0 ? 'pct-pos' : 'pct-neg'}">${row.pct >= 0 ? '+' : ''}${row.pct.toFixed(2)}%</span>`
            : `<span class="pct-badge pct-zero">0.00%</span>`;

        rowHtml += `<td class="text-right font-bold">${formatNum(row.sales)}</td>
            <td class="text-right ${netCls}">${formatNum(row.net)}</td>
            <td class="text-center">${pctBadge}</td>`;
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    // TOTAL Row
    const trTot = document.createElement('tr');
    trTot.className = 'report-total-row';
    let totHtml = `<td class="text-left font-bold text-green">${totalRowLabel}</td>`;
    if (show1D) totHtml += `<td class="text-right">${formatNum(tot1D)}</td>`;
    if (show2D) totHtml += `<td class="text-right">${formatNum(tot2D)}</td>`;
    if (show3D) totHtml += `<td class="text-right">${formatNum(tot3D)}</td>`;
    if (show4D) totHtml += `<td class="text-right">${formatNum(tot4D)}</td>`;

    const totNetCls = totNet < 0 ? 'text-red-bold' : 'text-green font-bold';
    const totPctBadge = totSales > 0 
        ? `<span class="pct-badge ${totPct >= 0 ? 'pct-pos' : 'pct-neg'}">${totPct >= 0 ? '+' : ''}${totPct.toFixed(2)}%</span>`
        : `<span class="pct-badge pct-zero">0.00%</span>`;

    totHtml += `<td class="text-right font-bold text-blue">${formatNum(totSales)}</td>
        <td class="text-right ${totNetCls}">${formatNum(totNet)}</td>
        <td class="text-center">${totPctBadge}</td>`;
    trTot.innerHTML = totHtml;
    tbody.appendChild(trTot);
}

function renderReportView() {
    if (!rawData) return;
    const reportsObj = rawData.reports || {};
    const datesAvailable = rawData.dates_available || Object.keys(reportsObj);
    const chronoDates = datesAvailable.slice().reverse(); // 01/09 -> 05/09
    const isKhr = reportActiveCurrency === 'KHR';

    const targetIdx = chronoDates.indexOf(reportSelectedDate);
    const rangeDates = targetIdx >= 0 ? chronoDates.slice(0, targetIdx + 1) : chronoDates;

    const isAllSS = !reportSelectedSuperSenior || reportSelectedSuperSenior === 'ALL';
    let currentSsLabel = 'SuperSenior ទាំងអស់ (ALL)';
    if (!isAllSS) {
        const found = superSeniorList.find(s => s.username === reportSelectedSuperSenior || s.nickname === reportSelectedSuperSenior);
        currentSsLabel = found ? `👑 ${found.username} (${found.nickname})` : `👑 ${reportSelectedSuperSenior}`;
    }

    const p1Badge = document.getElementById('report-panel1-badge');
    if (p1Badge) p1Badge.innerText = `ថ្ងៃទី ${reportSelectedDate} • ${currentSsLabel}`;

    const p2Badge = document.getElementById('report-panel2-badge');
    const firstDateStr = chronoDates.length > 0 ? chronoDates[0] : '01/09/2026';
    if (p2Badge) p2Badge.innerText = `ពីថ្ងៃ ${firstDateStr} ដល់ ${reportSelectedDate} (សរុប ${rangeDates.length} ថ្ងៃ) • ${currentSsLabel}`;

    const repDaily = reportsObj[reportSelectedDate] || {};
    const ssLotsDaily = repDaily.super_senior_lotteries || {};
    const lotSummaryDaily = repDaily.lottery_sales_summary || {};

    // Panel 1: Daily Lotteries
    const p1Rows = [];
    OFFICIAL_LOTTERIES.forEach(lot => {
        let lObj = {};
        if (isAllSS) {
            lObj = lotSummaryDaily[lot.code] || {};
        } else {
            const ssMap = ssLotsDaily[lot.code] || {};
            lObj = ssMap[reportSelectedSuperSenior] || {};
        }

        const b1 = isKhr ? (lObj.b1k || 0) : (lObj.b1u || 0);
        const b2 = isKhr ? (lObj.b2k || 0) : (lObj.b2u || 0);
        const b3 = isKhr ? (lObj.b3k || 0) : (lObj.b3u || 0);
        const b4 = isKhr ? (lObj.b4k || 0) : (lObj.b4u || 0);
        const sales = isKhr ? (lObj.sales_khr || 0) : (lObj.sales_usd || 0);
        const net = isKhr ? (lObj.net_khr || 0) : (lObj.net_usd || 0);
        const pct = sales > 0 ? (net / sales) * 100 : 0;

        p1Rows.push({ label: lot.rowLabel, b1, b2, b3, b4, sales, net, pct });
    });

    // Panel 2: Cumulative Lotteries
    const p2Rows = [];
    OFFICIAL_LOTTERIES.forEach(lot => {
        let b1 = 0, b2 = 0, b3 = 0, b4 = 0, sales = 0, net = 0;
        rangeDates.forEach(dStr => {
            const rep = reportsObj[dStr] || {};
            let lObj = {};
            if (isAllSS) {
                lObj = (rep.lottery_sales_summary || {})[lot.code] || {};
            } else {
                const ssMap = (rep.super_senior_lotteries || {})[lot.code] || {};
                lObj = ssMap[reportSelectedSuperSenior] || {};
            }

            b1 += isKhr ? (lObj.b1k || 0) : (lObj.b1u || 0);
            b2 += isKhr ? (lObj.b2k || 0) : (lObj.b2u || 0);
            b3 += isKhr ? (lObj.b3k || 0) : (lObj.b3u || 0);
            b4 += isKhr ? (lObj.b4k || 0) : (lObj.b4u || 0);
            sales += isKhr ? (lObj.sales_khr || 0) : (lObj.sales_usd || 0);
            net += isKhr ? (lObj.net_khr || 0) : (lObj.net_usd || 0);
        });

        const pct = sales > 0 ? (net / sales) * 100 : 0;
        p2Rows.push({ label: lot.rowLabel, b1, b2, b3, b4, sales, net, pct });
    });

    renderReportTable('report-daily-thead', 'report-daily-tbody', p1Rows, 'ប្រភេទឆ្នោត', '9. TOTAL');
    renderReportTable('report-cumulative-thead', 'report-cumulative-tbody', p2Rows, 'ប្រភេទឆ្នោត', '9. TOTAL');

    // Helper to format settlement figures (colored)
    function formatSettlementVal(val, isKhrCurrency) {
        if (val === undefined || val === null || val === 0) return '<span class="dimmed-zero">-</span>';
        const num = isKhrCurrency ? Math.round(val) : val;
        const formatted = isKhrCurrency 
            ? `${Math.abs(num).toLocaleString()} ៛` 
            : `$ ${Math.abs(num).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        if (num < 0) {
            return `<span style="color: #ef4444; font-weight: 800;">-${formatted}</span>`;
        }
        return `<span style="color: #16a34a; font-weight: 800;">+${formatted}</span>`;
    }

    // =========================================================
    // 1. PANEL 1 (DAILY) SANG & FINAL SETTLEMENT SUMMARY
    // =========================================================
    let totDailyLotNet = 0;
    p1Rows.forEach(r => { totDailyLotNet += r.net; });

    let dailySangWinLose = 0;
    if (isAllSS) {
        const sangSumm = repDaily.super_senior_sang?.summery || {};
        dailySangWinLose = isKhr ? (sangSumm.winLoseAmountKhr || 0) : (sangSumm.winLoseAmountUsd || 0);
    } else {
        const sangSett = repDaily.super_senior_sang?.settlements || [];
        const sangItem = sangSett.find(s => s.username === reportSelectedSuperSenior || s.nickname === reportSelectedSuperSenior);
        if (sangItem) {
            dailySangWinLose = isKhr ? (sangItem.winLoseAmountKhr || 0) : (sangItem.winLoseAmountUsd || 0);
        }
    }
    const dailySangDeducted = -1 * dailySangWinLose;

    let dailyProtest = 0;
    if (isAllSS) {
        const pObj = repDaily.member?.summery?.protestAmount || {};
        dailyProtest = isKhr ? (pObj.amountKhr || 0) : (pObj.amountUsd || 0);
    } else {
        const ssSett = repDaily.super_senior?.settlements || [];
        const ssItem = ssSett.find(s => s.username === reportSelectedSuperSenior || s.nickname === reportSelectedSuperSenior);
        if (ssItem) {
            const pObj = ssItem.protestAmount || {};
            dailyProtest = isKhr ? (pObj.amountKhr || 0) : (pObj.amountUsd || 0);
        }
    }

    const finalDailyNet = totDailyLotNet + dailyProtest + dailySangDeducted;

    const dailySangContainer = document.getElementById('report-daily-sang-summary');
    if (dailySangContainer) {
        dailySangContainer.innerHTML = `
            <div class="sang-summary-panel-wrapper">
                <!-- Left Box: Sang Badge -->
                <div class="sang-badge-box">
                    <div style="font-size: 0.88rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-arrows-split-up-and-left text-green"></i> 
                        <span>ទិន្នន័យលេខសាង (Sang Number)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; background: #fff; padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                        <span style="font-weight: 700; color: #334155; font-size: 0.92rem;">សាងលេខ ៖</span>
                        <span style="font-size: 1.1rem; font-weight: 800; font-family: 'Outfit', sans-serif;">${formatSettlementVal(dailySangDeducted, isKhr)}</span>
                    </div>
                </div>

                <!-- Right Box: Settlement Calculation Table -->
                <div class="sang-settlement-calc-box">
                    <table style="width: 100%; border-collapse: collapse; font-family: 'Kantumruy Pro', sans-serif; font-size: 0.9rem;">
                        <tbody>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 14px; font-weight: 600; color: #475569;">ស៊ី/ខាត ឆ្នោតសរុប</td>
                                <td style="padding: 7px 14px; text-align: right; font-family: 'Outfit', sans-serif;">${formatSettlementVal(totDailyLotNet, isKhr)}</td>
                                <td style="padding: 7px 10px; text-align: center; color: #94a3b8; font-size: 0.8rem; width: 70px;">System</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 14px; font-weight: 600; color: #475569;">តវ៉ាប្រចាំថ្ងៃ -&gt;</td>
                                <td style="padding: 7px 14px; text-align: right; font-family: 'Outfit', sans-serif;">${formatSettlementVal(dailyProtest, isKhr)}</td>
                                <td style="padding: 7px 10px; text-align: center;"></td>
                            </tr>
                            <tr style="border-bottom: 2px solid #cbd5e1; background: #fef2f2;">
                                <td style="padding: 7px 14px; font-weight: 700; color: #991b1b;">ទូទាត់(សាងលេខ) -&gt;</td>
                                <td style="padding: 7px 14px; text-align: right; font-family: 'Outfit', sans-serif;">${formatSettlementVal(dailySangDeducted, isKhr)}</td>
                                <td style="padding: 7px 10px; text-align: center; color: #64748b; font-weight: 700; font-size: 0.8rem;">Company</td>
                            </tr>
                            <tr style="background: #e0f2fe;">
                                <td style="padding: 9px 14px; font-weight: 800; color: #0369a1; font-size: 0.95rem;">Total (Daily)</td>
                                <td style="padding: 9px 14px; text-align: right; font-size: 1.15rem; font-family: 'Outfit', sans-serif;">${formatSettlementVal(finalDailyNet, isKhr)}</td>
                                <td style="padding: 9px 10px; text-align: center; color: #0284c7; font-weight: 700; font-size: 0.82rem;">សរុបថ្ងៃ</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================
    // 2. PANEL 2 (CUMULATIVE) SANG & FINAL SETTLEMENT SUMMARY
    // =========================================================
    let totCumulLotNet = 0;
    p2Rows.forEach(r => { totCumulLotNet += r.net; });

    let cumulSangWinLose = 0;
    let cumulProtest = 0;
    let cumulBorrow = 0;
    let cumulGive = 0;

    rangeDates.forEach(dStr => {
        const rep = reportsObj[dStr] || {};
        if (isAllSS) {
            const sangSumm = rep.super_senior_sang?.summery || {};
            cumulSangWinLose += isKhr ? (sangSumm.winLoseAmountKhr || 0) : (sangSumm.winLoseAmountUsd || 0);

            const mSumm = rep.member?.summery || {};
            cumulProtest += isKhr ? (mSumm.protestAmount?.amountKhr || 0) : (mSumm.protestAmount?.amountUsd || 0);
            cumulBorrow += isKhr ? (mSumm.borrow?.amountKhr || 0) : (mSumm.borrow?.amountUsd || 0);
            cumulGive += isKhr ? (mSumm.give?.amountKhr || 0) : (mSumm.give?.amountUsd || 0);
        } else {
            const sangSett = rep.super_senior_sang?.settlements || [];
            const sangItem = sangSett.find(s => s.username === reportSelectedSuperSenior || s.nickname === reportSelectedSuperSenior);
            if (sangItem) {
                cumulSangWinLose += isKhr ? (sangItem.winLoseAmountKhr || 0) : (sangItem.winLoseAmountUsd || 0);
            }

            const ssSett = rep.super_senior?.settlements || [];
            const ssItem = ssSett.find(s => s.username === reportSelectedSuperSenior || s.nickname === reportSelectedSuperSenior);
            if (ssItem) {
                cumulProtest += isKhr ? (ssItem.protestAmount?.amountKhr || 0) : (ssItem.protestAmount?.amountUsd || 0);
                cumulBorrow += isKhr ? (ssItem.borrow?.amountKhr || 0) : (ssItem.borrow?.amountUsd || 0);
                cumulGive += isKhr ? (ssItem.give?.amountKhr || 0) : (ssItem.give?.amountUsd || 0);
            }
        }
    });

    const cumulSangDeducted = -1 * cumulSangWinLose;
    const finalCumulNet = totCumulLotNet + cumulProtest + cumulSangDeducted;
    const cumulExpense = 0;
    const cashOnHand = finalCumulNet + cumulBorrow + cumulGive;

    const cumulSangContainer = document.getElementById('report-cumulative-sang-summary');
    if (cumulSangContainer) {
        cumulSangContainer.innerHTML = `
            <div class="sang-summary-panel-wrapper">
                <!-- Left Box: Sang Cumulative Badge -->
                <div class="sang-badge-box">
                    <div style="font-size: 0.88rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-arrows-split-up-and-left text-green"></i> 
                        <span>ទិន្នន័យលេខសាងសរុប (Cumulative Sang)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; background: #fff; padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                        <span style="font-weight: 700; color: #334155; font-size: 0.92rem;">សាងលេខសរុប ៖</span>
                        <span style="font-size: 1.1rem; font-weight: 800; font-family: 'Outfit', sans-serif;">${formatSettlementVal(cumulSangDeducted, isKhr)}</span>
                    </div>
                </div>

                <!-- Right Box: Cumulative Settlement Table -->
                <div class="sang-settlement-calc-box">
                    <table style="width: 100%; border-collapse: collapse; font-family: 'Kantumruy Pro', sans-serif; font-size: 0.9rem;">
                        <tbody>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 14px; font-weight: 600; color: #475569;">ស៊ី/ខាត ឆ្នោតសរុប</td>
                                <td style="padding: 7px 14px; text-align: right; font-family: 'Outfit', sans-serif;">${formatSettlementVal(totCumulLotNet, isKhr)}</td>
                                <td style="padding: 7px 10px; text-align: center; color: #94a3b8; font-size: 0.8rem; width: 70px;">System</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 14px; font-weight: 600; color: #475569;">តវ៉ាសរុប -&gt;</td>
                                <td style="padding: 7px 14px; text-align: right; font-family: 'Outfit', sans-serif;">${formatSettlementVal(cumulProtest, isKhr)}</td>
                                <td style="padding: 7px 10px; text-align: center;"></td>
                            </tr>
                            <tr style="border-bottom: 2px solid #cbd5e1; background: #fef2f2;">
                                <td style="padding: 7px 14px; font-weight: 700; color: #991b1b;">លុយសាង(ទូទាត់) -&gt;</td>
                                <td style="padding: 7px 14px; text-align: right; font-family: 'Outfit', sans-serif;">${formatSettlementVal(cumulSangDeducted, isKhr)}</td>
                                <td style="padding: 7px 10px; text-align: center; color: #64748b; font-weight: 700; font-size: 0.8rem;">Company</td>
                            </tr>
                            <tr style="background: #e0f2fe; border-bottom: 1px solid #bae6fd;">
                                <td style="padding: 9px 14px; font-weight: 800; color: #0369a1; font-size: 0.95rem;">Total (Monthly)</td>
                                <td style="padding: 9px 14px; text-align: right; font-size: 1.15rem; font-family: 'Outfit', sans-serif;">${formatSettlementVal(finalCumulNet, isKhr)}</td>
                                <td style="padding: 9px 10px; text-align: center; color: #0284c7; font-weight: 700; font-size: 0.82rem;">សរុបខែ</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 0.85rem;">
                                <td style="padding: 5px 14px; color: #64748b;">ចំណាយ (Expenses)</td>
                                <td style="padding: 5px 14px; text-align: right; font-family: 'Outfit', sans-serif; color: #64748b;">${formatSettlementVal(cumulExpense, isKhr)}</td>
                                <td></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 0.85rem;">
                                <td style="padding: 5px 14px; color: #64748b;">លុយខ្លី (Borrow)</td>
                                <td style="padding: 5px 14px; text-align: right; font-family: 'Outfit', sans-serif; color: #64748b;">${formatSettlementVal(cumulBorrow, isKhr)}</td>
                                <td></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 0.85rem;">
                                <td style="padding: 5px 14px; color: #64748b;">លុយដាក់ចូលទៅក្រុមហ៊ុន</td>
                                <td style="padding: 5px 14px; text-align: right; font-family: 'Outfit', sans-serif; color: #64748b;">${formatSettlementVal(cumulGive, isKhr)}</td>
                                <td></td>
                            </tr>
                            <tr style="background: #ecfdf5;">
                                <td style="padding: 9px 14px; font-weight: 800; color: #065f46; font-size: 0.95rem;">លុយក្នុងដៃ (Balance)</td>
                                <td style="padding: 9px 14px; text-align: right; font-size: 1.15rem; font-family: 'Outfit', sans-serif;">${formatSettlementVal(cashOnHand, isKhr)}</td>
                                <td style="padding: 9px 10px; text-align: center; color: #059669; font-weight: 700; font-size: 0.82rem;">តុល្យភាពចុងក្រោយ</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}

// =========================================================
// SECTION 4: MONTHLY REPORT VIEW (តារាងស៊ីខាតសរុបប្រចាំខែ 100%)
// =========================================================
let monthlySearchQuery = '';
let monthlyP3SelectedDate = 'MONTH_AGGREGATE';
let monthlyP3Currency = 'KHR';

function onMonthlySuperSeniorSearch(query) {
    monthlySearchQuery = (query || '').trim().toLowerCase();
    renderMonthlyReportView();
}

function setMonthlyP3Currency(curr) {
    monthlyP3Currency = curr;
    const btnKhr = document.getElementById('btn-monthly-p3-khr');
    const btnUsd = document.getElementById('btn-monthly-p3-usd');
    if (btnKhr) btnKhr.classList.toggle('active', curr === 'KHR');
    if (btnUsd) btnUsd.classList.toggle('active', curr === 'USD');
    renderMonthlyP3Table();
}

function onMonthlyP3DateChange(val) {
    monthlyP3SelectedDate = val;
    renderMonthlyP3Table();
}

function initMonthlyFilters() {
    const datesArr = rawData?.dates_available || [];
    const p3Dropdown = document.getElementById('monthly-p3-date-dropdown');
    if (!p3Dropdown) return;

    p3Dropdown.innerHTML = '';
    const optMonthly = document.createElement('option');
    optMonthly.value = 'MONTH_AGGREGATE';
    optMonthly.innerText = '✨ សរុបប្រចាំខែ (Month Total)';
    p3Dropdown.appendChild(optMonthly);

    datesArr.forEach(dStr => {
        const opt = document.createElement('option');
        opt.value = dStr;
        opt.innerText = `📅 ថ្ងៃ ${dStr}`;
        p3Dropdown.appendChild(opt);
    });

    if (!monthlyP3SelectedDate) monthlyP3SelectedDate = 'MONTH_AGGREGATE';
    p3Dropdown.value = monthlyP3SelectedDate;
}

function exportMonthlyReportExcel() {
    const mInfo = getActiveMonthInfo();
    window.location.href = mInfo.monthlyMatrixExcel;
}

function renderMonthlyReportView() {
    const tbody = document.getElementById('monthly-report-tbody');
    const tfoot = document.getElementById('monthly-report-tfoot');
    const badge = document.getElementById('monthly-report-period-badge');
    if (!tbody || !tfoot) return;

    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    const reportsObj = rawData.reports || {};
    const datesArr = rawData.dates_available || Object.keys(reportsObj);
    const mInfo = getActiveMonthInfo();

    if (badge) {
        badge.innerText = `${mInfo.mUpper}-${mInfo.yStr} (សរុប ${datesArr.length} ថ្ងៃ)`;
    }

    const LOTTERIES = [
        { code: 'MHSB', name: 'លាភមហាសម្បត្តិ (LMHSB)' },
        { code: 'MT',   name: 'មហាទេព (MT)' },
        { code: 'TC',   name: 'ទិញឈ្នះ (TC)' },
        { code: 'MC',   name: 'មហាឈ្នះ (MC)' },
        { code: 'SC',   name: 'សប្បាយឈ្នះ (SC)' },
        { code: 'KH',   name: 'ឆ្នោតខ្មែរ (KH)' },
        { code: 'TH',   name: 'ឆ្នោតថៃ (TH)' },
        { code: 'KP',   name: 'ឆ្នោតកំពត (KP)' }
    ];

    // Collect all SuperSeniors
    const ssMap = new Map();
    Object.values(reportsObj).forEach(rep => {
        const sett = rep.super_senior?.settlements || [];
        sett.forEach(item => {
            const u = item.username || item.userCode;
            if (u && !ssMap.has(u)) {
                ssMap.set(u, item.nickname || '');
            }
        });
    });

    const sortedUsers = Array.from(ssMap.keys()).sort();

    // Calculate sums per SuperSenior
    const monthlyData = [];
    const colTotals = {};
    LOTTERIES.forEach(l => {
        colTotals[l.code] = { khr: 0, usd: 0 };
    });
    let grandTotKhr = 0;
    let grandTotUsd = 0;

    sortedUsers.forEach(u => {
        const nick = ssMap.get(u) || '';
        const row = {
            username: u,
            nickname: nick,
            lots: {},
            total_khr: 0,
            total_usd: 0
        };

        LOTTERIES.forEach(l => {
            let lotKhr = 0;
            let lotUsd = 0;
            datesArr.forEach(dStr => {
                const rep = reportsObj[dStr] || {};
                const ssLotMap = rep.super_senior_lotteries?.[l.code] || {};
                const uData = ssLotMap[u] || {};
                lotKhr += (uData.net_khr || 0);
                lotUsd += (uData.net_usd || 0);
            });

            row.lots[l.code] = { khr: lotKhr, usd: lotUsd };
            row.total_khr += lotKhr;
            row.total_usd += lotUsd;

            colTotals[l.code].khr += lotKhr;
            colTotals[l.code].usd += lotUsd;
        });

        grandTotKhr += row.total_khr;
        grandTotUsd += row.total_usd;
        monthlyData.push(row);
    });

    // Filter by search query
    const filteredRows = monthlyData.filter(r => {
        if (!monthlySearchQuery) return true;
        return r.username.toLowerCase().includes(monthlySearchQuery) || 
               r.nickname.toLowerCase().includes(monthlySearchQuery);
    });

    // Helper formatters
    function formatCellKhr(val) {
        if (!val || val === 0) return '<span class="val-zero">-</span>';
        const rounded = Math.round(val);
        if (rounded < 0) {
            return `<span class="val-neg">-${Math.abs(rounded).toLocaleString()}៛</span>`;
        }
        return `<span class="val-pos">${rounded.toLocaleString()}៛</span>`;
    }

    function formatCellUsd(val) {
        if (!val || val === 0) return '<span class="val-zero">$ -</span>';
        if (val < 0) {
            return `<span class="val-neg">-$${Math.abs(val).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`;
        }
        return `<span class="val-pos">$${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`;
    }

    // Render tbody rows
    filteredRows.forEach((r, idx) => {
        const tr = document.createElement('tr');
        let rowHtml = `
            <td class="sticky-col col-no font-bold">${idx + 1}</td>
            <td class="sticky-col col-ss">${r.username}</td>
            <td class="sticky-col col-nick">${r.nickname}</td>
        `;

        LOTTERIES.forEach(l => {
            const khrVal = r.lots[l.code]?.khr || 0;
            const usdVal = r.lots[l.code]?.usd || 0;
            rowHtml += `
                <td class="cell-khr">${formatCellKhr(khrVal)}</td>
                <td class="cell-usd cell-lot-end">${formatCellUsd(usdVal)}</td>
            `;
        });

        // Grand total
        rowHtml += `
            <td class="cell-khr cell-grand-total">${formatCellKhr(r.total_khr)}</td>
            <td class="cell-usd cell-grand-total cell-lot-end">${formatCellUsd(r.total_usd)}</td>
            <td class="sticky-col-right">${r.username}</td>
        `;

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    // Render tfoot row (TOTAL)
    const trFoot = document.createElement('tr');
    let footHtml = `
        <td colspan="3" class="tfoot-label">TOTAL</td>
    `;

    LOTTERIES.forEach(l => {
        const kTot = colTotals[l.code].khr;
        const uTot = colTotals[l.code].usd;
        footHtml += `
            <td class="cell-khr">${formatCellKhr(kTot)}</td>
            <td class="cell-usd cell-lot-end">${formatCellUsd(uTot)}</td>
        `;
    });

    footHtml += `
        <td class="cell-khr cell-grand-total">${formatCellKhr(grandTotKhr)}</td>
        <td class="cell-usd cell-grand-total cell-lot-end">${formatCellUsd(grandTotUsd)}</td>
        <td class="sticky-col-right">TOTAL</td>
    `;

    trFoot.innerHTML = footHtml;
    tfoot.appendChild(trFoot);

    // Render Panel 2 (SuperSenior Breakdown Table)
    renderMonthlyP3Table();
}

function renderMonthlyP3Table() {
    if (!rawData) return;
    initMonthlyFilters();

    const reportsObj = rawData.reports || {};
    const datesArr = rawData.dates_available || Object.keys(reportsObj);
    const mInfo = getActiveMonthInfo();
    const isKhr = monthlyP3Currency === 'KHR';

    const p3Rows = [];

    if (monthlyP3SelectedDate === 'MONTH_AGGREGATE') {
        const ssMap = new Map();
        datesArr.forEach(dStr => {
            const rep = reportsObj[dStr] || {};
            const supSett = rep.super_senior?.settlements || [];
            supSett.forEach(s => {
                const u = s.username || s.userCode || '';
                const nick = s.nickname || '';
                if (!u) return;

                if (!ssMap.has(u)) {
                    ssMap.set(u, {
                        username: u,
                        nickname: nick,
                        b1: 0, b2: 0, b3: 0, b4: 0,
                        sales: 0, net: 0
                    });
                }
                const acc = ssMap.get(u);
                if (nick && !acc.nickname) acc.nickname = nick;

                const b1 = isKhr ? (s.betAmount1DKhr || 0) : (s.betAmount1DUsd || 0);
                const b2 = isKhr ? (s.betAmount2DKhr || 0) : (s.betAmount2DUsd || 0);
                const b3 = isKhr ? (s.betAmount3DKhr || 0) : (s.betAmount3DUsd || 0);
                const b4 = isKhr ? (s.betAmount4DKhr || 0) : (s.betAmount4DUsd || 0);
                const sales = b1 + b2 + b3 + b4;
                const net = isKhr ? (s.winLoseAmountKhr || 0) : (s.winLoseAmountUsd || 0);

                acc.b1 += b1;
                acc.b2 += b2;
                acc.b3 += b3;
                acc.b4 += b4;
                acc.sales += sales;
                acc.net += net;
            });
        });

        ssMap.forEach(acc => {
            const pct = acc.sales > 0 ? (acc.net / acc.sales) * 100 : 0;
            p3Rows.push({
                label: `👑 ${acc.username} (${acc.nickname})`,
                username: acc.username,
                nickname: acc.nickname,
                b1: acc.b1,
                b2: acc.b2,
                b3: acc.b3,
                b4: acc.b4,
                sales: acc.sales,
                net: acc.net,
                pct
            });
        });
    } else {
        const repDaily = reportsObj[monthlyP3SelectedDate] || {};
        const supSett = repDaily.super_senior?.settlements || [];
        supSett.forEach(s => {
            const u = s.username || s.userCode || '';
            const nick = s.nickname || '';
            if (!u) return;

            const b1 = isKhr ? (s.betAmount1DKhr || 0) : (s.betAmount1DUsd || 0);
            const b2 = isKhr ? (s.betAmount2DKhr || 0) : (s.betAmount2DUsd || 0);
            const b3 = isKhr ? (s.betAmount3DKhr || 0) : (s.betAmount3DUsd || 0);
            const b4 = isKhr ? (s.betAmount4DKhr || 0) : (s.betAmount4DUsd || 0);
            const sales = b1 + b2 + b3 + b4;
            const net = isKhr ? (s.winLoseAmountKhr || 0) : (s.winLoseAmountUsd || 0);
            const pct = sales > 0 ? (net / sales) * 100 : 0;

            p3Rows.push({
                label: `👑 ${u} (${nick})`,
                username: u,
                nickname: nick,
                b1, b2, b3, b4, sales, net, pct
            });
        });
    }

    // Filter by search query
    const filteredP3Rows = p3Rows.filter(r => {
        if (!monthlySearchQuery) return true;
        return (r.username && r.username.toLowerCase().includes(monthlySearchQuery)) ||
               (r.nickname && r.nickname.toLowerCase().includes(monthlySearchQuery));
    });

    filteredP3Rows.sort((a, b) => b.sales - a.sales);

    const p3Badge = document.getElementById('monthly-p3-badge');
    if (p3Badge) {
        const dateText = monthlyP3SelectedDate === 'MONTH_AGGREGATE' 
            ? `សរុប ${datesArr.length} ថ្ងៃ (${mInfo.mKh} ${mInfo.yStr})` 
            : `ថ្ងៃទី ${monthlyP3SelectedDate}`;
        p3Badge.innerText = `${dateText} • សរុប ${filteredP3Rows.length} SuperSeniors`;
    }

    renderReportTable('monthly-supersenior-thead', 'monthly-supersenior-tbody', filteredP3Rows, 'SuperSenior (កូដ / ឈ្មោះ)', `📊 TOTAL (សរុប ${filteredP3Rows.length} SuperSeniors)`);
}

// =========================================================================
// SANG REPORT VIEW (លេខសាង - របាយការណ៍សរុបរួម សាង SUPER SENIOR)
// =========================================================================
let sangSelectedDateKey = 'ALL_DAYS';
let sangSearchQuery = '';

function initSangDateDropdown() {
    const dropdown = document.getElementById('sang-date-dropdown');
    if (!dropdown || !rawData) return;

    const reportsObj = rawData.reports || {};
    const datesArr = rawData.dates_available || Object.keys(reportsObj);
    const mInfo = getActiveMonthInfo();

    let html = `
        <option value="ALL_DAYS" ${sangSelectedDateKey === 'ALL_DAYS' ? 'selected' : ''}>✨ សរុបទាំងអស់ (${mInfo.mKh} ${mInfo.yStr})</option>
    `;

    datesArr.forEach(dStr => {
        html += `<option value="${dStr}" ${sangSelectedDateKey === dStr ? 'selected' : ''}>📅 ថ្ងៃទី ${dStr}</option>`;
    });

    html += `<option value="ALL_ROWS" ${sangSelectedDateKey === 'ALL_ROWS' ? 'selected' : ''}>📋 បង្ហាញគ្រប់ជួរទាំងអស់ (All Daily Records)</option>`;

    dropdown.innerHTML = html;

    const badge = document.getElementById('sang-period-badge');
    if (badge) {
        badge.innerText = `${mInfo.mUpper}-${mInfo.yStr}`;
    }
}

function onSangDateDropdownChange(val) {
    sangSelectedDateKey = val;
    renderSangReportView();
}

function onSangSearch(query) {
    sangSearchQuery = (query || '').toLowerCase().trim();
    renderSangReportView();
}

function exportSangExcel() {
    downloadExcelReport();
}

function renderSangReportView() {
    if (!rawData) return;

    initSangDateDropdown();

    const tbody = document.getElementById('sang-report-tbody');
    const tfoot = document.getElementById('sang-report-tfoot');
    if (!tbody || !tfoot) return;

    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    const reportsObj = rawData.reports || {};
    const datesArr = rawData.dates_available || Object.keys(reportsObj);
    const mInfo = getActiveMonthInfo();

    let rowsToDisplay = [];

    if (sangSelectedDateKey === 'ALL_DAYS') {
        // Aggregate per Super Senior across all dates
        const ssMap = new Map();
        const sortedDatesChrono = datesArr.slice().sort((a, b) => {
            const [d1, m1, y1] = a.split('/').map(Number);
            const [d2, m2, y2] = b.split('/').map(Number);
            return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
        });

        sortedDatesChrono.forEach(dKey => {
            const rep = reportsObj[dKey] || {};
            const sangObj = rep.super_senior_sang || {};
            const sett = sangObj.settlements || [];
            sett.forEach(item => {
                const u = item.username || item.userCode;
                if (!u) return;

                if (!ssMap.has(u)) {
                    ssMap.set(u, {
                        userCode: item.userCode || u,
                        username: item.username || u,
                        nickname: item.nickname || '',
                        _displayDate: `សរុប ${datesArr.length} ថ្ងៃ`,
                        betAmount1DKhr: 0,
                        betAmount2DKhr: 0,
                        betAmount3DKhr: 0,
                        betAmount4DKhr: 0,
                        betAmount1DUsd: 0,
                        betAmount2DUsd: 0,
                        betAmount3DUsd: 0,
                        betAmount4DUsd: 0,
                        rewardAmount1DKhr: 0,
                        rewardAmount2DKhr: 0,
                        rewardAmount3DKhr: 0,
                        rewardAmount4DKhr: 0,
                        rewardAmount1DUsd: 0,
                        rewardAmount2DUsd: 0,
                        rewardAmount3DUsd: 0,
                        rewardAmount4DUsd: 0,
                        winLoseAmountKhr: 0,
                        winLoseAmountUsd: 0,
                        oldAmountKhr: item.oldAmountKhr || 0,
                        oldAmountUsd: item.oldAmountUsd || 0,
                        borrowKhr: 0,
                        giveKhr: 0,
                        borrowUsd: 0,
                        giveUsd: 0,
                        protestKhr: 0,
                        protestUsd: 0,
                        totalAmountKhr: item.totalAmountKhr || 0,
                        totalAmountUsd: item.totalAmountUsd || 0
                    });
                }

                const acc = ssMap.get(u);
                if (item.nickname) acc.nickname = item.nickname;
                acc.betAmount1DKhr += (item.betAmount1DKhr || item.com1DKhr || 0);
                acc.betAmount2DKhr += (item.betAmount2DKhr || item.com2DKhr || 0);
                acc.betAmount3DKhr += (item.betAmount3DKhr || item.com3DKhr || 0);
                acc.betAmount4DKhr += (item.betAmount4DKhr || item.com4DKhr || 0);

                acc.betAmount1DUsd += (item.betAmount1DUsd || item.com1DUsd || 0);
                acc.betAmount2DUsd += (item.betAmount2DUsd || item.com2DUsd || 0);
                acc.betAmount3DUsd += (item.betAmount3DUsd || item.com3DUsd || 0);
                acc.betAmount4DUsd += (item.betAmount4DUsd || item.com4DUsd || 0);

                acc.rewardAmount1DKhr += (item.rewardAmount1DKhr || item.winAmount1DKhr || 0);
                acc.rewardAmount2DKhr += (item.rewardAmount2DKhr || item.winAmount2DKhr || 0);
                acc.rewardAmount3DKhr += (item.rewardAmount3DKhr || item.winAmount3DKhr || 0);
                acc.rewardAmount4DKhr += (item.rewardAmount4DKhr || item.winAmount4DKhr || 0);

                acc.rewardAmount1DUsd += (item.rewardAmount1DUsd || item.winAmount1DUsd || 0);
                acc.rewardAmount2DUsd += (item.rewardAmount2DUsd || item.winAmount2DUsd || 0);
                acc.rewardAmount3DUsd += (item.rewardAmount3DUsd || item.winAmount3DUsd || 0);
                acc.rewardAmount4DUsd += (item.rewardAmount4DUsd || item.winAmount4DUsd || 0);

                acc.winLoseAmountKhr += (item.winLoseAmountKhr || 0);
                acc.winLoseAmountUsd += (item.winLoseAmountUsd || 0);

                const bObj = item.borrow || {};
                const gObj = item.give || {};
                const pObj = item.protestAmount || {};

                acc.borrowKhr += (bObj.amountKhr || 0);
                acc.giveKhr += (gObj.amountKhr || 0);
                acc.borrowUsd += (bObj.amountUsd || 0);
                acc.giveUsd += (gObj.amountUsd || 0);
                acc.protestKhr += (pObj.amountKhr || 0);
                acc.protestUsd += (pObj.amountUsd || 0);

                acc.totalAmountKhr = item.totalAmountKhr || 0;
                acc.totalAmountUsd = item.totalAmountUsd || 0;
            });
        });

        rowsToDisplay = Array.from(ssMap.values());
        rowsToDisplay.sort((a, b) => {
            const totA = (a.betAmount1DKhr + a.betAmount2DKhr + a.betAmount3DKhr + a.betAmount4DKhr);
            const totB = (b.betAmount1DKhr + b.betAmount2DKhr + b.betAmount3DKhr + b.betAmount4DKhr);
            return totB - totA;
        });

    } else if (sangSelectedDateKey === 'ALL_ROWS') {
        const sortedDatesChrono = datesArr.slice().sort((a, b) => {
            const [d1, m1, y1] = a.split('/').map(Number);
            const [d2, m2, y2] = b.split('/').map(Number);
            return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
        });

        sortedDatesChrono.forEach(dKey => {
            const rep = reportsObj[dKey] || {};
            const sangObj = rep.super_senior_sang || {};
            const sett = sangObj.settlements || [];
            sett.forEach(item => {
                const bObj = item.borrow || {};
                const gObj = item.give || {};
                const pObj = item.protestAmount || {};
                rowsToDisplay.push({
                    userCode: item.userCode || item.username,
                    username: item.username,
                    nickname: item.nickname || '',
                    _displayDate: dKey,
                    betAmount1DKhr: item.betAmount1DKhr || item.com1DKhr || 0,
                    betAmount2DKhr: item.betAmount2DKhr || item.com2DKhr || 0,
                    betAmount3DKhr: item.betAmount3DKhr || item.com3DKhr || 0,
                    betAmount4DKhr: item.betAmount4DKhr || item.com4DKhr || 0,
                    betAmount1DUsd: item.betAmount1DUsd || item.com1DUsd || 0,
                    betAmount2DUsd: item.betAmount2DUsd || item.com2DUsd || 0,
                    betAmount3DUsd: item.betAmount3DUsd || item.com3DUsd || 0,
                    betAmount4DUsd: item.betAmount4DUsd || item.com4DUsd || 0,
                    rewardAmount1DKhr: item.rewardAmount1DKhr || item.winAmount1DKhr || 0,
                    rewardAmount2DKhr: item.rewardAmount2DKhr || item.winAmount2DKhr || 0,
                    rewardAmount3DKhr: item.rewardAmount3DKhr || item.winAmount3DKhr || 0,
                    rewardAmount4DKhr: item.rewardAmount4DKhr || item.winAmount4DKhr || 0,
                    rewardAmount1DUsd: item.rewardAmount1DUsd || item.winAmount1DUsd || 0,
                    rewardAmount2DUsd: item.rewardAmount2DUsd || item.winAmount2DUsd || 0,
                    rewardAmount3DUsd: item.rewardAmount3DUsd || item.winAmount3DUsd || 0,
                    rewardAmount4DUsd: item.rewardAmount4DUsd || item.winAmount4DUsd || 0,
                    winLoseAmountKhr: item.winLoseAmountKhr || 0,
                    winLoseAmountUsd: item.winLoseAmountUsd || 0,
                    oldAmountKhr: item.oldAmountKhr || 0,
                    oldAmountUsd: item.oldAmountUsd || 0,
                    borrowKhr: bObj.amountKhr || 0,
                    giveKhr: gObj.amountKhr || 0,
                    borrowUsd: bObj.amountUsd || 0,
                    giveUsd: gObj.amountUsd || 0,
                    protestKhr: pObj.amountKhr || 0,
                    protestUsd: pObj.amountUsd || 0,
                    totalAmountKhr: item.totalAmountKhr || 0,
                    totalAmountUsd: item.totalAmountUsd || 0
                });
            });
        });
    } else {
        // Specific date
        const rep = reportsObj[sangSelectedDateKey] || {};
        const sangObj = rep.super_senior_sang || {};
        const sett = sangObj.settlements || [];
        sett.forEach(item => {
            const bObj = item.borrow || {};
            const gObj = item.give || {};
            const pObj = item.protestAmount || {};
            rowsToDisplay.push({
                userCode: item.userCode || item.username,
                username: item.username,
                nickname: item.nickname || '',
                _displayDate: sangSelectedDateKey,
                betAmount1DKhr: item.betAmount1DKhr || item.com1DKhr || 0,
                betAmount2DKhr: item.betAmount2DKhr || item.com2DKhr || 0,
                betAmount3DKhr: item.betAmount3DKhr || item.com3DKhr || 0,
                betAmount4DKhr: item.betAmount4DKhr || item.com4DKhr || 0,
                betAmount1DUsd: item.betAmount1DUsd || item.com1DUsd || 0,
                betAmount2DUsd: item.betAmount2DUsd || item.com2DUsd || 0,
                betAmount3DUsd: item.betAmount3DUsd || item.com3DUsd || 0,
                betAmount4DUsd: item.betAmount4DUsd || item.com4DUsd || 0,
                rewardAmount1DKhr: item.rewardAmount1DKhr || item.winAmount1DKhr || 0,
                rewardAmount2DKhr: item.rewardAmount2DKhr || item.winAmount2DKhr || 0,
                rewardAmount3DKhr: item.rewardAmount3DKhr || item.winAmount3DKhr || 0,
                rewardAmount4DKhr: item.rewardAmount4DKhr || item.winAmount4DKhr || 0,
                rewardAmount1DUsd: item.rewardAmount1DUsd || item.winAmount1DUsd || 0,
                rewardAmount2DUsd: item.rewardAmount2DUsd || item.winAmount2DUsd || 0,
                rewardAmount3DUsd: item.rewardAmount3DUsd || item.winAmount3DUsd || 0,
                rewardAmount4DUsd: item.rewardAmount4DUsd || item.winAmount4DUsd || 0,
                winLoseAmountKhr: item.winLoseAmountKhr || 0,
                winLoseAmountUsd: item.winLoseAmountUsd || 0,
                oldAmountKhr: item.oldAmountKhr || 0,
                oldAmountUsd: item.oldAmountUsd || 0,
                borrowKhr: bObj.amountKhr || 0,
                giveKhr: gObj.amountKhr || 0,
                borrowUsd: bObj.amountUsd || 0,
                giveUsd: gObj.amountUsd || 0,
                protestKhr: pObj.amountKhr || 0,
                protestUsd: pObj.amountUsd || 0,
                totalAmountKhr: item.totalAmountKhr || 0,
                totalAmountUsd: item.totalAmountUsd || 0
            });
        });
    }

    // Filter by search query
    const filteredRows = rowsToDisplay.filter(r => {
        if (!sangSearchQuery) return true;
        return (r.username && r.username.toLowerCase().includes(sangSearchQuery)) ||
               (r.nickname && r.nickname.toLowerCase().includes(sangSearchQuery)) ||
               (r.userCode && r.userCode.toLowerCase().includes(sangSearchQuery));
    });

    // Calculate totals for KPIs & Footer
    const totals = {
        b1k: 0, b2k: 0, b3k: 0, b4k: 0,
        b1u: 0, b2u: 0, b3u: 0, b4u: 0,
        r1k: 0, r2k: 0, r3k: 0, r4k: 0,
        r1u: 0, r2u: 0, r3u: 0, r4u: 0,
        netKhr: 0, netUsd: 0,
        oldKhr: 0, oldUsd: 0,
        borrowKhr: 0, giveKhr: 0,
        borrowUsd: 0, giveUsd: 0,
        protestKhr: 0, protestUsd: 0,
        totKhr: 0, totUsd: 0
    };

    filteredRows.forEach(r => {
        totals.b1k += r.betAmount1DKhr;
        totals.b2k += r.betAmount2DKhr;
        totals.b3k += r.betAmount3DKhr;
        totals.b4k += r.betAmount4DKhr;

        totals.b1u += r.betAmount1DUsd;
        totals.b2u += r.betAmount2DUsd;
        totals.b3u += r.betAmount3DUsd;
        totals.b4u += r.betAmount4DUsd;

        totals.r1k += r.rewardAmount1DKhr;
        totals.r2k += r.rewardAmount2DKhr;
        totals.r3k += r.rewardAmount3DKhr;
        totals.r4k += r.rewardAmount4DKhr;

        totals.r1u += r.rewardAmount1DUsd;
        totals.r2u += r.rewardAmount2DUsd;
        totals.r3u += r.rewardAmount3DUsd;
        totals.r4u += r.rewardAmount4DUsd;

        totals.netKhr += r.winLoseAmountKhr;
        totals.netUsd += r.winLoseAmountUsd;

        totals.oldKhr += r.oldAmountKhr;
        totals.oldUsd += r.oldAmountUsd;

        totals.borrowKhr += r.borrowKhr;
        totals.giveKhr += r.giveKhr;
        totals.borrowUsd += r.borrowUsd;
        totals.giveUsd += r.giveUsd;

        totals.protestKhr += r.protestKhr;
        totals.protestUsd += r.protestUsd;

        totals.totKhr += r.totalAmountKhr;
        totals.totUsd += r.totalAmountUsd;
    });

    const totSalesKhr = totals.b1k + totals.b2k + totals.b3k + totals.b4k;
    const totSalesUsd = totals.b1u + totals.b2u + totals.b3u + totals.b4u;

    // Update KPI Cards
    const kpiSalesKhr = document.getElementById('sang-kpi-sales-khr');
    const kpiSalesUsd = document.getElementById('sang-kpi-sales-usd');
    const kpiNetKhr = document.getElementById('sang-kpi-net-khr');
    const kpiNetUsd = document.getElementById('sang-kpi-net-usd');
    const kpiCount = document.getElementById('sang-kpi-count');
    const kpiDate = document.getElementById('sang-kpi-date');

    if (kpiSalesKhr) kpiSalesKhr.innerText = `${Math.round(totSalesKhr).toLocaleString()} ៛`;
    if (kpiSalesUsd) kpiSalesUsd.innerText = `$ ${totSalesUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    if (kpiNetKhr) {
        kpiNetKhr.innerText = `${Math.round(totals.netKhr).toLocaleString()} ៛`;
        kpiNetKhr.style.color = totals.netKhr < 0 ? '#ef4444' : '#16a34a';
    }
    if (kpiNetUsd) {
        kpiNetUsd.innerText = `$ ${totals.netUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        kpiNetUsd.style.color = totals.netUsd < 0 ? '#ef4444' : '#16a34a';
    }

    if (kpiCount) kpiCount.innerText = `${filteredRows.length} នាក់`;
    if (kpiDate) {
        if (sangSelectedDateKey === 'ALL_DAYS') {
            kpiDate.innerText = `សរុប ${datesArr.length} ថ្ងៃ (${mInfo.mKh} ${mInfo.yStr})`;
        } else if (sangSelectedDateKey === 'ALL_ROWS') {
            kpiDate.innerText = `គ្រប់ជួរ (${filteredRows.length} rows)`;
        } else {
            kpiDate.innerText = sangSelectedDateKey;
        }
    }

    // Helper formatting function for table cells
    function formatSangVal(val, isKhr = true, isNet = false) {
        if (val === undefined || val === null || val === 0) return '<span style="color:#cbd5e1;">-</span>';
        const num = isKhr ? Math.round(val) : val;
        const formatted = isKhr 
            ? num.toLocaleString() 
            : num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        if (num < 0) {
            return `<span style="color: #ef4444; font-weight: 700;">-${Math.abs(num).toLocaleString()}</span>`;
        }
        if (isNet) {
            return `<span style="color: #16a34a; font-weight: 700;">${formatted}</span>`;
        }
        return `<span>${formatted}</span>`;
    }

    // Render Rows
    filteredRows.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.style.fontFamily = "'Kantumruy Pro', sans-serif";
        tr.style.fontSize = "0.82rem";

        tr.innerHTML = `
            <td style="text-align: center; padding: 7px 6px; font-weight: 600; background: #f8fafc; border: 1px solid #e2e8f0;">${idx + 1}</td>
            <td style="text-align: center; padding: 7px 6px; color: #1e40af; font-weight: 600; border: 1px solid #e2e8f0;">${r._displayDate}</td>
            <td style="text-align: center; padding: 7px 6px; font-weight: 700; color: #0f172a; border: 1px solid #e2e8f0;">${r.username}</td>
            <td style="text-align: left; padding: 7px 8px; font-weight: 600; color: #334155; border: 1px solid #e2e8f0;">${r.nickname || '-'}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount1DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount2DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount3DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount4DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount1DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount2DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount3DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.betAmount4DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount1DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount2DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount3DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount4DKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount1DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount2DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount3DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0; color: #2563eb;">${formatSangVal(r.rewardAmount4DUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; background: #f0fdf4; border: 1px solid #e2e8f0;">${formatSangVal(r.winLoseAmountKhr, true, true)}</td>
            <td style="text-align: right; padding: 7px 6px; background: #f0fdf4; border: 1px solid #e2e8f0;">${formatSangVal(r.winLoseAmountUsd, false, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.oldAmountKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.oldAmountUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.borrowKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.giveKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.borrowUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.giveUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.protestKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; border: 1px solid #e2e8f0;">${formatSangVal(r.protestUsd, false)}</td>
            <td style="text-align: right; padding: 7px 6px; background: #f8fafc; font-weight: 700; border: 1px solid #e2e8f0;">${formatSangVal(r.totalAmountKhr, true)}</td>
            <td style="text-align: right; padding: 7px 6px; background: #f8fafc; font-weight: 700; border: 1px solid #e2e8f0;">${formatSangVal(r.totalAmountUsd, false)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Render TOTAL row in tfoot
    const trFoot = document.createElement('tr');
    trFoot.style.background = '#2E7D32';
    trFoot.style.color = '#fff';
    trFoot.style.fontWeight = '700';
    trFoot.style.fontFamily = "'Kantumruy Pro', sans-serif";
    trFoot.style.fontSize = '0.84rem';

    trFoot.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 10px 8px; border: 1px solid #166534; font-size: 0.9rem; letter-spacing: 1px;">TOTAL</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.b1k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.b2k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.b3k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.b4k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.b1u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.b2u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.b3u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.b4u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.r1k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.r2k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.r3k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.r4k).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.r1u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.r2u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.r3u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.r4u.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534; background: #1b5e20;">${Math.round(totals.netKhr).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534; background: #1b5e20;">${totals.netUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.oldKhr).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.oldUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.borrowKhr).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.giveKhr).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.borrowUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.giveUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${Math.round(totals.protestKhr).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534;">${totals.protestUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534; background: #0f172a; color: #38bdf8;">${Math.round(totals.totKhr).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 6px; border: 1px solid #166534; background: #0f172a; color: #38bdf8;">${totals.totUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
    `;
    tfoot.appendChild(trFoot);
}
