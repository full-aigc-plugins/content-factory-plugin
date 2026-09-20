#!/usr/bin/env python3
"""Offline documentation checks only. Does not certify OpenSpec CLI or runtime."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

CHANGE = Path('openspec/changes/implement-content-factory-architecture')
ARCH = Path('docs/architecture/Content-Factory-Architecture.zh_CN.md')

def require(ok, message):
    if not ok:
        raise ValueError(message)

def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def outside_fences(text):
    lines, inside = [], False
    for line in text.splitlines():
        if line.startswith('```'):
            if not inside:
                require(bool(line[3:].strip()), 'Code fence has no language')
            inside = not inside
            continue
        if not inside:
            lines.append(line)
    require(not inside, 'Unclosed code fence')
    return '\n'.join(lines)

def verify(root, known_paths):
    arch = (root / ARCH).read_text(encoding='utf-8')
    manifest = json.loads((root / 'docs/architecture/preservation.json').read_text())
    body = arch.split('<!-- PRESENTATION-BEGIN -->\n', 1)[1].split('\n<!-- PRESENTATION-END -->', 1)[0]
    require(digest(body) == manifest['presentation_sha256'], 'Preserved presentation changed')
    require(len(body.encode()) == manifest['presentation_bytes'], 'Presentation byte count changed')
    blocks = re.findall(r'^```text\n(.*?)\n^```', body, re.M | re.S)
    require(len(blocks) == 4, 'Expected four preserved text blocks')
    for block, entry in zip(blocks, manifest['text_blocks']):
        require(digest(block) == entry['sha256'], f"Diagram {entry['index']} changed")
        require(len(block.encode()) == entry['bytes'], 'Diagram byte count changed')
    for section in manifest['required_sections']:
        require('## ' + section in body, 'Missing section: ' + section)
    pairs = []
    for channel in manifest['channels']:
        match = re.findall(r'^\| ' + re.escape(channel) + r' \| ([^|]+) \|$', arch, re.M)
        require(len(match) == 1, 'Missing or duplicate channel row: ' + channel)
        pairs += [(channel, fmt.strip()) for fmt in match[0].split('、')]
    require(len(manifest['channels']) == 16 and len(pairs) == 39, 'Channel/format coverage mismatch')
    c = root / CHANGE
    index = json.loads((c / 'task-index.json').read_text())
    ids = [f'CF-{i:03}' for i in range(1, 59)]
    require([x['id'] for x in index['tasks']] == ids, 'Parent IDs must be CF-001..CF-058')
    task_text = (c / 'tasks.md').read_text()
    found = re.findall(r'^## \d+\. (CF-\d{3}) —', task_text, re.M)
    require(found == ids, 'Task parent headings mismatch')
    children = re.findall(r'^- \[ \] \d+\.\d+ \[(CF-\d{3}\.[1-4])\]', task_text, re.M)
    require(children == [f'{p}.{n}' for p in ids for n in range(1, 5)], 'Child coverage mismatch')
    require(not re.search(r'^- \[[xX]\]', task_text, re.M), 'Unimplemented task checked')
    require(index['parent_count'] == 58 and index['child_count'] == 232, 'Index counts mismatch')
    order = index['execution_order']
    require(len(order) == 58 and set(order) == set(ids), 'Execution order is not a permutation')
    pos = {p: i for i, p in enumerate(order)}
    for task in index['tasks']:
        path, anchor = task['detail'].split('#', 1)
        detail = (c / path).read_text()
        marker = f'<a id="{anchor}"></a>'
        require(detail.count(marker) == 1, 'Missing/duplicate task card')
        card = detail.split(marker, 1)[1].split('<a id=', 1)[0]
        for label in ('依赖', '文件', '输入', '输出', '验收', '约束', '反例', '验证命令', '证据'):
            require(f'**{label}：**' in card, f'{task["id"]} missing {label}')
        dep_line = card.split('**依赖：**', 1)[1].split('\n', 1)[0]
        require(re.findall(r'CF-\d{3}', dep_line) == task['dependencies'], 'Card dependencies drift')
        for dep in task['dependencies']:
            require(dep in pos and pos[dep] < pos[task['id']], 'Dependency cycle/order error')
        require(re.search(r'npm run test -- tests/[^`\s]+\.test\.ts', card), 'Missing exact test command')
        require(f'docs/verification/tasks/{task["id"]}.json' in card, 'Missing task evidence path')
    require(pos['CF-057'] < pos['CF-058'] < pos['CF-042'], 'Release ordering violated')
    trace = (c / 'traceability.md').read_text()
    require(re.findall(r'^\| (CF-\d{3}) \|', trace, re.M) == ids, 'Traceability coverage mismatch')
    requirements, scenarios = 0, 0
    for spec in sorted((c / 'specs').glob('*/spec.md')):
        text = spec.read_text()
        require('## ADDED Requirements' in text, 'Missing ADDED Requirements')
        sections = re.split(r'^### Requirement: ', text, flags=re.M)[1:]
        requirements += len(sections)
        for section in sections:
            require('SHALL' in section.split('\n', 1)[0], 'Requirement lacks SHALL')
            cases = re.split(r'^#### Scenario: ', section, flags=re.M)[1:]
            require(bool(cases), 'Requirement has no scenario')
            scenarios += len(cases)
            for case in cases:
                require('**WHEN**' in case and '**THEN**' in case, 'Scenario missing WHEN/THEN')
    require((requirements, scenarios) == (12, 24), 'Specification counts mismatch')
    docs = [root / ARCH, root / 'README.md', root / 'AGENTS.md', root / 'openspec/README.md']
    docs += sorted(c.rglob('*.md'))
    links = 0
    for path in docs:
        text = outside_fences(path.read_text())
        require(len(re.findall(r'^# ', text, re.M)) == 1, f'Expected one H1: {path.name}')
        for target in re.findall(r'(?<!!)\[[^\]\n]+\]\(([^)]+)\)', text):
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc:
                continue
            local = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            require(local.is_relative_to(root), 'Relative link escapes root')
            rel = local.relative_to(root).as_posix()
            require(local.exists() or rel in known_paths, 'Broken relative link: ' + rel)
            if parsed.fragment:
                require(local.exists(), 'Anchor needs actual target bytes: ' + rel)
                target_text = local.read_text()
                require(f'id="{unquote(parsed.fragment)}"' in target_text, 'Missing explicit anchor')
            links += 1
    return {'scope': 'offline documentation checks only', 'status': 'PASS',
            'preserved_sections': 3, 'preserved_text_blocks': 4, 'parents': 58,
            'children': 232, 'channels': 16, 'channel_format_pairs': 39,
            'requirements': requirements, 'scenarios': scenarios, 'relative_links': links,
            'official_openspec_cli': 'NOT_RUN', 'product_tests': 'NOT_RUN'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--known-paths', type=Path, help='Optional verified remote path inventory for partial doc packages')
    args = parser.parse_args()
    try:
        known = set(json.loads(args.known_paths.read_text())) if args.known_paths else set()
        result = verify(args.root.resolve(), known)
    except (OSError, ValueError, KeyError, IndexError) as exc:
        print(json.dumps({'status': 'FAIL', 'error': str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0

if __name__ == '__main__':
    sys.exit(main())
