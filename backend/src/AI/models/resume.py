from pydantic import BaseModel
from typing import Optional

class Resume(BaseModel):
    id: int
    candidate_name: str
    document_url: str
    transcript_url: Optional[str] = None

    class Config:
        # Maps .NET's camelCase JSON keys to Python snake_case fields
        alias_generator = lambda field: (
            field[0].lower() + ''.join(
                c.upper() if field[i-1] == '_' else c
                for i, c in enumerate(field)
                if c != '_'
            )
        )
        populate_by_name = True