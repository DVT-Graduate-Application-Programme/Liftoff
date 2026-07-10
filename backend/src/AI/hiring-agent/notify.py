from fastapi import APIRouter, Depends
from pydantic import BaseModel
from job_queue import JobQueue

from main import get_queue

router = APIRouter()

class NotifyRequest(BaseModel):
    candidate_id: int



@router.post("/notify", status_code=202)
async def notify(payload: NotifyRequest, queue: JobQueue = Depends(get_queue)):
    await queue.enqueue(payload.candidate_id)
    return {"status": "PENDING", "candidate_id": payload.candidate_id}