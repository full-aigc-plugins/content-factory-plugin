# Operating-system installation matrix

CF-040 validates that the release directory is relocatable and can run from a
clean, non-ASCII user home on Node.js 24 without Bun or install-time native
compilation.

## Automated contract

Each CI operating-system job performs a script-free dependency install and then
runs lint, type checking, the release build, the complete regression suite, the
managed-skill integrity check, and the release security audit. Test resources
close database handles before temporary directories are removed, including on
Windows where open SQLite files cannot be unlinked.

| Runner | Installation and runtime coverage | Status |
| --- | --- | --- |
| Linux | CLI doctor, SQLite workspace, review rendering, delivery export, online backup and reopen | CI pending |
| macOS | CLI doctor, SQLite workspace, review rendering, delivery export, online backup and reopen | Local pass; CI pending |
| Windows | CLI doctor, SQLite workspace, review rendering, delivery export, online backup and reopen | CI pending |

The clean-install test copies only `dist/` into a Unicode path. It rejects
absolute paths and backslashes in the build manifest and asserts that the
manifest contains no development-machine home path. The release includes the
license, English and Chinese readmes, third-party notices, templates, runtime
source, schemas, managed skills, and deterministic file digests.

## Evidence boundary

The matrix proves automated package portability on fresh hosted runners. It
does not prove access to real host accounts, publishing channels, or external
provider credentials. Those validations retain their explicit live-verification
status and are not inferred from this matrix.
