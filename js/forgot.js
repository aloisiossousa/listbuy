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

function startRecovery(event) {
    event.preventDefault();
    const username = document.getElementById('recUser').value.trim();
    const newPass = document.getElementById('recNewPass').value;
    if (!username || !newPass) {
        alert('Informe usuário e nova senha.');
        return;
    }
    const users = getUsers();
    if (!users[username]) {
        alert('Usuário não encontrado.');
        return;
    }
    users[username] = newPass;
    saveUsers(users);
    alert('Senha redefinida com sucesso!');
    window.location.href = 'login.html';
}

window.startRecovery = startRecovery;
window.togglePassword = function(id){
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
};


