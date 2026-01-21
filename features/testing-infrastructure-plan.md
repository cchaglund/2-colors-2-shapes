# Testing Infrastructure for Social Features

> **Entry point:** Use [MASTER.md](./MASTER.md) to automatically determine which task to work on next.

**Tasks file:** `features/testing-infrastructure-tasks.json`
- Tasks 1-9: Foundation (complete before Wall of the Day)
- Tasks 10-14: Feature-specific (complete after Friends feature)

---

## Problem
Social features require auth, multiple users, follow relationships, submissions. Currently no way to test without real database/users. Claude Code can't verify features autonomously.

## Solution: Dual-Layer Testing

### Layer 1: Unit Tests (Vitest)
Pure logic tests with mocked Supabase. Run via `npm run test:run`.

### Layer 2: Visual Test Pages
URL-accessible test pages (`?test=social`) with mock data. Claude Code verifies via Chrome Devtools MCP snapshots.

---

## Architecture

### Mock Infrastructure
- `src/test/mockData.ts` - Extended with users, profiles, follows, submissions
- `src/test/mockSupabase.ts` - Mock Supabase client factory
- `src/test/testUtils.tsx` - Test providers and helpers
- `vitest.setup.ts` - Global test setup

### Visual Test Page
- `src/test/SocialTestPage.tsx` - Scenarios for all social features
- Access via `?test=social`
- Reset button to clear localStorage between tests

### Unit Tests
- `src/utils/__tests__/privacyRules.test.ts`
- `src/utils/__tests__/wallSorting.test.ts`
- `src/hooks/__tests__/useFollows.test.ts` (after hook exists)

---

## Verification Flow

After implementing a feature:
1. Run `npm run test:run`
2. Start dev server: `npm run dev`
3. Navigate to `http://localhost:5173/?test=social`
4. Use Chrome Devtools MCP to verify scenarios

---

## Decisions

- Test pages included in production builds (matches existing VotingTestPage)
- Reset button added to clear state between scenarios
