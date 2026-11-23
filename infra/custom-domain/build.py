#!/usr/bin/env python3
"""Build the Solana Gold web application without running network services."""
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[2]
subprocess.run(['python3', 'scripts/pnpm.py', 'build'], cwd=root, check=True)
