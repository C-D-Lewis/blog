const { readdirSync, readFileSync, writeFileSync } = require('fs');
const slugify = require('slugify');

const DATE_TIME_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}/g;

const historyPath = `${__dirname}/../assets/history.json`;
const postsDir = `${__dirname}/../posts`;

/**
 * Transform bits inside a paragraph
 *
 * @param {string} para - Paragraph to transform.
 * @returns {string} Modified paragraph.
 */
const transformParagraph = (para) => {
  // Links
  while (para.includes('](')) {
    const labelStart = para.indexOf('[');
    const labelEnd = para.indexOf('](', labelStart);
    const label = para.substring(labelStart + 1, labelEnd);
    const locationStart = labelEnd + 2;
    const locationEnd = para.indexOf(')', locationStart);
    const location = para.substring(locationStart, locationEnd);

    para = para.substring(0, labelStart)
     + `<a class="link" target="_blank" href="${location}">${label}</a>`
     + para.substring(locationEnd + 1);
  }

  return para;
};

/**
 * Process the pseudomarkdown file into component model.
 *
 * @param {string} fileName - File name.
 * @returns {Object} Model of the post.
 */
const postToModel = (fileName) => {
  const text = readFileSync(`${postsDir}/${fileName}`, 'utf8');
  const [title, dateTime] = text.split('\n').slice(0, 2).map(p => p.trim());
  if (!title.length || !dateTime.match(DATE_TIME_REGEX) || !text.includes('---\n')) {
    throw new Error(`metadata error: ${fileName}`);
  }

  const model = { title, fileName, dateTime, components: [] };

  const body = text.split('---')[1].trim();
  const sections = body.split('\n\n').map(p => p.trim());
  sections.forEach((section) => {
    // Image
    if (section.startsWith('![')) {
      const description = section.substring( section.indexOf('[') + 1, section.indexOf(']'));
      const location = section.substring(section.indexOf('(') + 1, section.indexOf(')'));
      model.components.push({ type: 'image', description, location });
      return;
    }

    // H3, H2, H1...
    if (section.startsWith('#')) {
      const level = section.split('#').length - 1;
      const text = section.split('# ')[1];
      model.components.push({ type: 'header', level, text });
      return;
    }

    // Paragraph
    model.components.push({ type: 'paragraph', content: transformParagraph(section) });
  });

  console.log(`Loaded ${fileName}`);
  return model;
};

/**
 * The main function.
 */
const main = () => {
  const history = require(historyPath);
  const files = readdirSync(postsDir);

  // Build post models
  const models = files.map(postToModel);

  // Update history file
  models.forEach((model) => {
    const [year, month] = model.dateTime.split('-');

    if (!history[year]) {
      history[year] = {};
    }
    if (!history[year][month]) {
      history[year][month] = [];
    }
    if (history[year][month].find(p => p.title === model.title)) return;

    const fileName = model.fileName.split('.')[0];
    history[year][month].push({
      title: model.title,
      file: `rendered/${fileName}.json`,
    });
  });
  writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
  console.log('Updated history.json');
};

main();
