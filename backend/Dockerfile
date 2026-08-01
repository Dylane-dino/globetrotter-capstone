FROM python:3.12-slim

WORKDIR /app

# System deps needed to build bcrypt/cryptography wheels on some platforms
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY data ./data

# JWT secret MUST be overridden at runtime in anything beyond local dev -
# see docker-compose.yml / README.
ENV JWT_SECRET_KEY=dev-only-secret-change-me-in-production
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
