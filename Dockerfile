FROM python:3.11-slim

# Keep the same backend/ nesting as the host repo (main.py resolves
# ../data relative to its own location), so /app/data lines up with the
# `./data:/app/data` bind mount in docker-compose.yml.
WORKDIR /app/backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
