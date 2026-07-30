import unittest
from models import TranscriptData, DegreeRecord, YearAverage, ModuleMark
from score import validate_transcript

class TestHardGate(unittest.TestCase):
    def test_validate_transcript_none(self):
        """Test validation when transcript_data is None."""
        result = validate_transcript(None)
        self.assertFalse(result.passed)
        self.assertEqual(result.reason, "No transcript data found.")

    def test_validate_transcript_success_undergrad(self):
        """Test successful validation of a standard NQF 7 undergraduate degree."""
        transcript = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2021,
            graduation_year=2024,
            year_averages=[
                YearAverage(year=1, average=70.0),
                YearAverage(year=2, average=72.5),
                YearAverage(year=3, average=76.0),
            ]
        )
        result = validate_transcript(transcript)
        self.assertTrue(result.passed)
        self.assertIn("met all requirements", result.reason)

    def test_validate_transcript_low_average(self):
        """Test fail validation when the average mark is 65% or below."""
        transcript = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2021,
            graduation_year=2024,
            year_averages=[
                YearAverage(year=1, average=60.0),
                YearAverage(year=2, average=65.0),
                YearAverage(year=3, average=68.0),
            ]
        )
        result = validate_transcript(transcript)
        self.assertFalse(result.passed)
        # Average is (60 + 65 + 68) / 3 = 64.33%
        self.assertIn("Average mark is 64.33%, which is not above 65%", result.reason)

    def test_validate_transcript_low_nqf(self):
        """Test fail validation when NQF level is below 7."""
        transcript = TranscriptData(
            degree_name="Higher Diploma in Computer Studies",
            nqf_level=6,
            minimum_years=2,
            start_year=2021,
            graduation_year=2023,
            year_averages=[
                YearAverage(year=1, average=75.0),
                YearAverage(year=2, average=78.0),
            ]
        )
        result = validate_transcript(transcript)
        self.assertFalse(result.passed)
        self.assertIn("NQF level is 6, which is below the minimum required level of 7", result.reason)

    def test_validate_transcript_exceeded_timeline(self):
        """Test fail validation when duration exceeds n+1 years."""
        # For a 3-year degree, n+1 is 4 years.
        # Start 2019, graduate 2024 is 5 years.
        transcript = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2019,
            graduation_year=2024,
            year_averages=[
                YearAverage(year=1, average=70.0),
                YearAverage(year=2, average=75.0),
                YearAverage(year=3, average=80.0),
            ]
        )
        result = validate_transcript(transcript)
        self.assertFalse(result.passed)
        self.assertIn("Graduation timeline took 5 years, exceeding n+1 (4) years for a 3-year degree.", result.reason)

    def test_validate_transcript_empty_year_averages(self):
        """Test fail validation when no year averages are found or can be calculated."""
        transcript = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2021,
            graduation_year=2024,
            year_averages=[],
            modules=[]
        )
        result = validate_transcript(transcript)
        self.assertFalse(result.passed)
        self.assertIn("No year averages could be found or calculated.", result.reason)

    def test_validate_transcript_calculate_from_modules(self):
        """Test that year averages are correctly calculated programmatically from modules."""
        transcript = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2021,
            graduation_year=2024,
            modules=[
                ModuleMark(year=1, name="CS101", mark=70.0),
                ModuleMark(year=1, name="MATH101", mark=80.0),
                ModuleMark(year=2, name="CS201", mark=75.0),
                ModuleMark(year=2, name="CS202", mark=85.0),
                ModuleMark(year=3, name="CS301", mark=90.0),
            ]
        )
        result = validate_transcript(transcript)
        # Year 1 avg: 75.0
        # Year 2 avg: 80.0
        # Year 3 avg: 90.0
        # Overall avg: (75 + 80 + 90) / 3 = 81.67%
        self.assertTrue(result.passed)
        self.assertIn("met all requirements", result.reason)
        # Check calculated year averages are stored on the transcript data
        self.assertEqual(len(result.extracted_data.year_averages), 3)
        self.assertEqual(result.extracted_data.year_averages[0].average, 75.0)
        self.assertEqual(result.extracted_data.year_averages[1].average, 80.0)
        self.assertEqual(result.extracted_data.year_averages[2].average, 90.0)

    def test_validate_transcript_inferred_nqf_and_duration(self):
        """Test inference of NQF level and minimum years when they are not explicitly provided."""
        # Test case: Honours
        honours_transcript = TranscriptData(
            degree_name="BSc Honours in IT",
            nqf_level=None,
            minimum_years=None,
            start_year=2023,
            graduation_year=2024,
            year_averages=[YearAverage(year=1, average=70.0)]
        )
        result = validate_transcript(honours_transcript)
        self.assertTrue(result.passed)

        # Test case: Master
        master_transcript = TranscriptData(
            degree_name="Master of Science in Computer Science",
            nqf_level=None,
            minimum_years=None,
            start_year=2022,
            graduation_year=2024,
            year_averages=[YearAverage(year=1, average=75.0), YearAverage(year=2, average=80.0)]
        )
        result2 = validate_transcript(master_transcript)
        self.assertTrue(result2.passed)

        # Test case: Diploma
        diploma_transcript = TranscriptData(
            degree_name="National Diploma in Software Development",
            nqf_level=None,
            minimum_years=None,
            start_year=2021,
            graduation_year=2023,
            year_averages=[YearAverage(year=1, average=70.0)]
        )
        result3 = validate_transcript(diploma_transcript)
        # Expected to fail because Diploma maps to NQF level 6 < 7
        self.assertFalse(result3.passed)
        self.assertIn("NQF level is 6, which is below the minimum required level of 7", result3.reason)

    def test_validate_transcript_multiple_degrees(self):
        """Test validation when multiple degrees are listed in the transcript."""
        # Case 1: Primary degree passes, secondary degree fails.
        # The overall validation should pass because primary (index 0) passed.
        transcript_1 = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2021,
            graduation_year=2024,
            year_averages=[YearAverage(year=1, average=70.0)],
            degrees=[
                DegreeRecord(
                    degree_name="BSc Honours in Computer Science",
                    nqf_level=8,
                    minimum_years=1,
                    start_year=2024,
                    graduation_year=2025,
                    year_averages=[YearAverage(year=1, average=55.0)] # Below 65%!
                )
            ]
        )
        result_1 = validate_transcript(transcript_1)
        self.assertTrue(result_1.passed)
        self.assertIn("Bachelor of Science in Computer Science met all requirements.", result_1.reason)
        self.assertIn("BSc Honours in Computer Science failed: Average mark is 55.00%, which is not above 65%.", result_1.reason)

        # Case 2: Primary degree fails, secondary degree passes.
        # The overall validation should fail because primary (index 0) failed.
        transcript_2 = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2021,
            graduation_year=2024,
            year_averages=[YearAverage(year=1, average=55.0)], # Below 65%!
            degrees=[
                DegreeRecord(
                    degree_name="BSc Honours in Computer Science",
                    nqf_level=8,
                    minimum_years=1,
                    start_year=2024,
                    graduation_year=2025,
                    year_averages=[YearAverage(year=1, average=75.0)]
                )
            ]
        )
        result_2 = validate_transcript(transcript_2)
        self.assertFalse(result_2.passed)
        self.assertIn("Bachelor of Science in Computer Science failed: Average mark is 55.00%, which is not above 65%.", result_2.reason)

    def test_validate_transcript_exact_65_percent(self):
        """Test validation fails when mark average is exactly 65.0% (must be > 65%)."""
        transcript = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2021,
            graduation_year=2024,
            year_averages=[
                YearAverage(year=1, average=65.0),
                YearAverage(year=2, average=65.0),
                YearAverage(year=3, average=65.0),
            ]
        )
        result = validate_transcript(transcript)
        self.assertFalse(result.passed)
        self.assertIn("Average mark is 65.00%, which is not above 65%", result.reason)

    def test_validate_transcript_exact_n_plus_1_timeline(self):
        """Test validation passes when graduation timeline is exactly n+1 years."""
        # For a 3-year degree, n+1 is 4 years.
        # Start 2020, graduate 2024 is exactly 4 years.
        transcript = TranscriptData(
            degree_name="Bachelor of Science in Computer Science",
            nqf_level=7,
            minimum_years=3,
            start_year=2020,
            graduation_year=2024,
            year_averages=[
                YearAverage(year=1, average=70.0),
                YearAverage(year=2, average=75.0),
                YearAverage(year=3, average=80.0),
            ]
        )
        result = validate_transcript(transcript)
        self.assertTrue(result.passed)
        self.assertIn("met all requirements", result.reason)

