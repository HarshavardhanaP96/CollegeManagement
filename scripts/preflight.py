#!/usr/bin/env python3
"""Cross-platform Docker Compose preflight (standard library only; Linux, macOS, Windows).

Detects the platform, writes UID/GID/HOST_OS/HOST_ARCH (and COMPOSE_FILE when an
OS-specific override exists) into .env, then checks Docker, .env keys, ports and secrets.
Run via `make doctor`, or: python3 scripts/preflight.py --root infra/docker [--no-docker]
(this repo keeps its compose files and .env in infra/docker).
Exit 1 on any FAIL; WARN does not fail.
"""
import argparse
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
from pathlib import Path

ARCH = {"x86_64": "amd64", "amd64": "amd64", "aarch64": "arm64", "arm64": "arm64"}
OPEN_PORT = re.compile(r"^\s*-\s*[\"']?(?:\d+|\$\{[^}]*\})(?::|[\"']?\s*$)")


def norm_arch(machine):
    return ARCH.get(machine.lower(), machine.lower())


def detect_platform(getuid=getattr(os, "getuid", None), getgid=getattr(os, "getgid", None)):
    # shortcut: Docker Desktop (macOS/Windows) ignores bind-mount ownership; 1000 is a safe default there
    return {
        "UID": str(getuid()) if getuid else "1000",
        "GID": str(getgid()) if getgid else "1000",
        "HOST_OS": platform.system().lower(),
        "HOST_ARCH": norm_arch(platform.machine()),
    }


def compose_file(root, host_os, sep=os.pathsep):
    """COMPOSE_FILE value when an OS override exists, else None (Compose then auto-loads defaults)."""
    extra = f"compose.{host_os}.yaml"
    if not (root / extra).exists():
        return None
    files = ["compose.yaml", extra] + (["compose.override.yaml"] if (root / "compose.override.yaml").exists() else [])
    return sep.join(files)


def parse_env(text):
    out = {}
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def upsert_env(text, values):
    """Set keys in place (None removes), append new ones, keep every other line."""
    lines, seen = [], set()
    for line in text.splitlines():
        key = line.split("=", 1)[0].strip() if "=" in line and not line.lstrip().startswith("#") else None
        if key in values:
            seen.add(key)
            if values[key] is not None:
                lines.append(f"{key}={values[key]}")
        else:
            lines.append(line)
    lines += [f"{k}={v}" for k, v in values.items() if k not in seen and v is not None]
    return "\n".join(lines) + "\n"


def missing_keys(env, example):
    return [k for k in example if k not in env]


def port_free(port):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def ports_from_env(env):
    return [int(v) for k, v in env.items() if k.endswith("_PORT") and v.isdigit() and int(v) > 0]


def open_ports(compose_text):
    """Published ports with no host IP (reachable from the LAN), e.g. "5432:5432"."""
    found, in_ports, indent = [], False, 0
    for line in compose_text.splitlines():
        stripped = line.strip()
        cur = len(line) - len(line.lstrip())
        if stripped == "ports:":
            in_ports, indent = True, cur
        elif in_ports and stripped and cur <= indent and not stripped.startswith("- "):
            in_ports = False
        elif in_ports and OPEN_PORT.match(line):
            found.append(stripped[2:].strip().strip("\"'"))
    return found


def env_ignored(root):
    # Ask git: .env is in infra/docker but the .gitignore rule is at the repo root.
    try:
        return subprocess.run(["git", "-C", str(root), "check-ignore", "-q", ".env"],
                              capture_output=True, timeout=10).returncode == 0
    except (subprocess.SubprocessError, OSError):
        return False


def docker_ok():
    if not shutil.which("docker"):
        return ["docker not found on PATH"]
    problems = []
    for cmd in (["docker", "--version"], ["docker", "compose", "version"]):
        try:
            subprocess.run(cmd, capture_output=True, check=True, timeout=20)
        except (subprocess.SubprocessError, OSError):
            problems.append("`" + " ".join(cmd) + "` failed (Docker Compose v2 required)")
    return problems


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--root", default=".")
    ap.add_argument("--no-docker", action="store_true", help="skip Docker checks")
    args = ap.parse_args(argv)
    root = Path(args.root)
    fail = False

    def report(level, msg):
        nonlocal fail
        fail |= level == "FAIL"
        print(f"  {level:<7} {msg}")

    plat = detect_platform()
    env_path = root / ".env"
    if not env_path.exists():
        example = root / ".env.example"
        if example.exists():
            env_path.write_text(example.read_text())
            print("  created .env from .env.example")
        else:
            report("FAIL", ".env missing and no .env.example to copy")
    if env_path.exists():
        before = env_path.read_text()
        values = dict(plat, COMPOSE_FILE=compose_file(root, plat["HOST_OS"]))
        after = upsert_env(before, values)
        if after != before:
            env_path.write_text(after)
        print(f"  ok      platform {plat['HOST_OS']}/{plat['HOST_ARCH']} uid={plat['UID']} gid={plat['GID']}")

    print("== docker ==")
    if args.no_docker:
        print("  skipped")
    else:
        for p in docker_ok():
            report("FAIL", p)

    env = parse_env(env_path.read_text()) if env_path.exists() else {}
    print("== config ==")
    example = root / ".env.example"
    if example.exists():
        for k in missing_keys(env, parse_env(example.read_text())):
            report("FAIL", f".env is missing key {k} (see .env.example)")
    if env_path.exists() and not env_ignored(root):
        report("FAIL", ".env is not listed in .gitignore: secrets could be committed")

    print("== ports ==")
    for port in ports_from_env(env):
        if not port_free(port):
            report("WARN", f"port {port} is in use (fine if this stack is already running)")
    for name in ("compose.yaml", "compose.yml", "docker-compose.yml"):
        if (root / name).exists():
            for p in open_ports((root / name).read_text()):
                report("WARN", f'{name}: "{p}" is published on all interfaces; bind it to 127.0.0.1')
            break

    print("preflight: FAILED" if fail else "preflight: ok")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
