FROM python:3.12-slim

WORKDIR /app

# PyMuPDF needs these system libs to build/run
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]