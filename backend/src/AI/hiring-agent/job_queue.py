from abc import ABC, abstractmethod

class JobQueue(ABC):
    @abstractmethod
    async def enqueue(self, candidate_id: int) -> None: ...   # or UUID, pending that Guid decision

    @abstractmethod
    async def dequeue(self) -> int:  ...

import asyncio

class InMemoryJobQueue(JobQueue):
    def __init__(self):
        self._queue: asyncio.Queue[int] = asyncio.Queue()

    async def enqueue(self, candidate_id: int) -> None:
        await self._queue.put(candidate_id)

    async def dequeue(self) -> int:
        return await self._queue.get()