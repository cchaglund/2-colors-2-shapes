#!/bin/bash

# This script should be in a directory named "AI" in the root of the project.
# Run this file from the root of the project, with: `AI/ralph-afk.sh <iterations>`
# The files referenced should all be in the features/current-feature directory.

set -e

# This constructs the sandbox name based on the current working directory.
# It should only be used if you created the sandbox via the command: "docker sandbox run claude ."
# (if you custom-named your VM something else, adjust accordingly)
# The resulting sandbox name will be of the form "claude-<repo-directory-name>".
# Run this script from the project root directory.
DIR_NAME="$(basename "$(pwd)")"
SANDBOX_NAME="claude-$DIR_NAME"

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  result=$(docker sandbox run "$SANDBOX_NAME" -- -p "@AI/RALPH.md @features/current-feature/PRD.json @features/current-feature/progress.txt")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done