from typing import List, Optional, Dict, Tuple, Any, Protocol, runtime_checkable
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class ModelProvider(Enum):
    """Enum for supported model providers."""

    OLLAMA = "ollama"
    GEMINI = "gemini"


@runtime_checkable
class LLMProvider(Protocol):
    """Protocol for LLM providers."""

    def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        options: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Send a chat request to the LLM provider."""
        ...


class Location(BaseModel):
    """Location information for JSON Resume format."""

    address: Optional[str] = None
    postalCode: Optional[str] = None
    city: Optional[str] = None
    countryCode: Optional[str] = None
    region: Optional[str] = None


class Profile(BaseModel):
    """Social profile information for JSON Resume format."""

    network: Optional[str] = None
    username: Optional[str] = None
    url: str


class Basics(BaseModel):
    """Basic information for JSON Resume format."""

    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    url: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[Location] = None
    profiles: Optional[List[Profile]] = None


class Work(BaseModel):
    """Work experience for JSON Resume format."""

    name: Optional[str] = None
    position: Optional[str] = None
    url: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    summary: Optional[str] = None
    highlights: Optional[List[str]] = None


class Volunteer(BaseModel):
    """Volunteer experience for JSON Resume format."""

    organization: Optional[str] = None
    position: Optional[str] = None
    url: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    summary: Optional[str] = None
    highlights: Optional[List[str]] = None


class Education(BaseModel):
    """Education information for JSON Resume format.

    NOTE: this is the JSON-Resume-standard *history entry* model (one row
    per institution attended, used by the section-extraction pipeline in
    pdf.py). It is unrelated to EducationScore below, which is the scoring
    agent's evaluation of that history against the intern rubric. Kept the
    name collision-free deliberately -- do not conflate the two.
    """

    institution: Optional[str] = None
    url: Optional[str] = None
    area: Optional[str] = None
    studyType: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    score: Optional[str] = None
    courses: Optional[List[str]] = None


class Award(BaseModel):
    """Award information for JSON Resume format."""

    title: Optional[str] = None
    date: Optional[str] = None
    awarder: Optional[str] = None
    summary: Optional[str] = None


class Certificate(BaseModel):
    """Certificate information for JSON Resume format."""

    name: Optional[str] = None
    date: Optional[str] = None
    issuer: Optional[str] = None
    url: Optional[str] = None


class Publication(BaseModel):
    """Publication information for JSON Resume format."""

    name: Optional[str] = None
    publisher: Optional[str] = None
    releaseDate: Optional[str] = None
    url: Optional[str] = None
    summary: Optional[str] = None


class Skill(BaseModel):
    """Skill information for JSON Resume format."""

    name: Optional[str] = None
    level: Optional[str] = None
    keywords: Optional[List[str]] = None


class Language(BaseModel):
    """Language information for JSON Resume format."""

    language: Optional[str] = None
    fluency: Optional[str] = None


class Interest(BaseModel):
    """Interest information for JSON Resume format."""

    name: Optional[str] = None
    keywords: Optional[List[str]] = None


class Reference(BaseModel):
    """Reference information for JSON Resume format."""

    name: Optional[str] = None
    reference: Optional[str] = None


class Project(BaseModel):
    """Project information for JSON Resume format."""

    name: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    url: Optional[str] = None
    technologies: Optional[List[str]] = None
    skills: Optional[List[str]] = None


class BasicsSection(BaseModel):
    """Basics section containing basic information."""

    basics: Optional[Basics] = None


class WorkSection(BaseModel):
    """Work section containing a list of work experiences."""

    work: Optional[List[Work]] = None


class EducationSection(BaseModel):
    """Education section containing a list of education entries."""

    education: Optional[List[Education]] = None


class SkillsSection(BaseModel):
    """Skills section containing a list of skill categories."""

    skills: Optional[List[Skill]] = None


class ProjectsSection(BaseModel):
    """Projects section containing a list of projects."""

    projects: Optional[List[Project]] = None


class AwardsSection(BaseModel):
    """Awards section containing a list of awards."""

    awards: Optional[List[Award]] = None


class InjectionFlags(BaseModel):
    """Prompt-injection suspicion, tracked across every pipeline stage that
    can detect it. Populated incrementally:

    - structural_* : set in pdf.py, from scan_pdf_for_structural_injection()
      (Stage 0 -- deterministic, PDF rendering metadata, no LLM). Always
      populated (or explicitly marked skipped) by the time JSONResume is
      constructed.
    - extraction_* : set in pdf.py, from the per-section extraction LLM
      calls, IF those prompts have been hardened to report it (Stage 1 --
      not yet wired up as of this version; defaults reflect "not checked",
      not "checked, found nothing").
    - aggregate_* : computed AFTER the scoring agent (Stage 2, EvaluationData
      below) has also run, via aggregate_injection_signal(). Not populated
      at JSONResume-construction time -- left at defaults until that step.

    See spec.md sections 11-12 for the full design and current limitations.
    """

    structural_suspected: bool = False
    structural_evidence: List[str] = Field(default_factory=list)
    structural_scan_skipped: bool = False
    structural_scan_skip_reason: Optional[str] = None

    extraction_suspected: bool = False
    extraction_evidence: List[str] = Field(default_factory=list)

    aggregate_detected: bool = False
    aggregate_evidence: List[str] = Field(default_factory=list)


class JSONResume(BaseModel):
    """Complete JSON Resume format model."""

    basics: Optional[Basics] = None
    work: Optional[List[Work]] = None
    volunteer: Optional[List[Volunteer]] = None
    education: Optional[List[Education]] = None
    awards: Optional[List[Award]] = None
    certificates: Optional[List[Certificate]] = None
    publications: Optional[List[Publication]] = None
    skills: Optional[List[Skill]] = None
    languages: Optional[List[Language]] = None
    interests: Optional[List[Interest]] = None
    references: Optional[List[Reference]] = None
    projects: Optional[List[Project]] = None
    # --- new fields below ---
    # Genuine section-parsing failure only. No longer implies injection --
    # see spec.md §12 for why conflating the two was actively harmful.
    formatting_issue: Optional[str] = None
    failed_sections: List[str] = Field(default_factory=list)
    injection_flags: InjectionFlags = Field(default_factory=InjectionFlags)


class CategoryScore(BaseModel):
    score: float = Field(ge=0, description="Score achieved in this category")
    max: int = Field(gt=0, description="Maximum possible score")
    evidence: str = Field(min_length=1, description="Evidence supporting the score")


class EducationTrack(str, Enum):
    """Matches the `track` enum in both resume_scoring_*.jinja prompts
    exactly. str-mixin used (unlike ModelProvider above) so these serialize
    as plain strings for clean round-tripping against LLM JSON output."""

    FORMAL_IT = "formal_it"
    RELATED_FIELD = "related_field"
    SELF_TAUGHT = "self_taught"
    UNRELATED = "unrelated"


class AcademicRequirementStatus(str, Enum):
    """Matches `academic_requirement_met` in the jinja prompts (Section 3.2
    -- the 65% hard gate, formal_it/related_field only)."""

    MET = "met"
    NOT_MET = "not_met"
    NOT_APPLICABLE = "not_applicable"
    UNCLEAR_NEEDS_REVIEW = "unclear_needs_review"


class ExperienceRequirementStatus(str, Enum):
    """Matches `experience_requirement_met` in the jinja prompts (Section
    3.3 -- the 24-month gate, self_taught only). NOT_APPLICABLE is always a
    literal string value here, never an empty string -- both jinja prompts
    were fixed to be explicit about this after an earlier inconsistency."""

    MET = "met"
    NOT_MET = "not_met"
    UNCLEAR_NEEDS_REVIEW = "unclear_needs_review"
    NOT_APPLICABLE = "not_applicable"


class EducationScore(CategoryScore):
    """Extends CategoryScore with the two hard-gate fields and track
    classification that Education carries and no other category does."""

    track: EducationTrack
    academic_requirement_met: AcademicRequirementStatus
    experience_requirement_met: ExperienceRequirementStatus


class Scores(BaseModel):
    education: EducationScore
    open_source: CategoryScore
    self_projects: CategoryScore
    production: CategoryScore
    technical_skills: CategoryScore


class BonusPoints(BaseModel):
    total: float = Field(ge=0, le=20, description="Total bonus points")
    breakdown: str = Field(description="Breakdown of bonus points")


# Deductions removed. Link/tutorial/CRUD penalties are now resolved entirely
# inside the Self Projects category score (jinja Section 5.3) -- a separate
# top-level deductions object would reintroduce the exact double-counting
# problem that restructure eliminated. If EvaluationData validation starts
# failing on an unexpected `deductions` key, that means an old, unrestructured
# prompt is still in use somewhere -- fix the prompt, not this model.


class EvaluationData(BaseModel):
    scores: Scores
    bonus_points: BonusPoints
    prompt_injection_detected: bool = Field(
        description="Whether the scoring agent detected an injection attempt "
        "in the resume content — see the Data / Instruction Boundary section "
        "of the scoring prompt"
    )
    prompt_injection_evidence: str = Field(
        description="Description of what was found; empty string if nothing detected"
    )
    key_strengths: List[str] = Field(min_items=1, max_items=5)
    # NOTE: was max_items=5, which was looser than the prompt's own stated
    # 1-3 range for areas_for_improvement -- tightened to match. A model
    # that's more permissive than the prompt it validates doesn't catch a
    # prompt violation if the LLM ever ignores the 1-3 instruction.
    areas_for_improvement: List[str] = Field(min_items=1, max_items=3)


# OPEN QUESTION, not resolved here: resume_scoring_recruiter.jinja's JSON
# output includes a top-level `candidate_name` field; resume_scoring_
# structured.jinja's does not, and neither does EvaluationData above. If
# both prompts' output are ever validated against this same model, the
# recruiter variant's candidate_name is silently dropped by Pydantic's
# default extra='ignore' behavior -- no error, just quiet data loss. Add a
# `candidate_name: Optional[str] = None` field here if that data is meant
# to survive, or confirm the recruiter prompt's output never actually
# reaches this model if it's tracked separately.


class GitHubProfile(BaseModel):
    """Pydantic model for GitHub profile data."""

    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    public_repos: Optional[int] = None
    followers: Optional[int] = None
    following: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    avatar_url: Optional[str] = None
    blog: Optional[str] = None
    twitter_username: Optional[str] = None
    hireable: Optional[bool] = None


class OllamaProvider:
    """Ollama LLM provider implementation."""

    def __init__(self):
        import ollama

        self.client = ollama

    def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        options: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Send a chat request to Ollama."""

        ollama_options = options.copy() if options else {}

        # remove steam from ollama options
        ollama_options.pop("stream", None)

        # Add num_ctx 32K context window to options
        ollama_options["num_ctx"] = 32768

        # convert to chat params
        chat_params = {
            "model": model,
            "messages": messages,
            "options": ollama_options,
        }

        # add it to top level
        if "stream" in kwargs:
            chat_params["stream"] = kwargs["stream"]

        if "format" in kwargs:
            chat_params["format"] = kwargs["format"]

        return self.client.chat(**chat_params)


class GeminiProvider:
    """Google Gemini API provider implementation."""

    def __init__(self, api_key: str):
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        self.client = genai

    def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        options: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Send a chat request to Google Gemini API."""
        import re
        import time
        import random
        from google.api_core.exceptions import ResourceExhausted

        MAX_RETRIES = 5
        BASE_DELAY = 10.0  # seconds — base for exponential backoff
        MAX_DELAY = 120.0  # cap so we never wait more than 2 minutes

        # Map options to Gemini parameters
        generation_config = {}
        if options:
            if "temperature" in options:
                generation_config["temperature"] = options["temperature"]
            if "top_p" in options:
                generation_config["top_p"] = options["top_p"]

        # Create a Gemini model
        gemini_model = self.client.GenerativeModel(
            model_name=model, generation_config=generation_config
        )

        # Convert messages to Gemini format
        gemini_messages = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_messages.append({"role": role, "parts": [msg["content"]]})

        for attempt in range(MAX_RETRIES):
            try:
                # Send the chat request
                response = gemini_model.generate_content(gemini_messages)

                # Convert Gemini response to Ollama-like format for compatibility
                return {"message": {"role": "assistant", "content": response.text}}

            except ResourceExhausted as e:
                if attempt == MAX_RETRIES - 1:
                    # All retries exhausted — re-raise the original exception.
                    # This surfaces unrecoverable quota errors (RPD, TPM, etc.)
                    # instead of silently failing or returning bad data.
                    raise

                # Parse the API-suggested retry delay from the error message
                match = re.search(r"retry[_ ]in\s+([\d.]+)s", str(e), re.IGNORECASE)
                api_hint = float(match.group(1)) if match else None

                # Exponential backoff: BASE_DELAY * 2^attempt, capped at MAX_DELAY
                exp_delay = min(BASE_DELAY * (2 ** attempt), MAX_DELAY)

                # Prefer the API hint when it is shorter than our computed delay
                delay = api_hint if (api_hint and api_hint < exp_delay) else exp_delay

                # Add ±20% randomized jitter to avoid thundering herd
                sleep_time = round(delay * random.uniform(0.8, 1.2), 2)

                print(
                    f"[GeminiProvider] Rate limit hit "
                    f"(attempt {attempt + 1}/{MAX_RETRIES}). "
                    f"Retrying in {sleep_time}s..."
                )
                time.sleep(sleep_time)


class YearAverage(BaseModel):
    year: int
    average: float


class ModuleMark(BaseModel):
    year: int
    name: str
    mark: float


class DegreeRecord(BaseModel):
    degree_name: str
    nqf_level: Optional[int] = None
    minimum_years: Optional[int] = None
    start_year: Optional[int] = None
    graduation_year: Optional[int] = None
    year_averages: Optional[List[YearAverage]] = None
    modules: Optional[List[ModuleMark]] = None


class TranscriptData(BaseModel):
    # Top-level fields (for backward compatibility and single-degree transcripts)
    degree_name: Optional[str] = None
    nqf_level: Optional[int] = None
    minimum_years: Optional[int] = None
    start_year: Optional[int] = None
    graduation_year: Optional[int] = None
    year_averages: Optional[List[YearAverage]] = None
    modules: Optional[List[ModuleMark]] = None
    
    # List of all degrees found in the transcript
    degrees: Optional[List[DegreeRecord]] = None


class TranscriptValidationResult(BaseModel):
    passed: bool
    reason: str
    extracted_data: Optional[TranscriptData] = None