#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 n3gh.
#
# This file is part of the n3gh scoring engine and collection pipeline.
# Licensed under the GNU Affero General Public License v3.0 ONLY; see LICENSE.
# A separate commercial licence is available for parties who cannot accept the
# AGPL's obligations: hello@n3gh.com. The commercial licence covers this code
# only -- it conveys NO right in the collected archive, which is unpublished and
# all rights reserved. See NOTICE.md.

# n3gh. — offline backup of the private data archive to external storage.
#
# First run (creates a full mirror — contains ALL history):
#   ./backup.sh /Volumes/YOUR_DRIVE/n3gh-backup
#
# Every following run (fast incremental update):
#   ./backup.sh /Volumes/YOUR_DRIVE/n3gh-backup
#
# A git *mirror* contains every commit, every snapshot, every day ever recorded.
# Even if GitHub disappeared or the account were compromised, this copy restores
# everything:  git clone /path/n3gh-data.git  →  full archive back.
# Suggested cadence: weekly, or whenever you plug the drive in.
set -euo pipefail

DEST="${1:?usage: ./backup.sh /path/to/external/drive/folder}"
REPO_DATA="https://github.com/McJack3d/kleerer-data.git"
REPO_SITE="https://github.com/McJack3d/PJT_kleerer.io.git"

mkdir -p "$DEST"
for REPO in "$REPO_DATA" "$REPO_SITE"; do
  NAME="$(basename "$REPO")"
  TARGET="$DEST/$NAME"
  if [ -d "$TARGET" ]; then
    echo "→ updating mirror $NAME"
    git -C "$TARGET" remote update --prune
  else
    echo "→ creating mirror $NAME (first run)"
    git clone --mirror "$REPO" "$TARGET"
  fi
done

echo
echo "Backup complete → $DEST"
echo "Verify anytime with:  git -C \"$DEST/n3gh-data.git\" log --oneline -3"
