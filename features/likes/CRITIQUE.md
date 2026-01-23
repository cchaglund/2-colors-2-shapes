Critical Issues 🚨
1. No Performance Strategy for "Sort by Likes"
The PRD says sort by likes DESC but doesn't address HOW. Are you:

Computing COUNT(*) on every query? That's O(n) per submission
Denormalizing like_count on submissions table? Then you need triggers or application-level sync
Using a materialized view? Need refresh strategy
Sorting the entire wall by likes without an index strategy will crater at scale.

2. Race Conditions Completely Ignored
User double-clicks the heart. What happens?

Two INSERT requests fire
First succeeds, second fails with unique constraint
Or worse: optimistic UI shows liked, then both fail, UI is now out of sync
Need: debouncing, request deduplication, or proper optimistic update rollback.

3. No Error Handling Specified
Network fails mid-like. Then what?

Toast notification?
Silent retry?
Revert UI state?
The PRD has zero acceptance criteria for failure states.
4. Anonymous User Flow is an Afterthought
Added as item #12 in PRD, but should be architectural. What happens when:

Anon user clicks disabled button? Just... nothing?
Should it prompt login? Redirect?
Show a helpful CTA or just grey it out?
Missing Edge Cases 🕳️
Deleted submissions - User has page open, submission gets deleted, they click like → 404? Error? Redirect?

Concurrent likes - Two users like simultaneously. Count goes from 5 → 6 or 5 → 7? Matters for UI update timing.

Session expiry - Page loaded while logged in, session expires, click like → silent fail? Force re-auth?

Large numbers - Submission goes viral with 12,847 likes. Display "12847" or "12.8k"? Truncation?

Zero likes display - Show "0" with heart? Just heart? Nothing? PRD says "shows '0' or no number" — that's not a spec, that's a question.

Pagination + sorting - User on page 2 of "likes" filter. Someone else likes a submission on page 1. The ordering is now stale. Refresh strategy?

Likes from deleted/banned users - Do they still count? If user gets banned, do their likes persist?

Questionable Design Decisions 🤔
"No like button on wall because thumbnails are too small"
Really? Instagram shows likes on thumbnails. Twitter/X shows them. The justification is "disingenuous" but that's... opinion presented as requirement. If the real reason is "I don't want to build it," just say that.

Tooltip says "Unlike" when liked
Most apps say "Liked" (state) not "Unlike" (action). Both patterns exist but "Unlike" is less common and might confuse users expecting state indication.

Own submission disabled
Why can't I "bookmark" my own work? Many platforms allow self-likes. The arbitrary restriction needs justification.

What's Completely Missing 📝
API contract - REST endpoints? Supabase RPC? Request/response shape?
Loading states - Skeleton? Spinner? Disabled during mutation?
Optimistic updates - Specified anywhere? Critical for UX
Cache invalidation - How does liking affect cached submission data elsewhere?
Analytics events - Tracking likes for insights?
Rate limiting - Can I script 1000 like/unlike toggles per second?
Cascade behavior - Submission deleted → likes deleted? Foreign key constraint?
The Database Question You Asked
The PRD glosses over this with "unique constraint on (user_id, submission_id)" but doesn't address the count strategy. Your options:

Approach	Pros	Cons
COUNT(*) on read	Always accurate, simple	Slow at scale, expensive sort
Denormalized count	Fast reads, easy sort	Must keep in sync (triggers/app logic)
Materialized view	Best of both worlds	Postgres-specific, refresh lag
For a daily challenge app with presumably <10k submissions/day, denormalized count with a database trigger is probably fine. But the PRD doesn't even acknowledge this decision exists.

TL;DR: This PRD is a feature wish list, not an implementation spec. It describes the happy path and punts on everything else. A junior dev following this would build something that works in demo and breaks in production.