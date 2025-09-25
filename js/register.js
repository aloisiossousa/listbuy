function getUsers() {
    try {
        return JSON.parse(localStorage.getItem('users') || '{}');
    } catch (_) {
        return {};
    }
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function register(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    if (!username || !password) {
        alert('Preencha usuário e senha.');
        return;
    }
    if (password !== confirm) {
        alert('As senhas não conferem.');
        return;
    }

    const users = getUsers();
    if (users[username]) {
        alert('Usuário já existe.');
        return;
    }
    users[username] = password;
    saveUsers(users);
    alert('Conta criada com sucesso! Você já pode entrar.');
    window.location.href = 'login.html';
}

window.register = register;
window.togglePassword = function(id){
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
};


