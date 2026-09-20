#!/usr/bin/env python3
"""Immutable vendor-skill manager for Content Factory.

The lockfile is intentionally allowed to start with an empty source list.
CF-001 establishes the supply-chain mechanism; later tasks add reviewed
upstreams only after immutable source, license, dependencies, and behavior
have been verified.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL_NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
VERSION_TAG_RE = re.compile(r"^v[0-9]+\.[0-9]+\.[0-9]+$")
COMMIT_SHA_RE = re.compile(r"^[0-9a-f]{40}$")
DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")


def hash_skill_dir(skill_dir: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in skill_dir.rglob("*") if p.is_file()):
        relative = path.relative_to(skill_dir).as_posix()
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(hashlib.sha256(path.read_bytes()).hexdigest().encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()


def load_lock(path: Path) -> dict:
    lock = json.loads(path.read_text(encoding="utf-8"))
    if lock.get("version") != 1:
        raise RuntimeError(f"unsupported lockfile version: {lock.get('version')}")
    if not isinstance(lock.get("sources"), list):
        raise RuntimeError("lockfile requires a sources list")
    return lock


def validate_source(source: dict, root: Path) -> Path:
    for key in ("package", "repo", "ref", "sha", "skills", "dest", "sha256", "license"):
        if key not in source:
            raise RuntimeError(f"source {source.get('package', '?')}: missing key '{key}'")
    if not isinstance(source["ref"], str) or not VERSION_TAG_RE.match(source["ref"]):
        raise RuntimeError(f"{source['package']}: ref must be an immutable semantic version tag")
    if not isinstance(source["sha"], str) or not COMMIT_SHA_RE.match(source["sha"]):
        raise RuntimeError(f"{source['package']}: sha must be a 40-character commit SHA")
    if not isinstance(source["license"], str) or not source["license"].strip():
        raise RuntimeError(f"{source['package']}: license must be recorded")
    if not isinstance(source["skills"], list) or not source["skills"]:
        raise RuntimeError(f"{source['package']}: skills must be a non-empty list")
    if len(source["skills"]) != len(set(source["skills"])):
        raise RuntimeError(f"{source['package']}: duplicate skill names in lock entry")
    if not isinstance(source["sha256"], dict):
        raise RuntimeError(f"{source['package']}: sha256 must be an object")
    for name in source["skills"]:
        if not isinstance(name, str) or not SKILL_NAME_RE.match(name):
            raise RuntimeError(f"{source['package']}: illegal skill name '{name}'")
        value = source["sha256"].get(name)
        if not isinstance(value, str) or not DIGEST_RE.match(value):
            raise RuntimeError(f"{source['package']}: missing or invalid digest for '{name}'")
    destination = (root / source["dest"]).resolve()
    if root != destination and root not in destination.parents:
        raise RuntimeError(f"{source['package']}: dest escapes repository root")
    return destination


def validate_no_cross_source_collisions(lock: dict) -> None:
    owners: dict[tuple[str, str], str] = {}
    for source in lock["sources"]:
        for name in source.get("skills", []):
            key = (source.get("dest", ""), name)
            if key in owners:
                raise RuntimeError(
                    f"skill collision: {name} is managed by both {owners[key]} and {source.get('package')}"
                )
            owners[key] = source.get("package", "?")


def validate_plugin_local_inventory(root: Path, lock: dict) -> None:
    policy_path = root / "plugin-local-skills.json"
    if not policy_path.is_file():
        raise RuntimeError("plugin-local-skills.json is required")
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    if policy.get("version") != 1:
        raise RuntimeError("unsupported plugin-local-skills.json version")
    if not isinstance(policy.get("dest"), str):
        raise RuntimeError("plugin-local-skills.json requires a dest string")
    names = policy.get("skills")
    if not isinstance(names, list):
        raise RuntimeError("plugin-local-skills.json requires a skills list")
    if len(names) != len(set(names)):
        raise RuntimeError("plugin-local-skills.json contains duplicate skill names")
    for name in names:
        if not isinstance(name, str) or not SKILL_NAME_RE.match(name):
            raise RuntimeError(f"plugin-local-skills.json contains illegal skill name '{name}'")

    destination = (root / policy["dest"]).resolve()
    if root != destination and root not in destination.parents:
        raise RuntimeError("plugin-local-skills.json dest escapes repository root")
    managed = {
        name
        for source in lock["sources"]
        if (root / source.get("dest", "")).resolve() == destination
        for name in source.get("skills", [])
    }
    overlap = sorted(managed & set(names))
    if overlap:
        raise RuntimeError("plugin-local skills must not appear in skills.lock.json: " + ", ".join(overlap))
    actual = {
        path.name
        for path in destination.iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    } if destination.is_dir() else set()
    undeclared = sorted(actual - managed - set(names))
    missing = sorted(set(names) - actual)
    if undeclared:
        raise RuntimeError("undeclared plugin-local skills: " + ", ".join(undeclared))
    if missing:
        raise RuntimeError("declared plugin-local skills are missing: " + ", ".join(missing))


def resolve_ref(repo: str, ref: str) -> str:
    result = subprocess.run(
        ["git", "ls-remote", repo, ref, f"{ref}^{{}}"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    if not result:
        raise RuntimeError(f"{repo}: ref '{ref}' not found")
    resolved = None
    for line in result.splitlines():
        candidate, _, remote_name = line.partition("\t")
        short = remote_name.removeprefix("refs/tags/").removeprefix("refs/heads/")
        if short == f"{ref}^{{}}":
            resolved = candidate
        elif short == ref and resolved is None:
            resolved = candidate
    if resolved is None:
        raise RuntimeError(f"{repo}: could not resolve ref '{ref}'")
    return resolved


def fetch_checkout(repo: str, ref: str, workdir: Path) -> Path:
    checkout = workdir / "checkout"
    subprocess.run(["git", "init", "--quiet", str(checkout)], check=True)
    subprocess.run(["git", "-C", str(checkout), "remote", "add", "origin", repo], check=True)
    subprocess.run(["git", "-C", str(checkout), "fetch", "--quiet", "--depth", "1", "origin", ref], check=True)
    subprocess.run(["git", "-C", str(checkout), "checkout", "--quiet", "--detach", "FETCH_HEAD"], check=True)
    return checkout


def copy_source(root: Path, source: dict, checkout: Path) -> None:
    destination = validate_source(source, root)
    source_root = checkout / "skills"
    for name in source["skills"]:
        src = source_root / name
        if not (src / "SKILL.md").is_file():
            raise RuntimeError(f"{source['package']}: skill '{name}' not found under skills/")
        dst = destination / name
        if dst.exists():
            shutil.rmtree(dst)
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copytree(src, dst)
        digest = hash_skill_dir(dst)
        if digest != source["sha256"][name]:
            raise RuntimeError(f"{source['package']}: digest mismatch for '{name}' after copy")


def cmd_check(root: Path, online: bool) -> int:
    lock = load_lock(root / "skills.lock.json")
    validate_no_cross_source_collisions(lock)
    for source in lock["sources"]:
        destination = validate_source(source, root)
        for name in source["skills"]:
            skill_dir = destination / name
            if not skill_dir.is_dir():
                raise RuntimeError(f"{source['package']}: managed skill '{name}' is missing")
            actual = hash_skill_dir(skill_dir)
            if actual != source["sha256"][name]:
                raise RuntimeError(f"{source['package']}: digest drift for '{name}'")
        if online:
            resolved = resolve_ref(source["repo"], source["ref"])
            if resolved != source["sha"]:
                raise RuntimeError(f"{source['package']}: pinned tag moved or SHA mismatch")
    validate_plugin_local_inventory(root, lock)
    return 0


def cmd_update(root: Path) -> int:
    lock = load_lock(root / "skills.lock.json")
    validate_no_cross_source_collisions(lock)
    validate_plugin_local_inventory(root, lock)
    with tempfile.TemporaryDirectory(prefix="content-factory-vendor-") as tmp:
        for source in lock["sources"]:
            validate_source(source, root)
            resolved = resolve_ref(source["repo"], source["ref"])
            if resolved != source["sha"]:
                raise RuntimeError(f"{source['package']}: pinned tag moved or SHA mismatch")
            checkout = fetch_checkout(source["repo"], source["ref"], Path(tmp) / source["package"])
            copy_source(root, source, checkout)
    return cmd_check(root, online=False)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("check", "update"))
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[2]))
    parser.add_argument("--online", action="store_true", help="also verify upstream refs during check")
    args = parser.parse_args(argv)
    root = Path(args.root).resolve()
    try:
        if args.command == "check":
            return cmd_check(root, online=args.online)
        return cmd_update(root)
    except (RuntimeError, OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
