
   
        // Estado da aplicação
        let currentUser = null;
        let shoppingList = [];
        let currentFilter = '';

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
            const savedUser = window.sessionStorage && sessionStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = savedUser;
                showMainApp();
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
            showLoginScreen();
        }

        function showMainApp() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('welcomeUser').textContent = `Bem-vindo, ${currentUser}!`;
            updateDisplay();
        }

        function showLoginScreen() {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
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
            const price = parseFloat(document.getElementById('itemPrice').value);
            const quantity = parseInt(document.getElementById('itemQuantity').value);
            const category = document.getElementById('itemCategory').value;

            if (!name || !price || !quantity || !category) {
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
            
            // Limpar formulário
            document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = '';
            document.getElementById('itemQuantity').value = '1';
            document.getElementById('itemCategory').value = '';

            updateDisplay();
        }

        function removeItem(id) {
            shoppingList = shoppingList.filter(item => item.id !== id);
            updateDisplay();
        }

        function filterByCategory(category) {
            currentFilter = category;
            
            // Atualizar botões ativos
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            updateDisplay();
        }

        function updateDisplay() {
            const listContainer = document.getElementById('shoppingList');
            const filteredList = currentFilter 
                ? shoppingList.filter(item => item.category === currentFilter)
                : shoppingList;

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
                                ${item.quantity}x R$ ${item.price.toFixed(2)}
                                <span class="category-badge">${getCategoryIcon(item.category)} ${item.category}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span class="item-price">R$ ${item.total.toFixed(2)}</span>
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

            document.getElementById('totalItems').textContent = totalItems;
            document.getElementById('totalValue').textContent = `R$ ${totalValue.toFixed(2)}`;
            document.getElementById('grandTotal').textContent = `R$ ${totalValue.toFixed(2)}`;

            // Atualizar informações do orçamento
            if (budget > 0) {
                const remaining = budget - totalValue;
                document.getElementById('remainingBudget').textContent = `R$ ${remaining.toFixed(2)}`;
                document.getElementById('remainingBudget').style.color = remaining >= 0 ? '#27ae60' : '#e74c3c';
                
                // Remover alertas anteriores
                const existingAlert = document.querySelector('.budget-warning, .budget-ok');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                // Adicionar alerta de orçamento
                const summaryElement = document.getElementById('summary');
                if (remaining < 0) {
                    const warning = document.createElement('div');
                    warning.className = 'budget-warning';
                    warning.innerHTML = `⚠️ Atenção! Você está R$ ${Math.abs(remaining).toFixed(2)} acima do orçamento!`;
                    summaryElement.parentNode.insertBefore(warning, summaryElement);
                } else if (remaining <= budget * 0.1) {
                    const warning = document.createElement('div');
                    warning.className = 'budget-warning';
                    warning.innerHTML = `⚠️ Cuidado! Restam apenas R$ ${remaining.toFixed(2)} do seu orçamento!`;
                    summaryElement.parentNode.insertBefore(warning, summaryElement);
                }
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
                        <span>R$ ${total.toFixed(2)}</span>
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
  