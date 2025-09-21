#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');

const config = require('../check-config.json');

// プロジェクト直下の HTML ファイルを対象
const htmlDir = path.join(__dirname, '../dist');  // HTML があるディレクトリ

// チェック関数
function checkHTML(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(content);

  const errors = [];

  // title
  if (config.required.title) {
    const title = $('head title').text();
    if (!title || title.trim() === '') {
      errors.push('Missing or empty <title>');
    }
  }

  // description meta name="description"
  if (config.required.description) {
    const desc = $('head meta[name="description"]').attr('content');
    if (!desc || desc.trim() === '') {
      errors.push('Missing or empty meta[name="description"]');
    }
  }

  // OG tags
  const ogProps = ['site_name', 'type', 'url', 'image', 'description'];
  ogProps.forEach(prop => {
    const key = `og:${prop}`;
    if (config.required[key]) {
      const selector = `head meta[property="og:${prop}"]`;
      const tag = $(selector);
      if (tag.length === 0) {
        errors.push(`Missing og:${prop} meta tag`);
      } else {
        const content = tag.attr('content');
        if (!content || content.trim() === '') {
          errors.push(`og:${prop} meta tag has empty content`);
        }
      }
    }
  });

  // Google Tag Manager チェック
  if (config.required['google-tag-manager']) {
    const gtmScript = $('script').filter((i, el) => {
      const src = $(el).attr('src') || '';
      return src.includes('googletagmanager.com') || src.includes('gtm.js');
    });
    const gtmInline = $('script').filter((i, el) => {
      const html = $(el).html();
      return html && html.includes('googletagmanager');
    });
    if (gtmScript.length + gtmInline.length === 0) {
      errors.push('Missing Google Tag Manager snippet');
    }
  }

  // a タグの href チェック
  if (config.required['a-href']) {
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href || href.trim() === '') {
        errors.push(`<a> tag with missing or empty href (index ${i})`);
      }
    });
  }

  return errors;
}

function main() {
  // プロジェクトルート直下の .html
  const pattern = path.join(htmlDir, '*.html');
  const files = glob.sync(pattern);
  let hasError = false;

  if (files.length === 0) {
    console.warn('No HTML files found in project root.');
  }

  files.forEach(fp => {
    const errs = checkHTML(fp);
    if (errs.length > 0) {
      console.error(`\nErrors in ${path.basename(fp)}:`);
      errs.forEach(e => console.error('  - ' + e));
      hasError = true;
    }
  });

  if (hasError) {
    process.exit(1);
  } else {
    console.log('All checks passed ✅');
  }
}

main();
