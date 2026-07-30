import os
from dotenv import load_dotenv
"""
Configuration settings for the hiring agent application.
"""

load_dotenv()
DEVELOPMENT_MODE = os.getenv("DEVELOPMENT_MODE", "False").lower() == "true"
