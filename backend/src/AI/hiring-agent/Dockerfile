# backend/src/AI/hiring-agent/Dockerfile
#
#   --target development   uvicorn --reload, DEVELOPMENT_MODE=True. Writes
#                          resume_evaluations.csv and caches extraction JSON under cache/.
#   --target production    no reload, DEVELOPMENT_MODE=False. Default target.
#
# Both targets run as the non-root appuser, set in the base stage.
#
# Both targets stay on a single uvicorn worker: job_queue.InMemoryJobQueue is an
# asyncio.Queue living in the process, so a second worker would hold a queue the notified
# one cannot see. The same constraint pins the Container App to one replica — see
# infrastructure/azure/compute.tf.

FROM python:3.12-slim AS base

WORKDIR /app

# PyMuPDF needs these system libs to build/run; tesseract-ocr powers the scanned-PDF OCR fallback
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    build-essential \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root in both targets, matching backend/Dockerfile and worker/Dockerfile, which set
# their user in the shared runtime stage. /app is chowned because DEVELOPMENT_MODE=True
# writes resume_evaluations.csv and cache/ here.
RUN useradd --no-create-home --shell /bin/false appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

# ── Development ───────────────────────────────────────────────────────────────

FROM base AS development
ENV DEVELOPMENT_MODE=True
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# ── Production (default) ──────────────────────────────────────────────────────

FROM base AS production

# The evaluation CSV and the extraction cache are local-development aids; in a deployed
# replica they are lost on every revision and only serve to fill the writable layer.
ENV DEVELOPMENT_MODE=False

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
