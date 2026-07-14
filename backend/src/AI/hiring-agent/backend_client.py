import os
import httpx
import sys
from pathlib import Path
import time
from pydantic import BaseModel
from typing import Optional
from models import  EvaluationData
from uuid import UUID

BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:5000")

from pydantic.alias_generators import to_camel

REQUEST_TIMEOUT = httpx.Timeout(connect=5.0, read=15.0, write=10.0, pool=5.0)
 
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 2.0


## only retry when there are network failures, while upholding indemptocy checks
RetryStatusCodes = {502, 503, 504}

class ResumeEvaluationPayload(BaseModel):
    """Request body contract for POST /api/resumes.
    message_id ties this evaluation back to the PENDING record the Ingest
    API already created — the backend must treat this as an update keyed
    by message_id, not a new insert.
    """
 
    message_id: str
    prompt_version: str
    evaluation: EvaluationData

class Resume(BaseModel):
    id: UUID
    message_id: str
    candidate_name: str
    document_url: str
    transcript_url: Optional[str] = None

    model_config = {"alias_generator": to_camel, "populate_by_name": True}


def get_resume(candidate_id: UUID) -> Resume:
    url = f"{BACKEND_BASE_URL}/api/applications/{candidate_id}/applicant"
    with httpx.Client() as client:
        response = client.get(url)
        response.raise_for_status()
        metadata = response.json()

        cv_url = f"{BACKEND_BASE_URL}/api/applications/{candidate_id}/cv"
        transcript_url = f"{BACKEND_BASE_URL}/api/applications/{candidate_id}/transcript"

        transcript_check = client.head(transcript_url) # if transript is available 
        if transcript_check.status_code == 404:
            transcript_url = None

    return Resume(
        id=candidate_id,
        candidate_name=metadata.get("candidateName", "Unknown"),
        document_url=cv_url,
        transcript_url=transcript_url,
    )


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


def send_eval(eval_data: EvaluationData, message_id: str, prompt_version: str):
    """
    After AI has completed processing, return results and post to API ingest layer.
    message_id must be the ID returned by the C# Ingest API when the PENDING record was created.
    """
    url = f"{BACKEND_BASE_URL}/internal/evaluation"

 
    eval_dict = eval_data.model_dump(mode="json")

    final_payload = {
        "application_id": message_id,
        **eval_dict # This unpacks scores, bonus_points, key_strengths, etc. into the root
    }

    ## TODO: add auth token check on endpoint

    with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = client.post(
                    url,
                    json=final_payload,
                )

                if response.status_code == 400:
                    print(f"Backend validation error: {response.text}")

                if response.status_code < 300:
                    return response

                if response.status_code in RetryStatusCodes and attempt < MAX_RETRIES:
                    delay_time = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
                    time.sleep(delay_time)
                    continue

                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise RuntimeError(
                    f"Backend rejected evaluation for message_id={message_id}: "
                    f"{exc.response.status_code} {exc.response.text}"
                ) from exc

    
