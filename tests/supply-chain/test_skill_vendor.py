import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "vendor" / "skill_vendor.py"


def load_module():
    spec = importlib.util.spec_from_file_location("skill_vendor", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load skill_vendor")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SkillVendorPolicyTests(unittest.TestCase):
    def test_content_harness_is_the_only_declared_local_skill(self):
        policy = json.loads((ROOT / "plugin-local-skills.json").read_text(encoding="utf-8"))
        self.assertEqual(policy["version"], 1)
        self.assertEqual(policy["dest"], "skills/")
        self.assertEqual(policy["skills"], ["content-harness"])

    def test_rejects_floating_ref(self):
        vendor = load_module()
        source = {
            "package": "demo",
            "repo": "https://example.invalid/demo.git",
            "ref": "main",
            "sha": "0" * 40,
            "skills": ["demo-skill"],
            "dest": "skills/",
            "sha256": {"demo-skill": "0" * 64},
            "license": "MIT",
        }
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(RuntimeError, "immutable semantic version tag"):
                vendor.validate_source(source, Path(tmp))

    def test_rejects_vendor_local_overlap(self):
        vendor = load_module()
        lock = {
            "version": 1,
            "sources": [{
                "package": "demo",
                "repo": "https://example.invalid/demo.git",
                "ref": "v1.0.0",
                "sha": "0" * 40,
                "skills": ["content-harness"],
                "dest": "skills/",
                "sha256": {"content-harness": "0" * 64},
                "license": "MIT",
            }],
        }
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "skills" / "content-harness").mkdir(parents=True)
            (root / "skills" / "content-harness" / "SKILL.md").write_text("# harness\n")
            (root / "plugin-local-skills.json").write_text(json.dumps({
                "version": 1,
                "dest": "skills/",
                "skills": ["content-harness"],
            }))
            with self.assertRaisesRegex(RuntimeError, "must not appear"):
                vendor.validate_plugin_local_inventory(root, lock)

    def test_rejects_missing_license(self):
        vendor = load_module()
        source = {
            "package": "demo",
            "repo": "https://example.invalid/demo.git",
            "ref": "v1.0.0",
            "sha": "0" * 40,
            "skills": ["demo-skill"],
            "dest": "skills/",
            "sha256": {"demo-skill": "0" * 64},
        }
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(RuntimeError, "missing key 'license'"):
                vendor.validate_source(source, Path(tmp))

    def test_hash_skill_dir_is_stable(self):
        vendor = load_module()
        with tempfile.TemporaryDirectory() as tmp:
            skill = Path(tmp) / "skill"
            skill.mkdir()
            (skill / "SKILL.md").write_text("hello\n", encoding="utf-8")
            first = vendor.hash_skill_dir(skill)
            second = vendor.hash_skill_dir(skill)
            self.assertEqual(first, second)
            self.assertEqual(len(first), 64)


if __name__ == "__main__":
    unittest.main()
