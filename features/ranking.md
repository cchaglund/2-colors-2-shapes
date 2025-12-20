# Ranking Feature

A daily competition where users vote on pairwise comparisons of artworks to determine a winner using the Elo rating system.

## Core Concept

Users are presented with two artworks side by side and asked to choose which one they prefer. These pairwise comparisons are used to compute a global ranking of all artworks for each day's challenge using the Elo rating system.

## Timing Model

- **Day N**: Users create and submit artworks
- **Day N+1**: Users vote on Day N's submissions (when they come to submit their new artwork)
- **Day N+1 (first visit)**: Winner announcement modal for Day N

This ensures all submissions get equal voting exposure regardless of when they were submitted during the day.

## Voting Flow

1. User submits their artwork (saved immediately)
2. User is prompted to vote on yesterday's submissions
3. User must complete **5 actual votes** (skips don't count) to enter their submission into the ranking
4. After 5th vote: "Your submission is now entered!" confirmation with:
   - "Continue Voting" button (vote indefinitely if desired)
   - "Done" button (exit voting)
5. User can skip voting entirely → their art is saved but excluded from ranking

## Smart Pair Selection Algorithm

With potentially hundreds of submissions, prioritize pairs that maximize ranking accuracy:

1. **Artworks with fewer votes** - ensure minimum coverage
2. **Artworks with similar Elo scores** - most informative matchups
3. **Artworks the user hasn't seen** - maximize unique voter coverage
4. **Never show user their own submission**

## Minimum Submissions Threshold

- **5+ submissions**: Full ranking with trophies and winner announcement
- **< 5 submissions**: Show all submissions in modal, labeled "Not enough entries for ranking today", no trophies awarded

## Winner Announcement

- Modal on first visit of the day
- Shows **top 3** submissions:
  - 1st place (gold trophy)
  - 2nd place (silver trophy)
  - 3rd place (bronze trophy)
- If there's a tie, display it clearly as a tie

## Trophies

- Top 3 get trophies: gold, silver, bronze
- Trophies appear next to the submission in the calendar view
- Ties share the same trophy tier

## Submission Detail Page

When viewing a submission via the calendar:
- Show the submission's ranking (e.g., "13/287")
- Display trophy if top 3

## Data Model (Conceptual)

- `Submission` gains `eloScore` field (default: 1000)
- `Submission` gains `includedInRanking` boolean
- New `Comparison` entity:
  - `submissionA`: reference
  - `submissionB`: reference
  - `winner`: reference (A, B, or null if skipped)
  - `voterId`: reference
  - `timestamp`: datetime
- `Challenge` gains:
  - `winnerId`: reference (set after voting closes)
  - `rankingEnabled`: boolean (true if >= 5 submissions)
