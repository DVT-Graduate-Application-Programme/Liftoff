from job_queue import InMemoryJobQueue, JobQueue

_queue = InMemoryJobQueue()

def get_queue() -> JobQueue:
    return _queue