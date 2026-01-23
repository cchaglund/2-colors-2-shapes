On the single submission page, should be able to like submissions. The icon should be a heart, and it should fill in when liked. The number of likes should update accordingly. On the user's own submissions, the like button should be disabled. Liking/unliking should update the count and fill state accordingly. Any likes should be stored in the database and persist across sessions, obviously. The like button should have a tooltip that says "Like" when not liked and "Unlike" when liked. The like button should be accessible via keyboard and screen readers. 

When viewing the wall of the day, add a filter option which is called "likes" (i.e. in addition to "random", "newest", and whatever else is already there). Submissions should then be sorted by number of likes in descending order, with ties broken by submission time (earliest first). You should not be able to like a submission from the wall, because the thumbnails are too small so it would be disingenious to like them from here (you need to go to the single submission view to like). The like button should therefore not be shown on the wall of the day. However, when the user is viewing the wall with the "likes" filter active, each submission thumbnail should display the number of likes it has received, e.g. as a small heart icon with the count next to it in the corner of the thumbnail.

What is the best way to store likes in the database? Pros and cons of different approaches?

---

## Clarifications

**Deleted submission handling:** If user tries to like a submission that was deleted (stale page), show toast "Submission no longer exists" and keep user on page.

**Anonymous user click:** Clicking the disabled like button should prompt login (open login modal or redirect to sign-in).