# GameGPT Backend 


## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Application configuration
│   │   └── logging_config.py  # Logging setup
│   ├── models/
│   │   └── game_schemas.py    # Pydantic models
│   ├── services/
│   │   ├── prompt_builder.py     # Builds therapeutic prompts
│   │   ├── llm_service.py        # Gemini API integration
│   │   └── response_processor.py # Processes LLM responses
│   └── __init__.py
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Features

- **Gemini Integration**: Optimized for Google Gemini AI
- **Modular Architecture**: Clean separation of concerns
- **Comprehensive Validation**: Pydantic models for type safety
- **Therapeutic Focus**: Evidence-based mental wellness games
- **Error Handling**: Robust error handling and logging
- **Health Checks**: Service status monitoring

## Quick Start

### 1. Installation

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configuration

Copy the environment template and configure your API keys:

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.

## API Endpoints

### `POST /generate`
Generate a therapeutic game from a text prompt.

**Request:**
```json
{
  "prompt": "A quiz about recognizing and managing stress for teens"
}
```

**Response:**
```json
{
  "id": "game-20241203-1234",
  "title": "Stress Management Quiz for Teens",
  "description": "Learn effective stress management techniques",
  "type": "quiz",
  "difficulty": "medium",
  "category": "stress-reduction",
  // ... full game schema
}
```

### `GET /health`
Health check endpoint for all services.

### `POST /generate/debug`
Debug endpoint that returns intermediate processing steps.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | - |
| `GOOGLE_MODEL` | Gemini model to use | `gemini-2.0-flash-exp` |
| `MAX_TOKENS` | Maximum tokens per request | `4000` |
| `TEMPERATURE` | LLM temperature | `0.7` |
| `DEBUG` | Debug mode | `true` |
| `PORT` | Server port | `8000` |

### Gemini Setup

1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set up your environment:

```bash
GOOGLE_API_KEY=AIza...
GOOGLE_MODEL=gemini-2.0-flash-exp
```

## Game Types Supported

The backend generates 11 different therapeutic game types:

1. **Quiz** - Multiple choice mental wellness questions
2. **Drag-Drop** - Interactive categorization
3. **Memory Match** - Card matching for concepts
4. **Word Puzzle** - Therapeutic vocabulary crosswords
5. **Sorting** - Category-based organization
6. **Matching** - Connect problems with solutions
7. **Story Sequence** - Order therapeutic processes
8. **Fill Blank** - Complete therapeutic statements
9. **Card Flip** - Flashcard learning
10. **Puzzle Assembly** - Visual concept puzzles
11. **Anxiety Adventure** - Branching coping scenarios

## Therapeutic Categories

- Mental Wellness
- Coping Skills
- Emotional Intelligence
- Mindfulness
- Anxiety Management
- Depression Support
- Stress Reduction
- Self-Care
- Cognitive Behavioral
- Interpersonal Skills

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
flake8 .
```

### Adding New LLM Providers

To add additional LLM providers in the future:

1. Add configuration to `app/core/config.py`
2. Implement the provider method in `app/services/llm_service.py`
3. Update the provider routing in `generate_response()`

### Adding New Game Types

1. Add the new type to the Literal type in `app/models/game_schemas.py`
2. Create content model classes for the new game type
3. Add validation logic in `app/services/response_processor.py`
4. Update the prompt template in `app/services/prompt_builder.py`

## Production Deployment

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment
- Set `DEBUG=false`
- Use proper secrets management for API keys
- Configure reverse proxy (nginx)
- Set up SSL/TLS certificates
- Enable rate limiting
- Configure logging aggregation

## License

This project is part of the GameGPT initiative for therapeutic game generation.
