FROM python:3.11-slim

WORKDIR /app

COPY packages/data-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir fastapi uvicorn

COPY packages/data-engine/src ./src

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]