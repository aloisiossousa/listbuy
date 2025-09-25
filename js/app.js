
   
        // Estado da aplicação
        let currentUser = null;
        let shoppingList = [];
        let currentFilter = '';
        let budgetValue = 0;

        // Credenciais de exemplo
        const users = {
            'admin': '123456',
            'usuario': 'senha123'
        };

        // Inicialização
        document.addEventListener('DOMContentLoaded', function() {
            // Verifica se existe tema salvo
            const savedTheme = window.localStorage && localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark');
            }

            // Verifica se há usuário logado
            let savedUser = window.sessionStorage && sessionStorage.getItem('currentUser');
            if (!savedUser) {
                const remembered = localStorage.getItem('rememberedUser');
                if (remembered) {
                    // aplica auto-login leve apenas se lembrar usuário
                    sessionStorage.setItem('currentUser', remembered);
                    savedUser = remembered;
                }
            }
            if (!savedUser) {
                // Se não há sessão, envia para login
                window.location.href = 'login.html';
                return;
            }
            if (savedUser) {
                currentUser = savedUser;
                // Carrega lista salva por usuário
                loadListFromStorage();
                showMainApp();
            }

            // Máscara de moeda para inputs de preço (adicionar/editar)
            attachCurrencyMaskById('itemPrice');
            attachCurrencyMaskById('editPrice');

            // Orçamento
            attachCurrencyMaskById('budgetInput');
            loadBudgetFromStorage();
            const budgetEl = document.getElementById('budgetInput');
            if (budgetEl) {
                budgetEl.addEventListener('input', function() {
                    // somente máscara na digitação; aplicação com botão
                    attachCurrencyMaskById('budgetInput');
                });
            }
        });

        // Autenticação
        function login(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (users[username] && users[username] === password) {
                currentUser = username;
                if (window.sessionStorage) {
                    sessionStorage.setItem('currentUser', username);
                }
                showMainApp();
            } else {
                alert('Usuário ou senha incorretos!');
            }
        }

        function logout() {
            currentUser = null;
            if (window.sessionStorage) {
                sessionStorage.removeItem('currentUser');
            }
            // Redireciona para a página de login separada
            window.location.href = 'login.html';
        }

        function showMainApp() {
            const loginEl = document.getElementById('loginScreen');
            if (loginEl) {
                loginEl.style.display = 'none';
            }
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('welcomeUser').textContent = `Bem-vindo, ${currentUser}!`;
            updateDisplay();
        }

        function showLoginScreen() {
            // Mantida por compatibilidade, mas index.html não possui mais login embutido
            const loginEl = document.getElementById('loginScreen');
            if (loginEl) loginEl.style.display = 'flex';
            const mainEl = document.getElementById('mainApp');
            if (mainEl) mainEl.style.display = 'none';
            const userEl = document.getElementById('username');
            const passEl = document.getElementById('password');
            if (userEl) userEl.value = '';
            if (passEl) passEl.value = '';
            shoppingList = [];
        }

        // Alternância de tema
        function toggleTheme() {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            if (window.localStorage) {
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            }
        }

        // Gerenciamento da lista
        function addItem(event) {
            event.preventDefault();
            
            const name = document.getElementById('itemName').value.trim();
            const rawPrice = document.getElementById('itemPrice').value.replace(/\./g, '').replace(',', '.');
            const price = parseFloat(rawPrice);
            const quantity = parseInt(document.getElementById('itemQuantity').value);
            const category = document.getElementById('itemCategory').value;

            if (!name || Number.isNaN(price) || !quantity || !category) {
                alert('Por favor, preencha todos os campos!');
                return;
            }

            const newItem = {
                id: Date.now(),
                name: name,
                price: price,
                quantity: quantity,
                category: category,
                total: price * quantity
            };

            shoppingList.push(newItem);
            saveListToStorage();
            
            // Limpar formulário
            document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = '';
            document.getElementById('itemQuantity').value = '1';
            document.getElementById('itemCategory').value = '';

            updateDisplay();
        }

        function removeItem(id) {
            shoppingList = shoppingList.filter(item => item.id !== id);
            saveListToStorage();
            updateDisplay();
        }

        function openEditModal(id) {
            const itemIndex = shoppingList.findIndex(it => it.id === id);
            if (itemIndex === -1) return;
            const item = shoppingList[itemIndex];

            const modal = document.getElementById('editModal');
            if (!modal) return;
            document.getElementById('editItemId').value = String(item.id);
            document.getElementById('editName').value = item.name;
            document.getElementById('editPrice').value = Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('editQuantity').value = String(item.quantity);
            document.getElementById('editCategory').value = item.category;
            modal.style.display = 'flex';

            // garantir máscara ativa após abertura
            attachCurrencyMaskById('editPrice');

            // inicializa total do item
            updateEditComputedTotal();
            const qtyEl = document.getElementById('editQuantity');
            const priceEl = document.getElementById('editPrice');
            if (qtyEl && !qtyEl._totalListenerAttached) {
                qtyEl._totalListenerAttached = true;
                qtyEl.addEventListener('input', updateEditComputedTotal);
            }
            if (priceEl && !priceEl._totalListenerAttached) {
                priceEl._totalListenerAttached = true;
                priceEl.addEventListener('input', updateEditComputedTotal);
            }
        }

        function closeEditModal() {
            const modal = document.getElementById('editModal');
            if (modal) modal.style.display = 'none';
        }

        function saveEdit(event) {
            if (event) event.preventDefault();
            const id = parseInt(document.getElementById('editItemId').value, 10);
            const itemIndex = shoppingList.findIndex(it => it.id === id);
            if (itemIndex === -1) return;

            const name = document.getElementById('editName').value.trim();
            const rawPrice = document.getElementById('editPrice').value.replace(/\./g, '').replace(',', '.');
            const price = parseFloat(rawPrice);
            const quantity = parseInt(document.getElementById('editQuantity').value, 10);
            const category = document.getElementById('editCategory').value;

            if (!name || Number.isNaN(price) || !quantity || !category) {
                alert('Por favor, preencha todos os campos corretamente.');
                return;
            }

            const updated = {
                ...shoppingList[itemIndex],
                name,
                price,
                quantity,
                category,
            };
            updated.total = updated.price * updated.quantity;
            shoppingList[itemIndex] = updated;
            saveListToStorage();
            updateDisplay();
            closeEditModal();
        }

        // Máscara de moeda (pt-BR) para inputs de preço
        function attachCurrencyMaskById(inputId) {
            const input = document.getElementById(inputId);
            if (!input) return;
            if (input._currencyMaskAttached) return; // evita múltiplos listeners
            input._currencyMaskAttached = true;
            input.addEventListener('input', function onInput() {
                const onlyDigits = input.value.replace(/\D/g, '');
                const valueNumber = onlyDigits ? Number(onlyDigits) / 100 : 0;
                input.value = valueNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            });
            // normaliza no blur (opcional)
            input.addEventListener('blur', function onBlur() {
                if (!input.value) return;
                const onlyDigits = input.value.replace(/\D/g, '');
                const valueNumber = onlyDigits ? Number(onlyDigits) / 100 : 0;
                input.value = valueNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            });
        }

        function updateEditComputedTotal() {
            const priceStr = (document.getElementById('editPrice')?.value || '').replace(/\./g, '').replace(',', '.');
            const qtyStr = document.getElementById('editQuantity')?.value || '0';
            const price = parseFloat(priceStr) || 0;
            const qty = parseInt(qtyStr, 10) || 0;
            const total = price * qty;
            const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
            const target = document.getElementById('editComputedTotal');
            if (target) target.textContent = currency.format(total);
        }

        function filterByCategory(evt, category) {
            currentFilter = category;
            
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            if (evt && evt.target) {
                evt.target.classList.add('active');
            }
            
            updateDisplay();
        }

        function updateDisplay() {
            const listContainer = document.getElementById('shoppingList');
            const filteredList = currentFilter 
                ? shoppingList.filter(item => item.category === currentFilter)
                : shoppingList;

            const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
            if (filteredList.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <div style="font-size: 48px; margin-bottom: 10px;">🛒</div>
                        <h3>${currentFilter ? 'Nenhum item nesta categoria' : 'Sua lista está vazia'}</h3>
                        <p>${currentFilter ? 'Adicione produtos desta categoria para vê-los aqui!' : 'Adicione alguns produtos para começar suas compras!'}</p>
                    </div>
                `;
            } else {
                listContainer.innerHTML = filteredList.map(item => `
                    <div class="list-item">
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-details">
                                ${item.quantity}x ${currency.format(item.price)}
                                <span class="category-badge">${getCategoryIcon(item.category)} ${item.category}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span class="item-price">${currency.format(item.total)}</span>
                            <button class="btn-edit" onclick="openEditModal(${item.id})">✏️</button>
                            <button class="btn-remove" onclick="removeItem(${item.id})">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }

            updateSummary();
        }

        function updateSummary() {
            const totalItems = shoppingList.reduce((sum, item) => sum + item.quantity, 0);
            const totalValue = shoppingList.reduce((sum, item) => sum + item.total, 0);
            const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

            document.getElementById('totalItems').textContent = totalItems;
            document.getElementById('totalValue').textContent = currency.format(totalValue);
            document.getElementById('grandTotal').textContent = currency.format(totalValue);

            // Orçamento
            const remaining = Math.max(budgetValue - totalValue, 0);
            const remainingEl = document.getElementById('budgetRemaining');
            if (remainingEl) remainingEl.textContent = currency.format(remaining);
            const budgetEl = document.getElementById('budgetInput');
            if (budgetEl && budgetEl.value.trim() === '') {
                budgetEl.value = budgetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }

            updateCategoryBreakdown();
        }

        function updateCategoryBreakdown() {
            const categoryTotals = {};
            shoppingList.forEach(item => {
                if (!categoryTotals[item.category]) {
                    categoryTotals[item.category] = 0;
                }
                categoryTotals[item.category] += item.total;
            });

            const breakdownHtml = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .map(([category, total]) => `
                    <div class="summary-item">
                        <span>${getCategoryIcon(category)} ${category}:</span>
                        <span>${currency.format(total)}</span>
                    </div>
                `).join('');

            document.getElementById('categoryBreakdown').innerHTML = breakdownHtml || '<p style="text-align: center; color: #666;">Nenhuma categoria</p>';
        }

        function getCategoryIcon(category) {
            const icons = {
                'frutas': '🍎',
                'verduras': '🥬',
                'carnes': '🥩',
                'laticínios': '🥛',
                'padaria': '🍞',
                'limpeza': '🧽',
                'higiene': '🧴',
                'bebidas': '🥤',
                'congelados': '🧊',
                'outros': '📦'
            };
            return icons[category] || '📦';
        }

        function toggleAddForm(evt) {
            const container = document.getElementById('addItemContainer');
            const btn = evt && evt.currentTarget ? evt.currentTarget : null;
            if (!container) return;
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? 'block' : 'none';
            if (btn) {
                btn.setAttribute('aria-expanded', String(isHidden));
                btn.textContent = isHidden ? 'Minimizar ▲' : 'Expandir ▼';
            }
        }

        // Persistência em localStorage por usuário
        function getStorageKey() {
            return currentUser ? `shoppingList:${currentUser}` : 'shoppingList:anon';
        }

        function clearList() {
            if (shoppingList.length === 0) return;
            const confirmed = window.confirm('Tem certeza que deseja limpar toda a lista?');
            if (!confirmed) return;
            shoppingList = [];
            saveListToStorage();
            updateDisplay();
        }
        function saveListToStorage() {
            try {
                localStorage.setItem(getStorageKey(), JSON.stringify(shoppingList));
            } catch (_) {}
        }
        function loadListFromStorage() {
            try {
                const raw = localStorage.getItem(getStorageKey());
                shoppingList = raw ? JSON.parse(raw) : [];
            } catch (_) {
                shoppingList = [];
            }
        }

        function getBudgetStorageKey() {
            return currentUser ? `budget:${currentUser}` : 'budget:anon';
        }
        function saveBudgetToStorage() {
            try {
                localStorage.setItem(getBudgetStorageKey(), String(budgetValue));
            } catch (_) {}
        }
        function loadBudgetFromStorage() {
            try {
                const raw = localStorage.getItem(getBudgetStorageKey());
                const parsed = raw ? parseFloat(raw) : 0;
                budgetValue = Number.isFinite(parsed) ? parsed : 0;
                const el = document.getElementById('budgetInput');
                if (el) {
                    el.value = budgetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            } catch (_) {
                budgetValue = 0;
            }
        }

        function applyBudget() {
            const el = document.getElementById('budgetInput');
            if (!el) return;
            const normalized = el.value.replace(/\./g, '').replace(',', '.');
            const val = parseFloat(normalized);
            budgetValue = Number.isFinite(val) ? val : 0;
            saveBudgetToStorage();
            updateSummary();
        }

        window.applyBudget = applyBudget;

        // Expor funções usadas em atributos inline
        window.login = login;
        window.logout = logout;
        window.addItem = addItem;
        window.removeItem = removeItem;
        window.openEditModal = openEditModal;
        window.closeEditModal = closeEditModal;
        window.saveEdit = saveEdit;
        window.filterByCategory = filterByCategory;
        window.toggleTheme = toggleTheme;
        window.toggleAddForm = toggleAddForm;
        window.clearList = clearList;
  