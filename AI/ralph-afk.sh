#!/bin/bash

# This script should be in a directory named "AI" in the root of the project.
# Run this file from the root of the project, with: `AI/ralph-afk.sh <iterations>`
# The files referenced should all be in the features/current-feature directory.

cleanup() {
  echo " Interrupted"
  pkill -P $$ 2>/dev/null
  wait 2>/dev/null
  exit 130
}
trap cleanup INT TERM

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

# Ensure zombie reaper is running in the sandbox (prevents zombie accumulation)
# This runs synchronously - waits for completion before continuing
echo "Ensuring zombie reaper is running..."
docker sandbox exec "$SANDBOX_NAME" bash -c '
  if ! pgrep -f zombie-reaper.py > /dev/null 2>&1; then
    if [ -f /usr/local/bin/zombie-reaper.py ]; then
      nohup python3 /usr/local/bin/zombie-reaper.py > /tmp/zombie-reaper.log 2>&1 &
      echo "Started zombie reaper"
    else
      echo "Warning: zombie-reaper.py not found - zombies may accumulate"
    fi
  else
    echo "Zombie reaper already running"
  fi
'

for ((i=1; i<=$1; i++)); do
  LOG_FILE="/tmp/claude-run-$$.log"
  # Python PTY wrapper: gives docker a fake terminal (so Claude streams output)
  # without touching our real terminal (so Ctrl+C still works)
  python3 -c '
import pty, os, sys, subprocess, signal
master, slave = pty.openpty()
proc = subprocess.Popen(sys.argv[1:], stdin=slave, stdout=slave, stderr=slave)
os.close(slave)
signal.signal(signal.SIGTERM, lambda *_: (proc.kill(), sys.exit(130)))
try:
    while True:
        data = os.read(master, 4096)
        if not data: break
        os.write(1, data)
except (OSError, KeyboardInterrupt):
    pass
proc.wait()
sys.exit(proc.returncode or 0)
' docker sandbox run "$SANDBOX_NAME" -- -p --verbose --output-format stream-json "@AI/RALPH.md @features/current-feature/PRD.json @features/current-feature/progress.txt" 2>&1 | tee "$LOG_FILE" &
  wait $! 2>/dev/null || true

  # Kill any orphaned processes to prevent zombie accumulation
  docker sandbox exec "$SANDBOX_NAME" bash -c '
    pkill -9 node 2>/dev/null
    pkill -9 vite 2>/dev/null
    pkill -9 esbuild 2>/dev/null
    pkill -9 npm 2>/dev/null
    pkill -9 playwright 2>/dev/null
  ' 2>/dev/null || true
  sleep 2

  final_result=$(grep '"type":"result"' "$LOG_FILE" | tail -1 | jq -r '.result // ""' 2>/dev/null)
  if [[ "$final_result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done
