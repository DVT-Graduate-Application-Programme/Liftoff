# main.py
from contextlib import asynccontextmanager
import asyncio
import logging
from fastapi import FastAPI
from dependency import get_queue
from job_queue import JobQueue
from notify import router as notify_router
from score import process_candidate

logger = logging.getLogger(__name__)

async def run_forever(queue: JobQueue):
    while True:
        candidate_id = await queue.dequeue()
        try:
            await asyncio.to_thread(process_candidate, candidate_id)
            logger.info(f"Processed candidate {candidate_id}")
        except Exception as e:
            logger.error(f"Failed processing candidate {candidate_id}: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(run_forever(get_queue()))
    yield
    worker_task.cancel()

app = FastAPI(lifespan=lifespan)
app.include_router(notify_router)