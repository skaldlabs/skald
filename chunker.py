from chonkie import RecursiveChunker
chunker = RecursiveChunker.from_recipe("markdown", chunk_size=4096, min_characters_per_chunk=128)



text = """
# Skald

Memória organizacional. Uma plataforma de base de conhecimento com chat alimentado por IA, colaboração em documentos e capacidades de RAG.

## Visão Geral da Arquitetura

O Skald requer três componentes principais:

1. **Provedor de LLM** - Para respostas de chat e geração de texto (OpenAI, Claude, Gemini ou auto-hospedado)
2. **Provedor de Embeddings** - Para busca vetorial (Voyage AI ou auto-hospedado com sentence_transformers)
3. **Banco de Dados Vetorial** - Para busca por similaridade (PostgreSQL com extensão pgvector)

**Stack Atual:**
- **LLM:** OpenAI (configurável por organização, suporta modelos auto-hospedados)
- **Embeddings:** Voyage AI (recomendado pela Anthropic, mais barato que OpenAI, ou auto-hospedado)
- **BD Vetorial:** PostgreSQL com pgvector (mais simples e econômico que Pinecone)

## Configuração do Ambiente de Desenvolvimento Local

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL com **extensão pgvector** ([guia de instalação](https://github.com/pgvector/pgvector#installation))
- Redis (message broker do Celery)
- Docker (para armazenamento de objetos MinIO)
- pnpm
- Chaves de API: Voyage AI, OpenAI (ou configure alternativas auto-hospedadas)

### Configuração do Backend

Este projeto usa `uv` (https://github.com/astral-sh/uv) para gerenciamento de dependências.

**1. Criar e ativar ambiente virtual:**

```sh
uv venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
```

**2. Instalar dependências:**

```sh
uv pip install -e .
```

**3. Configurar variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto com estas variáveis obrigatórias:

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:password@localhost:5432/skald

# Django
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=1

# Redis (broker do Celery)
CELERY_BROKER_URL=redis://localhost:6379/0

# IA/Embeddings
VOYAGE_API_KEY=sua-chave-api-voyage
OPENAI_API_KEY=sua-chave-api-openai
DEFAULT_VOYAGE_CREATE_EMBEDDING_MODEL=voyage-3.5-lite
DEFAULT_VOYAGE_SEARCH_MODEL=voyage-3.5-lite
DEFAULT_CREATE_EMBEDDING_VECTOR_DIMENSION=1024
DEFAULT_SEARCH_EMBEDDING_VECTOR_DIMENSION=1024

# Armazenamento de Objetos (MinIO localmente)
AWS_S3_ENDPOINT_URL=http://localhost:9000
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=password
AWS_STORAGE_BUCKET_NAME=skald

# Email (opcional para desenvolvimento local)
RESEND_API_KEY=sua-chave-api-resend
EMAIL_VERIFICATION_ENABLED=0  # Desabilitar para facilitar testes locais

# Frontend
FRONTEND_URL=http://localhost:5173

# Colaboração (somente se testando colaboração em tempo real)
HOCUSPOCUS_SERVER_SECRET=unsafe-hocuspocus-secret
```

**4. Iniciar MinIO (armazenamento de objetos):**

```sh
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=password" \
  minio/minio server /data --console-address ":9001"
```

Acesse o console do MinIO em http://localhost:9001 e crie um bucket chamado `skald`.

**5. Instalar extensão pgvector:**

Certifique-se de que o pgvector está instalado no seu banco de dados PostgreSQL antes de executar as migrações. Siga o [guia de instalação do pgvector](https://github.com/pgvector/pgvector#installation).

**6. Executar migrações:**

```sh
python manage.py makemigrations skald
python manage.py migrate
```

**7. Criar superusuário (opcional):**

```sh
python manage.py createsuperuser
```

**8. Executar servidor de desenvolvimento Django:**

```sh
DEBUG=1 python manage.py runserver
```

O servidor estará disponível em http://localhost:8000

**9. Executar workers do Celery (em terminais separados):**

Worker principal:
```sh
celery -A skald worker --pool=solo -l info -Q default
```

Para tarefas em segundo plano com agendador beat (opcional):
```sh
celery -A skald beat -l info
```

### Configuração do Frontend

O frontend é uma aplicação React + TypeScript usando Vite e Zustand para gerenciamento de estado.

**1. Instalar dependências:**

```sh
pnpm install
```

**2. Executar servidor de desenvolvimento:**

```sh
pnpm run dev
```

O frontend estará disponível em http://localhost:5173

### Configuração do Servidor de Colaboração (Opcional)

Necessário apenas se estiver testando recursos de edição colaborativa em tempo real.

**1. Navegar para o diretório do servidor de colaboração:**

```sh
cd collaboration-server
```

**2. Instalar dependências:**

```sh
pnpm install
```

**3. Configurar variáveis de ambiente:**

Crie `.env` em `collaboration-server/`:

```env
DEBUG=true
HOCUSPOCUS_SERVER_SECRET=unsafe-hocuspocus-secret  # Deve corresponder ao app Django
HOCUSPOCUS_SERVER_PORT=1234
```

**4. Executar o servidor:**

```sh
pnpm run dev
```

O servidor de colaboração estará disponível em http://localhost:1234

### crawl4ai

Para usar o `crawl4ai` você precisa executar um comando de configuração uma vez após a instalação. Isso é necessário atualmente se você quiser usar a integração de web scraper.

```sh
crawl4ai-setup
```

Mais informações: https://github.com/unclecode/crawl4ai
"""

# Initialize the recursive chunker to chunk Markdown
chunker = RecursiveChunker.from_recipe("markdown", chunk_size=4096, min_characters_per_chunk=128)

chunks = chunker.chunk(text)

for chunk in chunks:
    print('--------------------------------', '\n')
    print(f"Chunk text: {chunk.text}")
    print(f"Token count: {chunk.token_count}")