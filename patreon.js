// https://www.patreon.com/api/posts?filter[campaign_id]=1153441&include=attachments,user_defined_tags,campaign.rewards&fields[post]=content,min_cents_pledged_to_view,post_type,title,url,published_at&sort=-published_at&filter[is_draft]=false
// data = posts
// included = [ campaign, post_tag, reward, attachment ]

const md = new Remarkable();

const getPostType = (type) => {
    switch(type) {
        case 'text_only':
            return 'Text';
        case 'video_embed':
        case 'video_file':
            return 'Video';
        case 'audio_embed':
        case 'audio_file':
            return 'Audio';
        case 'poll':
            return 'Poll';
        case 'image_embed':
        case 'image_file':
            return 'Image';
        case 'link':
            return 'Link';
        default:
            return type;
    }
};

const processData = (input) => {
    if (input.total > -1 && input.total != input.data.length) {
        console.log(`Expected ${input.total} posts, but got ${input.data.length}. Did you include all the files?`);
    } else {
        console.log(`Combined all file data! ${input.total} posts collected.`);
    }
    console.log(`Sorting included data...`);
    const sorted = {};
    input.included.map( (data) => {
        if (data.type=='reward' || data.type=='campaign') {
            if (!sorted[data.type]) sorted[data.type] = [];
            sorted[data.type].push(data.attributes);
        } else {
            if (!sorted[data.type]) sorted[data.type] = {};
            sorted[data.type][data.id] = data.attributes;
        }
    });
    console.log(sorted);
    console.log(`Preparing buckets for tier levels...`);
    const tiers = {};
    sorted.reward.map( (reward) => {
        const cost = (reward.amount > 1) ? ` ($${reward.amount/100}+)`: ``;
        if (!tiers[reward.amount]) {
            tiers[reward.amount] = {
                posts: [],
                title: `${reward.title || reward.description}${cost}`
            };
        }
    } );
    console.log(tiers);
    console.log(`Sorting posts by tier, along with related attachments and tags...`);
    input.data.map( (post) => {
        const type = getPostType(post.attributes.post_type);
        const published = new Date(post.attributes.published_at);
        let detail = `- **${type}** [${post.attributes.title}](${post.attributes.url}) - *${published.toLocaleString()}*`;

        const tags = post.relationships.user_defined_tags;
        if (tags) {
            const t = tags.data.reduce( (txt, name, i) => {
                return `${txt} | #${sorted.post_tag[name.id].value}`
            }, ``);
            if (t) detail += `\n\t- Tagged: ${t}`;
        }

        const attachments = post.relationships.attachments;
        if (attachments) {
            const attach = attachments.data.map( (file, i) => {
                return `📎 [${sorted.attachment[file.id].name}](${sorted.attachment[file.id].url})`
            });
            if (attach.length > 0) detail += `\n\t- Attachments: ${attach.join(', ')}`;
        }
        
        if (!tiers[post.attributes.min_cents_pledged_to_view]) {
            // This will occur if you do not have access to view higher tier rewards
            const cents = post.attributes.min_cents_pledged_to_view;
            const cost = (cents == null) ? '(null... API bug?)' : (cents > 1) ? 
                ` ($${cents/100}+)`: (cents < 0) ?
                `Everyone` : `Patrons Only`;
            tiers[post.attributes.min_cents_pledged_to_view] = { posts: [], title: `Hidden Tier ${cost}` }
        }
        tiers[post.attributes.min_cents_pledged_to_view].posts.push(detail);
    });
    console.log(`Done processing! Writing to page...`);

    return Object.keys(tiers).reduce( (txt, tier, i) => {
        if (tiers[tier].posts.length == 0) return `${txt}\n\n## ${tiers[tier].title}\n*No posts exclusive to this tier.*`;
        return `${txt}\n\n## ${tiers[tier].title}\n${tiers[tier].posts.join('\n')}`;
    }, `# ${sorted.campaign[0].name}'s Patreon Post Index\n\n`);
};

const getDataAsync = async (filename,output) => {
    const res = await fetch(filename);
    const json = await res.json();
    output.data = output.data.concat(json.data);
    output.included = output.included.concat(json.included);
    output.total = (json.meta.pagination.total > output.total) ? json.meta.pagination.total : output.total;
    console.log(filename);
    console.log(output);
    return Promise.resolve(output);
};

const doFiles = (files, formatID, rawID) => {
    const input = {
        data: [],
        included: [],
        total: -1
    };
    // credit: https://stackoverflow.com/a/24586168 Use reduce for iterative promise, smart!
    return files.reduce( (p, file) => {
        return p.then((output) => getDataAsync(file.trim(),output));
     }, Promise.resolve(input))
        .then( (data) => {
            document.getElementById(formatID).innerHTML = md.render(processData(data));
            document.getElementById(rawID).innerHTML = processData(data);
        } )
        .catch(console.error);
};

const readFiles = (fileId, outputIdFormat, outputIdRaw) => {
    const files = document.getElementById(fileId).value.split(',');
    doFiles(files,outputIdFormat,outputIdRaw);
};

const chooseFiles = (element, formatID, rawID) => {
    console.log(element.value);
    const values = element.value.split(',');
    const dir = values[0];
    const count = values[1];
    const files = [];
    for (let i=1; i<=count; i++) {
        files.push(`${dir}/${i}.json`);
        console.log(`${dir}/${i}.json`);
    }
    doFiles(files, formatID, rawID);
};