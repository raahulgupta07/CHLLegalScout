"""Run Scout agent from the command line: python -m scout"""

import asyncio

from scout.agent import scout

if __name__ == "__main__":
    asyncio.run(scout.acli_app(stream=True))
