from pydantic import BaseModel

class Resume(BaseModel):
    id: int
    candidate_name: str
    document_url: str

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