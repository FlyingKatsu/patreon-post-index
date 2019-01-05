# Patreon Post Index Generator

The [demo](http://flyingkatsu.com/patreon-post-index/index.html) is an example of formatting post data requested from Patreon, using the ID of [HeatPhoenix](https://www.patreon.com/join/heatphoenix)'s Patreon campaign.

If you want to use this for another campaign,
1. download the files or clone this repo,
2. access the following URL (replacing `CAMPAIGN-ID` as appropriate) to get the first 20 posts,
3. save the file as `1.json` and if there is a link at the bottom of the data, use it to get the next 20 posts
4. replace the `data/#.json` files with the data you receive:

`https://www.patreon.com/api/posts?filter[campaign_id]=`CAMPAIGN-ID`&include=attachments,user_defined_tags,campaign.rewards&fields[post]=content,min_cents_pledged_to_view,post_type,title,url,published_at&sort=-published_at&filter[is_draft]=false`

**Please Note:** Data will only include attachment filenames if you are at the appropriate pledge tier. For example, this dataset only includes attachments up to the $1 tier. If you are not a patron, or not signed in, you will only see attachments for the "Everyone" tier!

## Credits

This demo uses files from the following projects:
- [Remarkable](https://github.com/jonschlinkert/remarkable)
- [github-markdown-css](https://sindresorhus.com/github-markdown-css/)

This demo uses the API url behind Patreon's `Load More Posts` button, which should not be considered an official [Patreon Developer API](https://docs.patreon.com/#introduction) endpoint until it gets added to their docs.
