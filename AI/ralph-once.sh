#!/bin/bash

# This script should be in a directory named "AI" in the root of the project.
# Run this file from the root of the project, with: `AI/ralph-once.sh`
# The files referenced should all be in the features/current-feature directory.
claude --permission-mode acceptEdits "@AI/RALPH.md @features/current-feature/PRD.json @features/current-feature/progress.txt"