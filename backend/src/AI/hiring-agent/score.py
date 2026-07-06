import os
import sys
import json
import logging
import csv
from pdf import PDFHandler
from github import fetch_and_display_github_info
from models import JSONResume, EvaluationData, TranscriptData, TranscriptValidationResult
from typing import List, Optional, Dict
from evaluator import ResumeEvaluator
from pathlib import Path
from prompt import DEFAULT_MODEL, MODEL_PARAMETERS
from transform import (
    transform_evaluation_response,
    convert_json_resume_to_text,
    convert_github_data_to_text,
    convert_blog_data_to_text,
)
from config import DEVELOPMENT_MODE




from backend_client import get_resume, get_all_resumes, BACKEND_BASE_URL


logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)5s - %(lineno)5d - %(funcName)33s - %(levelname)5s - %(message)s",
)


def print_evaluation_results(
    evaluation: EvaluationData, candidate_name: str = "Candidate"
):
    """Print evaluation results in a readable format."""
    print("\n" + "=" * 80)
    print(f"📊 RESUME EVALUATION RESULTS FOR: {candidate_name}")
    print("=" * 80)

    if not evaluation:
        print("❌ No evaluation data available")
        return

    # Calculate overall score
    total_score = 0
    max_score = 0

    if hasattr(evaluation, "scores") and evaluation.scores:
        for category_name, category_data in evaluation.scores.model_dump().items():
            category_score = min(category_data["score"], category_data["max"])
            total_score += category_score
            max_score += category_data["max"]

            # Log warning if score was capped
            if category_score < category_data["score"]:
                print(
                    f"⚠️  Warning: {category_name} score capped from {category_data['score']} to {category_score} (max: {category_data['max']})"
                )

    # Add bonus points
    if hasattr(evaluation, "bonus_points") and evaluation.bonus_points:
        total_score += evaluation.bonus_points.total

    # Subtract deductions
    if hasattr(evaluation, "deductions") and evaluation.deductions:
        total_score -= evaluation.deductions.total

    # Ensure total score doesn't exceed maximum possible score
    max_possible_score = max_score + 20  # 120 (100 categories + 20 bonus)
    if total_score > max_possible_score:
        total_score = max_possible_score
        print(f"⚠️  Warning: Total score capped at maximum possible value")

    # Overall Score
    print(f"\n🎯 OVERALL SCORE: {total_score:.1f}/{max_score}")

    # Detailed Scores
    print("\n📈 DETAILED SCORES:")
    print("-" * 60)

    if hasattr(evaluation, "scores") and evaluation.scores:
        # Define category maximums
        category_maxes = {
            "open_source": 35,
            "self_projects": 30,
            "production": 25,
            "technical_skills": 10,
        }

        # Open Source
        if hasattr(evaluation.scores, "open_source") and evaluation.scores.open_source:
            os_score = evaluation.scores.open_source
            capped_score = min(os_score.score, category_maxes["open_source"])
            print(f"🌐 Open Source:          {capped_score}/{os_score.max}")
            print(f"   Evidence: {os_score.evidence}")
            print()

        # Self Projects
        if (
            hasattr(evaluation.scores, "self_projects")
            and evaluation.scores.self_projects
        ):
            sp_score = evaluation.scores.self_projects
            capped_score = min(sp_score.score, category_maxes["self_projects"])
            print(f"🚀 Self Projects:        {capped_score}/{sp_score.max}")
            print(f"   Evidence: {sp_score.evidence}")
            print()

        # Production Experience
        if hasattr(evaluation.scores, "production") and evaluation.scores.production:
            prod_score = evaluation.scores.production
            capped_score = min(prod_score.score, category_maxes["production"])
            print(f"🏢 Production Experience: {capped_score}/{prod_score.max}")
            print(f"   Evidence: {prod_score.evidence}")
            print()

        # Technical Skills
        if (
            hasattr(evaluation.scores, "technical_skills")
            and evaluation.scores.technical_skills
        ):
            tech_score = evaluation.scores.technical_skills
            capped_score = min(tech_score.score, category_maxes["technical_skills"])
            print(f"💻 Technical Skills:     {capped_score}/{tech_score.max}")
            print(f"   Evidence: {tech_score.evidence}")
            print()

    # Bonus Points
    if hasattr(evaluation, "bonus_points") and evaluation.bonus_points:
        print(f"\n⭐ BONUS POINTS: {evaluation.bonus_points.total}")
        print("-" * 30)
        print(f"   {evaluation.bonus_points.breakdown}")

    # Deductions
    if (
        hasattr(evaluation, "deductions")
        and evaluation.deductions
        and evaluation.deductions.total > 0
    ):
        print(f"\n⚠️  DEDUCTIONS: -{evaluation.deductions.total}")
        print("-" * 30)
        if evaluation.deductions.reasons:
            print(f"   {evaluation.deductions.reasons}")

    # Key Strengths
    if hasattr(evaluation, "key_strengths") and evaluation.key_strengths:
        print(f"\n✅ KEY STRENGTHS:")
        print("-" * 30)
        for i, strength in enumerate(evaluation.key_strengths, 1):
            print(f"  {i}. {strength}")

    # Areas for Improvement
    if (
        hasattr(evaluation, "areas_for_improvement")
        and evaluation.areas_for_improvement
    ):
        print(f"\n🔧 AREAS FOR IMPROVEMENT:")
        print("-" * 30)
        for i, area in enumerate(evaluation.areas_for_improvement, 1):
            print(f"  {i}. {area}")

    print("\n" + "=" * 80)


def _evaluate_resume(
    resume_data: JSONResume, github_data: dict = None, blog_data: dict = None
) -> Optional[EvaluationData]:
    """Evaluate the resume using AI and display results."""

    model_params = MODEL_PARAMETERS.get(DEFAULT_MODEL)
    evaluator = ResumeEvaluator(model_name=DEFAULT_MODEL, model_params=model_params)

    # Convert JSON resume data to text
    resume_text = convert_json_resume_to_text(resume_data)

    # Add GitHub data if available
    # if github_data:
    #     github_text = convert_github_data_to_text(github_data)
    #     resume_text += github_text

    # Add blog data if available
    if blog_data:
        blog_text = convert_blog_data_to_text(blog_data)
        resume_text += blog_text

    # Evaluate the enhanced resume
    evaluation_result = evaluator.evaluate_resume(resume_text)

    # print(evaluation_result)

    return evaluation_result


def is_valid_resume_data(resume_data: JSONResume) -> bool:
    """Check if the resume data has at least some extracted core content."""
    if not resume_data:
        return False
    core_sections = [
        resume_data.basics,
        resume_data.work,
        resume_data.education,
        resume_data.skills,
        resume_data.projects,
    ]
    return any(section is not None for section in core_sections)


def find_profile(profiles, network):
    if not profiles:
        return None
    return next(
        (p for p in profiles if p.network and p.network.lower() == network.lower()),
        None,
    )


def validate_transcript(transcript_data: TranscriptData) -> TranscriptValidationResult:
    """Validate transcript data against academic requirement gates."""
    if not transcript_data:
        return TranscriptValidationResult(
            passed=False,
            reason="No transcript data found.",
            extracted_data=transcript_data
        )

    from models import YearAverage

    # Calculate year averages programmatically if modules are present,
    # prioritizing exact python calculations over LLM math.
    if transcript_data.modules and len(transcript_data.modules) > 0:
        from collections import defaultdict
        year_to_marks = defaultdict(list)
        for m in transcript_data.modules:
            if m.mark is not None and m.mark > 0.0:
                year_to_marks[m.year].append(m.mark)
        
        calculated_averages = []
        for y, marks in year_to_marks.items():
            if len(marks) > 0:
                calculated_averages.append(YearAverage(year=y, average=sum(marks) / len(marks)))
        
        if calculated_averages:
            calculated_averages.sort(key=lambda ya: ya.year)
            transcript_data.year_averages = calculated_averages
            print(f"INFO: Programmatically calculated year averages from individual module marks: {[f'Year {ya.year}: {ya.average:.2f}%' for ya in calculated_averages]}")
        else:
            return TranscriptValidationResult(
                passed=False,
                reason="No valid non-zero module marks found in the academic transcript.",
                extracted_data=transcript_data
            )
    elif not transcript_data.year_averages or len(transcript_data.year_averages) == 0:
        return TranscriptValidationResult(
            passed=False,
            reason="No year averages or module marks found in the academic transcript.",
            extracted_data=transcript_data
        )

    if not transcript_data.year_averages:
        return TranscriptValidationResult(
            passed=False,
            reason="No year averages could be found or calculated.",
            extracted_data=transcript_data
        )

    # Compute the average of the year averages
    avg_score = sum(ya.average for ya in transcript_data.year_averages) / len(transcript_data.year_averages)

    # 1. Average above 65% (strict check)
    if avg_score <= 65.0:
        return TranscriptValidationResult(
            passed=False,
            reason=f"Average mark is {avg_score:.2f}%, which is not above 65%.",
            extracted_data=transcript_data
        )

    # 2. NQF level of at least 7
    if transcript_data.nqf_level < 7:
        return TranscriptValidationResult(
            passed=False,
            reason=f"NQF level is {transcript_data.nqf_level}, which is below the minimum required level of 7.",
            extracted_data=transcript_data
        )

    # 3. Take more than n+1 years to graduate (n is minimum_years)
    n = transcript_data.minimum_years
    actual_years = transcript_data.graduation_year - transcript_data.start_year
    if actual_years > (n + 1):
        return TranscriptValidationResult(
            passed=False,
            reason=f"Took {actual_years} years to graduate, which exceeds n+1 ({n + 1}) years for a {n}-year degree.",
            extracted_data=transcript_data
        )

    return TranscriptValidationResult(
        passed=True,
        reason="Academic transcript meets all requirements.",
        extracted_data=transcript_data
    )


def print_transcript_validation_results(validation: TranscriptValidationResult):
    """Print transcript validation results in a readable format."""
    print("\n" + "=" * 80)
    print("🎓 ACADEMIC TRANSCRIPT VALIDATION RESULTS")
    print("=" * 80)
    if validation.passed:
        print("✅ PASS: Academic transcript meets all requirements.")
    else:
        print(f"❌ FAIL/REJECT: {validation.reason}")

    if validation.extracted_data:
        data = validation.extracted_data
        print(f"\nExtracted Details:")
        print(f"  Degree:          {data.degree_name}")
        print(f"  NQF Level:       {data.nqf_level} (Required: >= 7)")
        print(f"  Duration (n):    {data.minimum_years} years")
        print(f"  Timeline:        {data.start_year} - {data.graduation_year} ({data.graduation_year - data.start_year} years, Allowed: <= n+1 = {data.minimum_years + 1})")
        if data.year_averages:
            print(f"  Year Averages:")
            for ya in data.year_averages:
                print(f"    Year {ya.year}: {ya.average:.2f}%")
            avg_score = sum(ya.average for ya in data.year_averages) / len(data.year_averages)
            print(f"  Overall Average: {avg_score:.2f}% (Required: > 65%)")
    print("=" * 80)


def main(pdf_path, transcript_path=None):
    is_url = pdf_path.startswith(("http://", "https://"))
    downloaded_path = None
    if is_url:
        try:
            from pdf import download_pdf

            pdf_path = download_pdf(pdf_path)
            downloaded_path = pdf_path
        except Exception as e:
            logger.error(f"Error downloading PDF from URL: {e}")
            return None

    downloaded_transcript_path = None
    if transcript_path:
        is_transcript_url = transcript_path.startswith(("http://", "https://"))
        if is_transcript_url:
            try:
                from pdf import download_pdf
                transcript_path = download_pdf(transcript_path)
                downloaded_transcript_path = transcript_path
            except Exception as e:
                logger.error(f"Error downloading transcript PDF from URL: {e}")
                return None

    try:
        # Create cache filename based on PDF path
        cache_filename = (
            f"cache/resumecache_{os.path.basename(pdf_path).replace('.pdf', '')}.json"
        )
        github_cache_filename = (
            f"cache/githubcache_{os.path.basename(pdf_path).replace('.pdf', '')}.json"
        )

        resume_data = None
        cache_loaded = False

        # Check if cache exists and we're in development mode
        if DEVELOPMENT_MODE and os.path.exists(cache_filename):
            print(f"Loading cached data from {cache_filename}")
            try:
                cached_data = json.loads(
                    Path(cache_filename).read_text(encoding="utf-8")
                )
                loaded_resume = JSONResume(**cached_data)
                if not is_valid_resume_data(loaded_resume):
                    raise ValueError("Cached resume data contains no core content")
                resume_data = loaded_resume
                cache_loaded = True
            except Exception as e:
                print(f"⚠️ Warning: Invalid cache file {cache_filename}: {e}")
                print("Ignoring cache and reprocessing PDF...")
                try:
                    os.remove(cache_filename)
                except Exception as delete_err:
                    print(
                        f"Failed to delete invalid cache file {cache_filename}: {delete_err}"
                    )

        if not cache_loaded:
            logger.debug(
                f"Extracting data from PDF"
                + (" and caching to " + cache_filename if DEVELOPMENT_MODE else "")
            )
            pdf_handler = PDFHandler()
            resume_data = pdf_handler.extract_json_from_pdf(pdf_path)

            if resume_data == None:
                return None

            if DEVELOPMENT_MODE:
                if is_valid_resume_data(resume_data):
                    os.makedirs(os.path.dirname(cache_filename), exist_ok=True)
                    Path(cache_filename).write_text(
                        json.dumps(
                            resume_data.model_dump(), indent=2, ensure_ascii=False
                        ),
                        encoding="utf-8",
                    )
                else:
                    logger.warning(
                        "Newly extracted resume data is empty/invalid. Skipping cache write."
                    )

        # Check if cache exists and we're in development mode
        github_data = {}
        github_cache_loaded = False
        if DEVELOPMENT_MODE and os.path.exists(github_cache_filename):
            print(f"Loading cached data from {github_cache_filename}")
            try:
                loaded_github = json.loads(
                    Path(github_cache_filename).read_text(encoding="utf-8")
                )
                if (
                    not isinstance(loaded_github, dict)
                    or not loaded_github
                    or "profile" not in loaded_github
                ):
                    raise ValueError("Cached GitHub data is invalid or empty")
                github_data = loaded_github
                github_cache_loaded = True
            except Exception as e:
                print(
                    f"⚠️ Warning: Invalid GitHub cache file {github_cache_filename}: {e}"
                )
                print("Ignoring GitHub cache and refetching...")
                try:
                    os.remove(github_cache_filename)
                except Exception as delete_err:
                    print(
                        f"Failed to delete invalid GitHub cache file {github_cache_filename}: {delete_err}"
                    )

        if not github_cache_loaded:
            # Add validation to handle None values
            profiles = []
            if resume_data and hasattr(resume_data, "basics") and resume_data.basics:
                profiles = resume_data.basics.profiles or []
            github_profile = find_profile(profiles, "Github")

        score = _evaluate_resume(resume_data, github_data)

        # Get candidate name for display
        candidate_name = os.path.basename(pdf_path).replace(".pdf", "")
        if (
            resume_data
            and hasattr(resume_data, "basics")
            and resume_data.basics
            and resume_data.basics.name
        ):
            candidate_name = resume_data.basics.name

        # Print evaluation results in readable format
        print_evaluation_results(score, candidate_name)

        # Process and validate transcript if provided
        if transcript_path:
            logger.debug(f"Processing transcript PDF: {transcript_path}")
            pdf_handler = PDFHandler()
            transcript_dict = pdf_handler.extract_transcript_data(transcript_path)
            if transcript_dict:
                try:
                    transcript_data = TranscriptData(**transcript_dict)
                    validation_res = validate_transcript(transcript_data)
                    print_transcript_validation_results(validation_res)
                except Exception as e:
                    logger.error(f"Error parsing/validating transcript data: {e}")
                    print_transcript_validation_results(TranscriptValidationResult(
                        passed=False,
                        reason=f"Failed to parse transcript structure: {e}"
                    ))
            else:
                logger.error("Failed to extract transcript data using LLM.")
                print_transcript_validation_results(TranscriptValidationResult(
                    passed=False,
                    reason="Failed to extract structured data from academic transcript."
                ))

        if DEVELOPMENT_MODE:
            csv_row = transform_evaluation_response(
                file_name=os.path.basename(pdf_path),
                evaluation=score,
                resume_data=resume_data,
                github_data=github_data,
            )

            # Write CSV row to file
            csv_path = "resume_evaluations.csv"
            file_exists = os.path.exists(csv_path)

            with open(csv_path, "a", newline="", encoding="utf-8") as csvfile:
                fieldnames = list(csv_row.keys())
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                # Write headers if file doesn't exist
                if not file_exists:
                    writer.writeheader()

                # Write the row
                writer.writerow(csv_row)

        return score
    finally:
        if downloaded_path and not DEVELOPMENT_MODE and os.path.exists(downloaded_path):
            try:
                os.remove(downloaded_path)
            except Exception as e:
                logger.warning(
                    f"Failed to clean up downloaded PDF {downloaded_path}: {e}"
                )
        if downloaded_transcript_path and not DEVELOPMENT_MODE and os.path.exists(downloaded_transcript_path):
            try:
                os.remove(downloaded_transcript_path)
            except Exception as e:
                logger.warning(
                    f"Failed to clean up downloaded transcript PDF {downloaded_transcript_path}: {e}"
                )


if __name__ == "__main__":
    pdf_path = None
    transcript_path = None

    if len(sys.argv) >= 2:
        pdf_path = sys.argv[1]
        if len(sys.argv) >= 3:
            transcript_path = sys.argv[2]
    else:
        # Fallback to querying C# API backend
        try:
            resume = get_resume(1)
            pdf_path = resume.document_url
            transcript_path = resume.transcript_url
            print(f"Loaded candidate application: {resume}")

            # Prepend backend base URL to relative URLs
            if pdf_path and pdf_path.startswith("/api/"):
                pdf_path = f"{BACKEND_BASE_URL}{pdf_path}"
            if transcript_path and transcript_path.startswith("/api/"):
                transcript_path = f"{BACKEND_BASE_URL}{transcript_path}"
        except Exception as e:
            print(f"Error fetching resume from C# API backend: {e}")
            sys.exit(1)

    if not pdf_path:
        print("Error: No PDF path provided or found.")
        sys.exit(1)

    main(pdf_path, transcript_path)
