// Login page script

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem('users') || '{}');
    } catch (_) {
        return {};
    }
}

function setError(message) {
    const box = document.getElementById('loginError');
    if (!box) return;
    box.textContent = message || '';
    box.style.display = message ? 'block' : 'none';
}

function setValidity(id, invalid) {
    const el = document.getElementById(id);
    if (el) el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
}

function togglePassword() {
    const input = document.getElementById('password');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

function getFailInfo() {
    try { return JSON.parse(localStorage.getItem('loginFails') || '{}'); } catch { return {}; }
}

function setFailInfo(info) {
    localStorage.setItem('loginFails', JSON.stringify(info));
}

function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('rememberMe').checked;

    // cooldown após 3 falhas por 30s
    const fails = getFailInfo();
    const rec = fails[username];
    const now = Date.now();
    if (rec && rec.count >= 3 && now - rec.last < 30000) {
        setError('Muitas tentativas. Tente novamente em alguns segundos.');
        return;
    }

    setValidity('username', false);
    setValidity('password', false);
    setError('');

    const users = getUsers();
    if (users[username] && users[username] === password) {
        sessionStorage.setItem('currentUser', username);
        if (remember) {
            localStorage.setItem('rememberedUser', username);
        } else {
            localStorage.removeItem('rememberedUser');
        }
        // reset falhas
        delete fails[username];
        setFailInfo(fails);
        window.location.href = 'index.html';
    } else {
        // marca inválido e incrementa falha
        setValidity('username', true);
        setValidity('password', true);
        setError('Usuário ou senha incorretos.');
        const prev = fails[username] || { count: 0, last: 0 };
        fails[username] = { count: prev.count + 1, last: now };
        setFailInfo(fails);
    }
}

// auto focus e preencher remembered
document.addEventListener('DOMContentLoaded', () => {
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
        const u = document.getElementById('username');
        if (u) u.value = remembered;
        const remember = document.getElementById('rememberMe');
        if (remember) remember.checked = true;
    }
    const u = document.getElementById('username');
    if (u) u.focus();
});

window.login = login;
window.togglePassword = togglePassword;



