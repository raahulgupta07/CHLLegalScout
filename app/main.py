"""
Scout API
=========

Production deployment entry point for Scout.

Run:
    python -m app.main
"""

from os import getenv
from pathlib import Path

from agno.os import AgentOS

from db import get_postgres_db
from scout import scout

# ============================================================================
# Create AgentOS
# ============================================================================
agent_os = AgentOS(
    name="Scout",
    tracing=True,
    db=get_postgres_db(),
    agents=[scout],
    config=str(Path(__file__).parent / "config.yaml"),
)

app = agent_os.get_app()

if __name__ == "__main__":
    agent_os.serve(
        app="main:app",
        reload=getenv("RUNTIME_ENV", "prd") == "dev",
    )
