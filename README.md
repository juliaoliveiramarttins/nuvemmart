# ☁️ NuvemMart

E-commerce completo hospedado no GitHub Pages com armazenamento 100% na nuvem via **Azure Blob Storage** e **Azure Table Storage**.

🔗 **[Acesse a aplicação](https://juliaoliveiramarttins.github.io/nuvemmart/index.html)**

---

## Sobre o projeto

O NuvemMart é uma aplicação web de e-commerce desenvolvida como trabalho acadêmico, demonstrando a integração com os serviços de armazenamento do Microsoft Azure. Toda a persistência de dados — produtos, clientes, pedidos e imagens — é feita diretamente nos serviços Azure, sem back-end próprio.

---

## Funcionalidades

### 🛍️ Loja
- Catálogo de produtos com busca por marca, modelo e faixa de preço
- Página de detalhe do produto com seleção de quantidade
- Carrinho de compras com sidebar deslizante
- Checkout com escolha de método de pagamento (PIX, Cartão, Boleto) e entrega (PAC, SEDEX, Retirada)
- Validação de estoque em tempo real

### 👤 Clientes
- Cadastro e login via e-mail e CPF
- Área do cliente com histórico de pedidos
- Edição de dados pessoais

### 🏪 Vendedores
- Qualquer cliente pode se tornar vendedor com um clique
- Painel de anúncios com cadastro, edição e exclusão de produtos
- Upload de imagens direto para o Azure Blob Storage

### ⚙️ Painel Administrativo
- Gerenciamento completo de produtos (`/admin-produtos.html`)
- Gerenciamento de clientes com histórico de pedidos (`/admin-clientes.html`)
- Listagem de pedidos com métricas de receita e ticket médio (`/admin-pedidos.html`)

---

## Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| HTML, CSS, JavaScript | Front-end estático |
| Azure Blob Storage | Armazenamento de imagens dos produtos |
| Azure Table Storage | Banco de dados (Produtos, Clientes, Pedidos) |
| GitHub Pages | Hospedagem da aplicação |

---

## Arquitetura

```
Browser (HTML/CSS/JS)
        │
        ├── Azure Blob Storage  →  imagens dos produtos
        │
        └── Azure Table Storage →  Produtos
                                   Clientes
                                   Pedidos
```

Não há back-end — o JavaScript acessa os serviços Azure diretamente via API REST autenticada com SAS Token.

---

## Estrutura de arquivos

```
nuvemmart/
├── index.html              # Homepage
├── produtos.html           # Catálogo com filtros
├── produto.html            # Detalhe do produto
├── login.html              # Login e cadastro
├── checkout.html           # Finalização de compra
├── minha-conta.html        # Área do cliente
├── seja-vendedor.html      # Página de adesão de vendedor
├── vendedor.html           # Painel do vendedor
├── admin-produtos.html     # Admin — produtos
├── admin-clientes.html     # Admin — clientes
├── admin-pedidos.html      # Admin — pedidos
├── css/
│   └── style.css           # Design system completo
└── js/
    ├── azure-config.js     # Configuração e API Azure
    ├── services.js         # Camada de dados
    └── ui.js               # Componentes de interface
```

---

## Como executar localmente

```bash
# Clone o repositório
git clone https://github.com/juliaoliveiramarttins/nuvemmart.git

# Entra na pasta
cd nuvemmart

# Sobe servidor local
python -m http.server 8080
```

Acessa em `http://localhost:8080`.

---

## Configuração Azure

A aplicação utiliza a conta de armazenamento `stocompnuvem2p1` com as seguintes tabelas:

- `JuliaProdutos` — cadastro de produtos
- `JuliaClientes` — cadastro de clientes
- `JuliaPedidos` — registro de pedidos

E o container Blob `julia-imagens` para armazenamento das fotos dos produtos.

---

*Desenvolvido por Julia Martins — Computação em Nuvem*
