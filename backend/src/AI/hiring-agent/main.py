from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from job_queue import InMemoryJobQueue
from workers.hiring_agent_worker import run_forever
from notify import router as notify_router

"""
Consumes candidate IDs off the queue, runs the existing hiring-agent
pipeline against them, and posts results back to the .NET backend.

Calls into hiring_agent/ and client/backend_client.py as-is —
no modifications to either.
"""
import logging

from backend_client import get_resume
from hiring_agent.score import run_evaluation  # the function you already extracted

logger = logging.getLogger(__name__)




async def run_forever(queue: JobQueue):
    while True:
        candidate_id = await queue.dequeue()
        try:
            resume = get_resume(candidate_id)
            result = run_evaluation(resume.document_url)
            # TODO: post result back to .NET — separate decision, see note below
            logger.info(f"Processed candidate {candidate_id}")
        except Exception as e:
            logger.error(f"Failed processing candidate {candidate_id}: {e}")
            # MVP1: no DLQ, no retry — job is just lost. Logged so it's visible.
_queue = InMemoryJobQueue()

def get_queue():
    return _queue

@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(run_forever(_queue))
    yield
    worker_task.cancel()

app = FastAPI(lifespan=lifespan)
app.include_router(notify_router)