# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]: 🛒
    - heading "Lista de Compras" [level=1] [ref=e6]
    - paragraph [ref=e7]: Organize suas compras com praticidade, tema escuro e resumo de gastos.
    - list [ref=e8]:
      - listitem [ref=e9]: ✅ Adicione itens com preço, quantidade e categoria
      - listitem [ref=e10]: ✅ Filtros por categoria e total automático
      - listitem [ref=e11]: ✅ Dados salvos no seu navegador
  - generic [ref=e12]:
    - heading "Entrar" [level=2] [ref=e13]
    - generic [ref=e14]:
      - generic [ref=e15]: "Usuário:"
      - textbox "Usuário:" [ref=e16]: admin
    - generic [ref=e17]:
      - generic [ref=e18]: "Senha:"
      - generic [ref=e19]:
        - textbox "Senha:" [ref=e20]: "123456"
        - button "👁️" [ref=e21] [cursor=pointer]
    - generic [ref=e22]:
      - checkbox "Manter conectado" [ref=e23]
      - generic [ref=e24]: Manter conectado
    - button "Entrar" [active] [ref=e25] [cursor=pointer]
    - paragraph [ref=e26]:
      - link "Criar conta" [ref=e27] [cursor=pointer]:
        - /url: register.html
      - text: ·
      - link "Esqueci minha senha" [ref=e28] [cursor=pointer]:
        - /url: forgot.html
    - generic [ref=e29]: Usuário ou senha incorretos.
```