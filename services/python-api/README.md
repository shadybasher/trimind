# Trimind Python API Service

Python microservice for AI processing capabilities.

## Features

- **LLMLingua-2 Compression**: Prompt compression using state-of-the-art transformer model
- **Intent Router**: Resilient LLM intent classification with circuit breaker pattern
- **Zero Trust Security**: Shared secret authentication for all endpoints
- **Async Architecture**: BullMQ integration for background task processing

## Setup

### Prerequisites

- Python 3.11+
- pip

### Installation

```bash
# Navigate to Python service directory
cd services/python-api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `services/python-api` directory:

```env
# Security
SHARED_SECRET=your-secure-shared-secret

# OpenAI (Primary for Intent Router)
OPENAI_API_KEY=sk-...

# Anthropic (Fallback for Intent Router)
ANTHROPIC_API_KEY=sk-ant-...

# Optional Configuration
DEBUG=false
```

## Running

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_compression.py

# Run with VCR.py recording (only for cassette creation)
pytest --record-mode=once
```

## API Documentation

Once running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

- **FastAPI**: Modern async Python web framework
- **LiteLLM**: Universal LLM API abstraction
- **Circuit Breaker**: Resilience pattern for LLM failover
- **VCR.py**: Deterministic HTTP testing with cassettes
