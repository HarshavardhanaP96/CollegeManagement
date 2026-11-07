"""Tests for the repo-specific parts of scripts/preflight.py.

Run: python3 -m unittest discover -s scripts -p 'test_*.py' -v
"""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import preflight  # noqa: E402


def git_repo(d):
    subprocess.run(["git", "init", "-q", d], check=True)
    return Path(d)


class EnvIgnored(unittest.TestCase):
    # .env lives in infra/docker but .gitignore is at the repo root, so the check must ask git.
    def test_nested_env_ignored_by_root_gitignore(self):
        with tempfile.TemporaryDirectory() as d:
            repo = git_repo(d)
            (repo / ".gitignore").write_text(".env\n")
            sub = repo / "infra" / "docker"
            sub.mkdir(parents=True)
            self.assertTrue(preflight.env_ignored(sub))

    def test_not_ignored(self):
        with tempfile.TemporaryDirectory() as d:
            repo = git_repo(d)
            (repo / ".gitignore").write_text("*.log\n")
            self.assertFalse(preflight.env_ignored(repo))

    def test_outside_git_repo_is_not_ignored(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertFalse(preflight.env_ignored(Path(d)))


class MissingKeys(unittest.TestCase):
    # Secrets can come from `pass` via secrun (exported env vars) instead of .env.
    def test_key_exported_by_secrun_is_not_missing(self):
        example = {"POSTGRES_PASSWORD": "x", "API_PORT": "8080"}
        env = {"API_PORT": "8080"}
        self.assertEqual(preflight.missing_keys(env, example, {"POSTGRES_PASSWORD": "s"}), [])

    def test_key_in_neither_is_missing(self):
        example = {"POSTGRES_PASSWORD": "x"}
        self.assertEqual(preflight.missing_keys({}, example, {}), ["POSTGRES_PASSWORD"])


class OpenPorts(unittest.TestCase):
    def test_loopback_bound_ports_are_not_flagged(self):
        compose = 'services:\n  a:\n    ports:\n      - "127.0.0.1:${X:-1}:1"\n      - "5433:5432"\n'
        self.assertEqual(preflight.open_ports(compose), ["5433:5432"])


if __name__ == "__main__":
    unittest.main()
