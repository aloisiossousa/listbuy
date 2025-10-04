
   
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
                btn.setAttribute('aria-pressed', 'false');
            });
            if (evt && evt.target) {
                evt.target.classList.add('active');
                evt.target.setAttribute('aria-pressed', 'true');
            }
            
            updateDisplay();
        }
        
        // Função de pesquisa de produtos
function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    console.log("Pesquisando por:", searchTerm);
    
    if (!searchTerm) {
        // Se a pesquisa estiver vazia, apenas mostra todos os itens
        updateDisplay();
        return;
    }
    
    // Filtra os itens que correspondem ao termo de pesquisa
    const filteredItems = shoppingList.filter(item => {
        return item.name.toLowerCase().includes(searchTerm) || 
               (item.category && item.category.toLowerCase().includes(searchTerm));
    });
    
    console.log("Itens filtrados:", filteredItems.length);
    
    // Limpa a lista atual
    const shoppingListEl = document.getElementById('shoppingList');
    shoppingListEl.innerHTML = '';
    
    // Se não houver resultados, mostra mensagem
    if (filteredItems.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente buscar com outros termos</p>
            </div>
        `;
        shoppingListEl.appendChild(emptyState);
    } else {
        // Adiciona os itens filtrados
        filteredItems.forEach(item => {
            const itemEl = createItemElement(item);
            shoppingListEl.appendChild(itemEl);
        });
    }
    
    // Atualiza a interface para mostrar que estamos em modo de pesquisa
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    // Atualiza o contador de itens visíveis
    document.getElementById('totalItems').textContent = filteredItems.length;
    
    // Adiciona um indicador visual de que estamos em modo de pesquisa
    const searchInput = document.getElementById('searchInput');
    searchInput.classList.add('active-search');
    
    // Adiciona um botão para limpar a pesquisa
    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.id = 'clearSearchBtn';
    clearSearchBtn.className = 'btn-clear-search';
    clearSearchBtn.innerHTML = '❌';
    clearSearchBtn.title = 'Limpar pesquisa';
    clearSearchBtn.onclick = function() {
        searchInput.value = '';
        searchInput.classList.remove('active-search');
        this.remove();
        updateDisplay();
    };
    
    // Adiciona o botão após o campo de pesquisa se ainda não existir
    if (!document.getElementById('clearSearchBtn')) {
        searchInput.parentNode.insertBefore(clearSearchBtn, searchInput.nextSibling);
    }
}

// Função para criar elemento de item da lista
function createItemElement(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'list-item';
    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    itemEl.innerHTML = `
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
    `;
    return itemEl;
}

// Expor função de pesquisa para uso global
window.searchItems = searchItems;
         
         // Adiciona evento de tecla Enter para a pesquisa
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keyup', function(event) {
                    if (event.key === 'Enter') {
                        searchItems();
                    }
                });
            }
        });
        
        // Função para exportar a lista
        function exportList() {
            if (shoppingList.length === 0) {
                alert('Sua lista está vazia. Adicione produtos antes de exportar.');
                return;
            }
            
            try {
                // Cria o conteúdo CSV com BOM para suporte a caracteres especiais
                const BOM = '\uFEFF';
                let csvContent = BOM + 'Nome,Preço,Quantidade,Categoria,Total\n';
                
                shoppingList.forEach(item => {
                    const total = item.total || (parseFloat(item.price) * parseInt(item.quantity));
                    csvContent += `"${item.name}","R$ ${parseFloat(item.price).toFixed(2)}",${item.quantity},"${item.category}","R$ ${total.toFixed(2)}"\n`;
                });
                
                // Cria um blob e link para download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                // Configura o link de download com data e hora
                const now = new Date();
                const dateStr = now.toISOString().slice(0,10);
                const timeStr = now.toTimeString().slice(0,5).replace(':', '-');
                link.setAttribute('href', url);
                link.setAttribute('download', `lista-compras-${dateStr}-${timeStr}.csv`);
                link.style.display = 'none';
                
                // Adiciona à página, clica e remove
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Limpa a URL do objeto para liberar memória
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                // Feedback visual para o usuário
                const exportBtn = document.getElementById('exportListBtn');
                if (exportBtn) {
                    const originalText = exportBtn.innerHTML;
                    exportBtn.innerHTML = '✅ Exportado!';
                    exportBtn.disabled = true;
                    setTimeout(() => {
                        exportBtn.innerHTML = originalText;
                        exportBtn.disabled = false;
                    }, 2000);
                }
                
            } catch (error) {
                console.error('Erro ao exportar lista:', error);
                alert('Erro ao exportar a lista. Tente novamente.');
            }
        }

        function updateDisplay() {
            const listContainer = document.getElementById('shoppingList');
            
            // Limpa qualquer indicador de pesquisa ativa
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.classList.remove('active-search');
            const clearSearchBtn = document.getElementById('clearSearchBtn');
            if (clearSearchBtn) clearSearchBtn.remove();
            
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
                // Usa a função createItemElement para criar cada item
                listContainer.innerHTML = '';
                filteredList.forEach(item => {
                    const itemEl = createItemElement(item);
                    listContainer.appendChild(itemEl);
                });
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
            const remainingRaw = budgetValue - totalValue;
            const remaining = Math.abs(remainingRaw);
            const remainingEl = document.getElementById('budgetRemaining');
            if (remainingEl) {
                remainingEl.textContent = currency.format(remaining);
                if (remainingRaw < 0) {
                    remainingEl.style.color = '#e74c3c';
                    remainingEl.title = `Excedeu o orçamento em ${currency.format(remaining)}`;
                } else {
                    remainingEl.style.color = '';
                    remainingEl.title = '';
                }
            }
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

            const entries = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a);
            const container = document.getElementById('categoryBreakdown');
            if (!container) return;
            if (entries.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma categoria</p>';
                return;
            }

            const max = Math.max(...entries.map(([,v]) => v), 1);
            const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

            const bars = entries.map(([category, total]) => {
                const percent = Math.round((total / max) * 100);
                const label = `${getCategoryIcon(category)} ${category}`;
                const color = getCategoryColor(category);
                return `
                    <div class="cat-row">
                        <div class="cat-label">${label}</div>
                        <div class="cat-bar-wrap" aria-label="${label} ${currency.format(total)}">
                            <div class="cat-bar" style="width:${percent}%; background:${color}"></div>
                        </div>
                        <div class="cat-value">${currency.format(total)}</div>
                    </div>
                `;
            }).join('');

            container.innerHTML = bars;
        }

        function getCategoryColor(category) {
            const map = {
                'frutas': 'linear-gradient(90deg, #ff7675, #e84393)',
                'verduras': 'linear-gradient(90deg, #55efc4, #00b894)',
                'carnes': 'linear-gradient(90deg, #d63031, #e17055)',
                'laticínios': 'linear-gradient(90deg, #74b9ff, #0984e3)',
                'padaria': 'linear-gradient(90deg, #fdcb6e, #e17055)',
                'limpeza': 'linear-gradient(90deg, #a29bfe, #6c5ce7)',
                'higiene': 'linear-gradient(90deg, #81ecec, #00cec9)',
                'bebidas': 'linear-gradient(90deg, #fab1a0, #e17055)',
                'congelados': 'linear-gradient(90deg, #74b9ff, #00a8ff)',
                'outros': 'linear-gradient(90deg, #b2bec3, #636e72)'
            };
            return map[category] || 'linear-gradient(90deg, #667eea, #764ba2)';
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
                btn.textContent = isHidden ? '-' : '+';
            }
        }

        // Persistência em localStorage por usuário
        function getStorageKey() {
            return currentUser ? `shoppingList:${currentUser}` : 'shoppingList:anon';
        }

        function clearList() {
            if (shoppingList.length === 0) {
                alert('Sua lista já está vazia.');
                return;
            }
            
            const itemCount = shoppingList.length;
            const confirmed = window.confirm(`Tem certeza que deseja limpar toda a lista?\n\nIsso removerá ${itemCount} ${itemCount === 1 ? 'item' : 'itens'} da sua lista de compras.`);
            
            if (!confirmed) return;
            
            try {
                // Limpa a lista
                shoppingList = [];
                
                // Limpa também o filtro atual
                currentFilter = '';
                
                // Remove indicadores de pesquisa ativa
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.classList.remove('active-search');
                }
                
                const clearSearchBtn = document.getElementById('clearSearchBtn');
                if (clearSearchBtn) clearSearchBtn.remove();
                
                // Remove filtros de categoria ativos
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                
                // Salva no localStorage
                saveListToStorage();
                
                // Atualiza todas as exibições
                updateDisplay();
                updateSummary();
                updateCategoryBreakdown();
                
                // Feedback visual para o usuário
                const clearBtn = document.getElementById('clearListBtn');
                if (clearBtn) {
                    const originalText = clearBtn.innerHTML;
                    clearBtn.innerHTML = '✅ Lista Limpa!';
                    clearBtn.disabled = true;
                    setTimeout(() => {
                        clearBtn.innerHTML = originalText;
                        clearBtn.disabled = false;
                    }, 2000);
                }
                
                // Mostra notificação de sucesso
                console.log(`Lista limpa com sucesso! ${itemCount} ${itemCount === 1 ? 'item removido' : 'itens removidos'}.`);
                
            } catch (error) {
                console.error('Erro ao limpar lista:', error);
                alert('Erro ao limpar a lista. Tente novamente.');
            }
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

        function clearBudget() {
            budgetValue = 0;
            const el = document.getElementById('budgetInput');
            if (el) el.value = '';
            saveBudgetToStorage();
            updateSummary();
        }
        window.clearBudget = clearBudget;
        
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
        window.exportList = exportList;
        window.importListFromFile = importListFromFile;
        window.triggerImportFile = triggerImportFile;

        async function importListFromFile() {
            const input = document.getElementById('importFile');
            if (!input || !input.files || input.files.length === 0) {
                alert('Selecione um arquivo PDF ou imagem.');
                return;
            }
            const file = input.files[0];
            const nameLabel = document.getElementById('importFileName');
            if (nameLabel) nameLabel.textContent = file.name;
            try {
                showImportStatus('Processando arquivo...', true);
                const text = file.type === 'application/pdf' 
                    ? await extractTextFromPdf(file)
                    : await extractTextFromImage(file);
                const productNames = parseProductNames(text);
                if (productNames.length === 0) {
                    showImportStatus('Não foi possível detectar nomes de produtos.', false);
                    return;
                }
                const uniqueNames = Array.from(new Set(productNames));
                openImportPreview(uniqueNames);
                showImportStatus(`Detectados ${uniqueNames.length} itens. Revise e confirme.`, false);
            } catch (err) {
                console.error(err);
                alert('Falha ao importar. Tente um arquivo mais nítido ou com texto selecionável.');
            } finally {
                input.value = '';
                const nameLabel2 = document.getElementById('importFileName');
                if (nameLabel2) nameLabel2.textContent = 'Nenhum arquivo selecionado';
            }
        }

        function triggerImportFile() {
            const input = document.getElementById('importFile');
            if (!input) return;
            input.click();
            input.onchange = function() {
                const nameLabel = document.getElementById('importFileName');
                if (nameLabel) {
                    const fileName = input.files && input.files[0] ? input.files[0].name : 'Nenhum arquivo selecionado';
                    nameLabel.textContent = fileName;
                }
            }
        }

        async function extractTextFromImage(file) {
            if (!window.Tesseract) throw new Error('Tesseract não carregado');
            const { data } = await Tesseract.recognize(file, 'por');
            return data && data.text ? data.text : '';
        }

        async function extractTextFromPdf(file) {
            if (!window['pdfjsLib']) throw new Error('PDF.js não carregado');
            const arrayBuf = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(it => it.str).join(' ') + '\n';
            }
            return fullText;
        }

        function parseProductNames(rawText) {
            if (!rawText) return [];
            // Normalização simples
            let text = rawText
                .replace(/\t/g, ' ')
                .replace(/[\r]+/g, '\n')
                .replace(/\u00A0/g, ' ') // nbsp
                .trim();
            const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

            const names = [];
            for (const line of lines) {
                // Remove preços e quantidades comuns (ex: 2x, R$ 10,00, 1 UN, 500g)
                const cleaned = line
                    .replace(/\b\d+\s*[xX]\b/g, '')
                    .replace(/R\$\s*\d+[\.,]?\d*/g, '')
                    .replace(/\b\d+[\.,]?\d*\s*(kg|g|un|unid|ml|l)\b/gi, '')
                    .replace(/\b(subtotal|total|troco|desconto|oferta|pagamento|cupom)\b/gi, '')
                    .replace(/[:;,-]+$/g, '')
                    .trim();
                if (!cleaned) continue;
                // Heurística: linha curta e sem muitos números aparenta ser um nome
                const digits = cleaned.replace(/\D/g, '').length;
                if (digits > 3) continue;
                if (cleaned.length < 2) continue;
                // Capitaliza básico
                const name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                names.push(name);
            }
            return names;
        }

        function showImportStatus(msg, loading) {
            const modal = document.getElementById('importPreviewModal');
            if (modal && modal.style.display !== 'flex') {
                modal.style.display = 'flex';
            }
            const el = document.getElementById('importStatus');
            if (el) {
                el.textContent = msg;
                el.style.color = loading ? '#555' : '#666';
            }
        }

        function openImportPreview(names) {
            const modal = document.getElementById('importPreviewModal');
            if (!modal) return;
            const listEl = document.getElementById('importListContainer');
            if (listEl) {
                listEl.innerHTML = names.map((n, i) => `
                    <label style="display:flex; align-items:center; gap:8px; padding:6px 4px;">
                        <input type="checkbox" class="import-check" data-name="${n.replace(/"/g,'&quot;')}" checked>
                        <input type="text" class="form-input" value="${n}" style="flex:1;">
                    </label>
                `).join('');
            }
            modal.style.display = 'flex';
        }

        function closeImportPreview() {
            const modal = document.getElementById('importPreviewModal');
            if (modal) modal.style.display = 'none';
        }

        function confirmImportSelection() {
            const container = document.getElementById('importListContainer');
            if (!container) return;
            const rows = Array.from(container.querySelectorAll('label'));
            const selected = [];
            rows.forEach(row => {
                const cb = row.querySelector('.import-check');
                const input = row.querySelector('input[type="text"]');
                if (cb && cb.checked && input && input.value.trim()) {
                    selected.push(input.value.trim());
                }
            });
            if (selected.length === 0) {
                alert('Nenhum item selecionado.');
                return;
            }
            const now = Date.now();
            selected.forEach((name, idx) => {
                shoppingList.push({
                    id: now + idx,
                    name,
                    price: 0,
                    quantity: 1,
                    category: '',
                    total: 0
                });
            });
            saveListToStorage();
            updateDisplay();
            closeImportPreview();
        }

        window.closeImportPreview = closeImportPreview;
        window.confirmImportSelection = confirmImportSelection;
  