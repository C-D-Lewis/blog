const { parseString } = require('xml2js');
const { promisify } = require('util');
const { readFileSync, writeFileSync } = require('fs');

const inputPath = `${__dirname}/../assets/export/final.xml`;
const outputPath = `${__dirname}/../assets/import/posts.json`;

const parseStringAsync = promisify(parseString);

/**
 * The main function.
 */
const main = async () => {
  const xml = readFileSync(inputPath, 'utf8');
  const { rss } = await parseStringAsync(xml);

  const pages = rss.channel[0].item;
  const posts = pages
    .filter(p => p['wp:post_type'].includes('post'))
    .map(p => ({
      id: p['wp:post_id'][0],
      title: p.title[0],
      link: p.link[0],
      pubDate: p.pubDate[0],
      postDate: p['wp:post_date'][0],
      body: p['content:encoded'][0],
      tags: p.category ? p.category.map(q => q._) : [],
    }));

  console.log(`Extracted ${posts.length} posts`);
  writeFileSync(outputPath, JSON.stringify(posts, null, 2), 'utf8');
};

main();
