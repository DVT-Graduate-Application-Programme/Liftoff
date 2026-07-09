import os
import httpx
import sys
from pathlib import Path

from pydantic import BaseModel
from typing import Optional

BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:5000")

from pydantic.alias_generators import to_camel

class Resume(BaseModel):
    id: int
    candidate_name: str
    document_url: str
    transcript_url: Optional[str] = None

    model_config = {"alias_generator": to_camel, "populate_by_name": True}

def get_resume(resume_id: int) -> Resume:
    """
    Fetches a single ResumeDto from the .NET API and returns it
    as a typed Resume object, ready to pass to the hiring agent.
    """
    url = f"{BACKEND_BASE_URL}/api/resumes/{resume_id}"

    with httpx.Client() as client:
        response = client.get(url)
        response.raise_for_status()

    return Resume.model_validate(response.json())


def get_all_resumes() -> list[Resume]:
    """
    Fetches all resumes — use this if the agent processes a queue
    rather than being triggered per-resume.
    """
    url = f"{BACKEND_BASE_URL}/api/resumes"

    with httpx.Client() as client:
        response = client.get(url)
        response.raise_for_status()

    return [Resume.model_validate(item) for item in response.json()]



## to test it out:

## from client-api.backend_client import get_resume

# resume = get_resume(resume_id=1)