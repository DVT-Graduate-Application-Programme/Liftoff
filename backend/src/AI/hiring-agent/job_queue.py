from abc import ABC, abstractmethod
from uuid import UUID
import asyncio

class JobQueue(ABC):
    @abstractmethod
    async def enqueue(self, candidate_id: UUID) -> None: ...
    @abstractmethod
    async def dequeue(self) -> UUID: ...


class InMemoryJobQueue(JobQueue):
    def __init__(self):
        self._queue: asyncio.Queue[UUID] = asyncio.Queue()

    async def enqueue(self, candidate_id: UUID) -> None:
        await self._queue.put(candidate_id)

    async def dequeue(self) -> UUID:
        return await self._queue.get()