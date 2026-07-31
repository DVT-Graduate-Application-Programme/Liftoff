import unittest
from unittest.mock import MagicMock, patch
import json

from evaluator import ResumeEvaluator
from models import EvaluationData, EducationTrack, AcademicRequirementStatus, ExperienceRequirementStatus
from llm_utils import extract_json_from_response

class TestAgentAndUtilities(unittest.TestCase):
    def setUp(self):
        self.valid_evaluation_dict = {
            "scores": {
                "education": {
                    "score": 8.0,
                    "max": 10,
                    "evidence": "Candidate has a BSc in Computer Science.",
                    "track": "formal_it",
                    "academic_requirement_met": "met",
                    "experience_requirement_met": "not_applicable"
                },
                "open_source": {
                    "score": 25.0,
                    "max": 35,
                    "evidence": "Candidate has contributed to several popular open source repositories."
                },
                "self_projects": {
                    "score": 15.0,
                    "max": 30,
                    "evidence": "Candidate has developed 3 distinct personal projects."
                },
                "production": {
                    "score": 20.0,
                    "max": 25,
                    "evidence": "Candidate has worked on production level web apps."
                },
                "technical_skills": {
                    "score": 8.0,
                    "max": 10,
                    "evidence": "Candidate lists Python, Javascript, and SQL skills."
                }
            },
            "bonus_points": {
                "total": 5.0,
                "breakdown": "5 points for active contributions and deployments."
            },
            "prompt_injection_detected": False,
            "prompt_injection_evidence": "",
            "key_strengths": ["Strong academic foundation", "Good technical skills"],
            "areas_for_improvement": ["Could contribute more to open source"]
        }

    def test_extract_json_from_response_simple(self):
        """Test extract_json_from_response with a clean JSON string."""
        json_str = '{"status": "ok"}'
        result = extract_json_from_response(json_str)
        self.assertEqual(result, '{"status": "ok"}')

    def test_extract_json_from_response_markdown(self):
        """Test extract_json_from_response with markdown code blocks."""
        json_str = '```json\n{"status": "ok"}\n```'
        result = extract_json_from_response(json_str)
        self.assertEqual(result.strip(), '{"status": "ok"}')

    def test_extract_json_from_response_thinking(self):
        """Test extract_json_from_response with DeepSeek thinking blocks."""
        json_str = '<think>I should output a JSON object.</think>{"status": "ok"}'
        result = extract_json_from_response(json_str)
        self.assertEqual(result.strip(), '{"status": "ok"}')

    def test_extract_json_from_response_thinking_and_markdown(self):
        """Test extract_json_from_response with both thinking blocks and markdown blocks."""
        json_str = '<think>\nThinking...\n</think>```json\n{"status": "ok"}\n```'
        result = extract_json_from_response(json_str)
        self.assertEqual(result.strip(), '{"status": "ok"}')

    def test_evaluator_init_validation(self):
        """Test that ResumeEvaluator raises ValueError if model_name is empty."""
        with self.assertRaises(ValueError):
            ResumeEvaluator(model_name="")

    @patch('evaluator.initialize_llm_provider')
    def test_evaluator_init_success(self, mock_init_provider):
        """Test successful initialization of ResumeEvaluator."""
        mock_provider = MagicMock()
        mock_init_provider.return_value = mock_provider
        
        evaluator = ResumeEvaluator(model_name="gemma3:4b")
        
        self.assertEqual(evaluator.model_name, "gemma3:4b")
        mock_init_provider.assert_called_once_with("gemma3:4b")
        self.assertEqual(evaluator.provider, mock_provider)

    @patch('evaluator.initialize_llm_provider')
    def test_load_evaluation_prompt(self, mock_init_provider):
        """Test that the evaluation prompt is loaded and rendered correctly."""
        mock_init_provider.return_value = MagicMock()
        evaluator = ResumeEvaluator()
        
        resume_text = "This is a sample resume content for unit testing."
        prompt = evaluator._load_evaluation_prompt(resume_text)
        
        # Verify that prompt contains the template instructions and the resume content
        self.assertIsNotNone(prompt)
        self.assertIn("This is a sample resume content for unit testing.", prompt)
        self.assertIn("Fairness Constraints", prompt)

    @patch('evaluator.initialize_llm_provider')
    def test_evaluate_resume_success(self, mock_init_provider):
        """Test evaluate_resume runs successfully and parses a valid response."""
        mock_provider = MagicMock()
        mock_init_provider.return_value = mock_provider
        
        # Setup mock response
        mock_response = {
            "message": {
                "content": json.dumps(self.valid_evaluation_dict)
            }
        }
        mock_provider.chat.return_value = mock_response
        
        evaluator = ResumeEvaluator(model_name="gemma3:4b")
        
        resume_text = "Jane Doe Resume"
        eval_data = evaluator.evaluate_resume(resume_text)
        
        # Check assertions
        self.assertIsInstance(eval_data, EvaluationData)
        self.assertEqual(eval_data.scores.education.score, 8.0)
        self.assertEqual(eval_data.scores.education.track, EducationTrack.FORMAL_IT)
        self.assertEqual(eval_data.scores.education.academic_requirement_met, AcademicRequirementStatus.MET)
        self.assertEqual(eval_data.scores.education.experience_requirement_met, ExperienceRequirementStatus.NOT_APPLICABLE)
        self.assertEqual(eval_data.bonus_points.total, 5.0)
        self.assertFalse(eval_data.prompt_injection_detected)
        self.assertEqual(eval_data.key_strengths, ["Strong academic foundation", "Good technical skills"])
        
        # Check chat params passed
        mock_provider.chat.assert_called_once()
        call_kwargs = mock_provider.chat.call_args[1]
        self.assertEqual(call_kwargs["model"], "gemma3:4b")
        self.assertEqual(call_kwargs["messages"][0]["role"], "system")
        self.assertEqual(call_kwargs["messages"][1]["role"], "user")
        self.assertIn("Jane Doe Resume", call_kwargs["messages"][1]["content"])
        self.assertIn("format", call_kwargs)

    @patch('evaluator.initialize_llm_provider')
    def test_evaluate_resume_markdown_response(self, mock_init_provider):
        """Test evaluate_resume when the LLM response is wrapped in markdown code blocks."""
        mock_provider = MagicMock()
        mock_init_provider.return_value = mock_provider
        
        # Setup mock response wrapped in markdown
        mock_response = {
            "message": {
                "content": "```json\n" + json.dumps(self.valid_evaluation_dict) + "\n```"
            }
        }
        mock_provider.chat.return_value = mock_response
        
        evaluator = ResumeEvaluator()
        eval_data = evaluator.evaluate_resume("Resume content")
        
        self.assertIsInstance(eval_data, EvaluationData)
        self.assertEqual(eval_data.scores.open_source.score, 25.0)

    @patch('evaluator.initialize_llm_provider')
    def test_evaluate_resume_error_propagation(self, mock_init_provider):
        """Test evaluate_resume propagates exceptions when chat call fails."""
        mock_provider = MagicMock()
        mock_init_provider.return_value = mock_provider
        
        # Setup mock provider to throw an exception
        mock_provider.chat.side_effect = Exception("API connection timed out")
        
        evaluator = ResumeEvaluator()
        
        with self.assertRaises(Exception) as context:
            evaluator.evaluate_resume("Resume content")
            
        self.assertIn("API connection timed out", str(context.exception))
