"""CLI entry point: python -m scout"""

from scout.agents import scout

if __name__ == "__main__":
    scout.cli_app(stream=True)
