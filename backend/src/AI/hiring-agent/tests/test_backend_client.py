import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4, UUID
import httpx

from backend_client import (
    send_eval,
    get_resume,
    get_all_resumes,
    Resume,
    ResumeEvaluationPayload,
    BACKEND_BASE_URL,
    MAX_RETRIES,
    BASE_BACKOFF_SECONDS,
    RetryStatusCodes,
)
from models import (
    EvaluationData,
    CategoryScore,
    EducationScore,
    Scores,
    BonusPoints,
    EducationTrack,
    AcademicRequirementStatus,
    ExperienceRequirementStatus,
)


def make_response(status_code: int = 200, json_data=None, text: str = "", method: str = "GET", url: str = "http://localhost"):
    """Helper to create a fully formed httpx.Response attached to an httpx.Request."""
    req = httpx.Request(method, url)
    if json_data is not None:
        return httpx.Response(status_code, json=json_data, request=req)
    return httpx.Response(status_code, text=text, request=req)


def create_mock_async_client():
    """Helper to build a mocked httpx.AsyncClient context manager."""
    client = MagicMock(spec=httpx.AsyncClient)
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    return client


@pytest.fixture
def dummy_eval_data():
    """Fixture providing a valid EvaluationData object for payload testing."""
    return EvaluationData(
        scores=Scores(
            education=EducationScore(
                score=8.0,
                max=10,
                evidence="BSc Computer Science",
                track=EducationTrack.FORMAL_IT,
                academic_requirement_met=AcademicRequirementStatus.MET,
                experience_requirement_met=ExperienceRequirementStatus.NOT_APPLICABLE,
            ),
            open_source=CategoryScore(
                score=25.0, max=35, evidence="Contributed to GitHub repos"
            ),
            self_projects=CategoryScore(
                score=20.0, max=30, evidence="Built 2 side projects"
            ),
            production=CategoryScore(
                score=20.0, max=25, evidence="Built production app"
            ),
            technical_skills=CategoryScore(
                score=8.0, max=10, evidence="Python and SQL"
            ),
        ),
        bonus_points=BonusPoints(total=5.0, breakdown="Active contributor"),
        prompt_injection_detected=False,
        prompt_injection_evidence="",
        key_strengths=["Strong programming background"],
        areas_for_improvement=["More open source contributions"],
    )


class TestResumeModels:
    def test_resume_model_alias_parsing(self):
        """Test parsing Resume from backend JSON with camelCase fields."""
        candidate_id = uuid4()
        raw_json = {
            "id": str(candidate_id),
            "messageId": str(candidate_id),
            "candidateName": "John Doe",
            "documentUrl": "http://localhost:5000/api/applications/123/cv",
            "transcriptUrl": "http://localhost:5000/api/applications/123/transcript",
        }

        resume = Resume.model_validate(raw_json)
        assert resume.id == candidate_id
        assert resume.candidate_name == "John Doe"
        assert resume.document_url == "http://localhost:5000/api/applications/123/cv"
        assert (
            resume.transcript_url
            == "http://localhost:5000/api/applications/123/transcript"
        )


class TestSendEvalPayloadAndRetry:
    @pytest.mark.asyncio
    async def test_send_eval_payload_formatting(self, dummy_eval_data):
        """Test send_eval formats the request payload correctly, including application_id and institution."""
        candidate_id = uuid4()
        institution = {
            "name": "University of Cape Town",
            "degree_name": "BSc Computer Science",
            "academic_average": 78.5,
        }

        mock_response = make_response(200, json_data={"status": "ok"}, method="POST")
        mock_client = create_mock_async_client()
        mock_client.post = AsyncMock(return_value=mock_response)

        with patch("httpx.AsyncClient", return_value=mock_client):
            res = await send_eval(
                eval_data=dummy_eval_data,
                message_id=candidate_id,
                prompt_version="v1.0",
                institution=institution,
            )

        assert res.status_code == 200
        mock_client.post.assert_called_once()

        call_args, call_kwargs = mock_client.post.call_args
        assert call_args[0] == f"{BACKEND_BASE_URL}/internal/evaluation"

        posted_json = call_kwargs["json"]
        assert posted_json["application_id"] == str(candidate_id)
        assert posted_json["institution"] == institution
        assert "scores" in posted_json
        assert "bonus_points" in posted_json
        assert posted_json["prompt_injection_detected"] is False

    @pytest.mark.asyncio
    async def test_send_eval_retry_on_502_503_504_then_succeed(self, dummy_eval_data):
        """Test send_eval retries on gateway errors (502, 503, 504) and succeeds when server recovers."""
        candidate_id = uuid4()

        mock_503 = make_response(503, text="Service Unavailable", method="POST")
        mock_502 = make_response(502, text="Bad Gateway", method="POST")
        mock_200 = make_response(200, json_data={"status": "ok"}, method="POST")

        mock_client = create_mock_async_client()
        mock_client.post = AsyncMock(side_effect=[mock_503, mock_502, mock_200])

        with patch("httpx.AsyncClient", return_value=mock_client), patch(
            "asyncio.sleep", new_callable=AsyncMock
        ) as mock_sleep:
            res = await send_eval(
                eval_data=dummy_eval_data,
                message_id=candidate_id,
                prompt_version="v1.0",
            )

        assert res.status_code == 200
        assert mock_client.post.call_count == 3
        # Should backoff: 2.0s on attempt 1, 4.0s on attempt 2
        assert mock_sleep.call_count == 2
        mock_sleep.assert_any_call(2.0)
        mock_sleep.assert_any_call(4.0)

    @pytest.mark.asyncio
    async def test_send_eval_max_retries_exceeded(self, dummy_eval_data):
        """Test send_eval raises RuntimeError when max retries (3) are exhausted on 503 errors."""
        candidate_id = uuid4()
        mock_503 = make_response(503, text="Service Unavailable", method="POST")

        mock_client = create_mock_async_client()
        mock_client.post = AsyncMock(return_value=mock_503)

        with patch("httpx.AsyncClient", return_value=mock_client), patch(
            "asyncio.sleep", new_callable=AsyncMock
        ):
            with pytest.raises(RuntimeError) as exc_info:
                await send_eval(
                    eval_data=dummy_eval_data,
                    message_id=candidate_id,
                    prompt_version="v1.0",
                )

        assert "Backend rejected evaluation for message_id" in str(exc_info.value)
        assert "503" in str(exc_info.value)
        assert mock_client.post.call_count == MAX_RETRIES

    @pytest.mark.asyncio
    async def test_send_eval_non_retryable_400_error(self, dummy_eval_data):
        """Test send_eval immediately fails without retry on non-retryable status code like 400 Bad Request."""
        candidate_id = uuid4()
        mock_400 = make_response(400, text="Invalid JSON payload", method="POST")

        mock_client = create_mock_async_client()
        mock_client.post = AsyncMock(return_value=mock_400)

        with patch("httpx.AsyncClient", return_value=mock_client), patch(
            "asyncio.sleep", new_callable=AsyncMock
        ) as mock_sleep:
            with pytest.raises(RuntimeError) as exc_info:
                await send_eval(
                    eval_data=dummy_eval_data,
                    message_id=candidate_id,
                    prompt_version="v1.0",
                )

        assert "Backend rejected evaluation for message_id" in str(exc_info.value)
        assert "400" in str(exc_info.value)
        assert mock_client.post.call_count == 1
        mock_sleep.assert_not_called()


class TestGetResumeAndGetAllResumes:
    @pytest.mark.asyncio
    async def test_get_resume_with_transcript(self):
        """Test get_resume when transcript exists (200 status code)."""
        candidate_id = uuid4()

        mock_meta_res = make_response(200, json_data={"candidateName": "Jane Smith"})
        mock_trans_res = make_response(200, json_data={"status": "available"})

        mock_client = create_mock_async_client()
        async def mock_get(url):
            if "applicant" in url:
                return mock_meta_res
            return mock_trans_res

        mock_client.get = AsyncMock(side_effect=mock_get)

        with patch("httpx.AsyncClient", return_value=mock_client):
            resume = await get_resume(candidate_id)

        assert resume.id == candidate_id
        assert resume.candidate_name == "Jane Smith"
        assert resume.document_url == f"{BACKEND_BASE_URL}/api/applications/{candidate_id}/cv"
        assert resume.transcript_url == f"{BACKEND_BASE_URL}/api/applications/{candidate_id}/transcript"

    @pytest.mark.asyncio
    async def test_get_resume_transcript_404(self):
        """Test get_resume sets transcript_url to None when transcript check returns 404."""
        candidate_id = uuid4()

        mock_meta_res = make_response(200, json_data={"candidateName": "Alice Johnson"})
        mock_trans_res = make_response(404, text="Not Found")

        mock_client = create_mock_async_client()
        async def mock_get(url):
            if "applicant" in url:
                return mock_meta_res
            return mock_trans_res

        mock_client.get = AsyncMock(side_effect=mock_get)

        with patch("httpx.AsyncClient", return_value=mock_client):
            resume = await get_resume(candidate_id)

        assert resume.id == candidate_id
        assert resume.candidate_name == "Alice Johnson"
        assert resume.transcript_url is None

    @pytest.mark.asyncio
    async def test_get_all_resumes(self):
        """Test get_all_resumes fetches list of resumes from backend."""
        id1, id2 = uuid4(), uuid4()
        raw_list = [
            {
                "id": str(id1),
                "candidateName": "Candidate 1",
                "documentUrl": "http://cv1.pdf",
            },
            {
                "id": str(id2),
                "candidateName": "Candidate 2",
                "documentUrl": "http://cv2.pdf",
            },
        ]

        mock_res = make_response(200, json_data=raw_list)
        mock_client = create_mock_async_client()
        mock_client.get = AsyncMock(return_value=mock_res)

        with patch("httpx.AsyncClient", return_value=mock_client):
            resumes = await get_all_resumes()

        assert len(resumes) == 2
        assert resumes[0].id == id1
        assert resumes[0].candidate_name == "Candidate 1"
        assert resumes[1].id == id2
        assert resumes[1].candidate_name == "Candidate 2"
