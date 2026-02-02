#!/bin/bash
set -e

# This constructs the sandbox name based on the script's directory name.
# It should only be used if you started the sandbox via the command: docker sandbox run claude .
# The resulting sandbox name will be of the form "claude-<directory-name>".
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIR_NAME="$(basename "$SCRIPT_DIR")"
SANDBOX_NAME="claude-$DIR_NAME"

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  result=$(docker sandbox run "$SANDBOX_NAME" -- -p "@RALPH.md @PRD.json @progress.txt")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done