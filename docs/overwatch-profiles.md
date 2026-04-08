# Overwatch Profiles

By querying the (internal) Overwatch API, we can fetch some of a player's profile information. This is used to display avatars and titles on the player page, as well as a link to their full profile on the official Overwatch website (whose URL scheme is more complicated than simply appending their battletag).

The main machinery for this is located in the `src/lib/server/overwatch.ts` file.

## Overwatch API

The API is located at `https://overwatch.blizzard.com/en-us/search/account-by-name/{name}` where name is a player name, **not** the full battletag. In fact, full battletags are not exposed at all, not even in the main profile page's HTML.

Here is a sample response from the endpoint:

```json
[
	{
		"isPublic": true,
		"lastUpdated": 1775482517,
		"namecard": "https://d15f34w2p8l1cc.cloudfront.net/overwatch/00c2686232bd78d2662742e95a7fdea48de224b3c70944717ea5ee295f7ab048.png",
		"avatar": "https://d15f34w2p8l1cc.cloudfront.net/overwatch/bb919dea4f7ec636f3d7a1afbc27c6461af5da2a83b6cde63f1e4b6502a0e632.png",
		"title": {
			"en_US": "Stalwart Hero",
			"es_MX": "Heroísmo leal",
            // ...
			"th_TH": "ฮีโร่ผู้แข็งแกร่ง"
		},
		"url": "d84ba28181708fe0bba121a9d5%7C4d8123f4f89b5a5ac17c11b741c967e8",
		"name": "JunkRat"
	},
	{
		"isPublic": true,
		"lastUpdated": 1775467320,
		"namecard": "https://d15f34w2p8l1cc.cloudfront.net/overwatch/d6e34e323024c1cbbb98e16beccffd294da8a926c72710fef7cb0c8c6c9dc3d1.png",
		"avatar": "https://d15f34w2p8l1cc.cloudfront.net/overwatch/d60d5053a6a819e390ebc8f73ab5827a804f6c7dba712457da2a3a4e836b8c50.png",
		"title": "",
		"url": "d86b82a18150afe0bba122a7d4%7C42cd1def09165470e6c28dd5f9f77981",
		"name": "JUNKRAT"
	}
    // ...
]
```

To differentiate between profiles with the same name but different tags, we use the `url` field, called `slug` in the codebase. In case the search returns multiple profiles for a player, they are able to select a profile in the admin interface, which will store the slug in the database and use that to filter the result from then on. This slug is also used to construct the URL to the official profile page, which is `https://overwatch.blizzard.com/en-us/career/{slug}`.

The API is quite slow, so we cache the results in Redis (or a `Map` if `REDIS_URL` isn't provided), and refresh it on every 24 hours.