<!-- - show the actual shapes in the single submission view, not just the name of them. -->
<!-- - in the single submission view there should be buttons to go to next/previous submission without going back to the list. -->
- can see wall of the day's submissions - but only after you've submitted something yourself. 
- shapes outside the canvas - you should still see them, but unless they're in the canvas box they won't be saved of course. But this would allow you to build "components" off-canvas and then bring them in when needed.
- buy domain and set up hosting
- do logo
- bug: när man flyttar en grupp under en annan så hamnar inte alla element under den andra gruppen. Det är som att varje element i gruppen har sin egen z-index.
- bug: när man roterar en hel drös med shapes så verkar de rotera lite olika mängder

- if i got a trophy for a challenge's submission I should get a congratulations message/modal when I load/log in for that day (today I see the challenge's winners, but it's possible to miss that I won, I have to check the list to see if I won. It should be more obvious).
- test a bunch of manipulations (scaling, rotating, moving around) to see if the outline updates correctly in all cases.
- verify that when dragging layers in and out of groups, the layer panel UI updates correctly to reflect the new location of the layer after dragging.
- duplicating items in a group should behave as expected, currently it wasn't, they were ending up outside the group.
- make sure voting works properly
- moving shapes with arrow buttons seems to be jumping too much, should be 1px per press
- when holding two fingers on trackpad and moving them you should pan the canvas (right now it's just scrolling the page)
- should we have more colors...? allows background to be any color? Allow bg to be either one of the two colors or black or white?
- when i log out and click log in again, I'm not able to select between my google accounts, it just logs in with the last one I used.
- forms for submitting feedback, reporting bugs, requesting features
- when you select two shapes the bounding box surrounding them is larger than it should be (at least if one of the shapes has been flipped)
- the bounding boxes can be made thinner, they look too thick currently

What you need to provide
1. OG image → Save as /public/og-image.png
- Size: 1200 x 630 pixels
- Will be used for social sharing previews

After launch: Google Search Console
Once the domain is live, submit it to Google Search Console and:
1. Verify ownership (you already have /public/googled1c25da4c512d2d8.html - may need updating for the new domain)
2. Submit the sitemap: https://2colors2shapes.art/sitemap.xml