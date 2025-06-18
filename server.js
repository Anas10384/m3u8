const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const mkdirp = require('mkdirp');
const m3u8Parser = require('m3u8-parser');

const channels = [
  {
    name: 'StarSports1Tamil',
    url: 'https://ts-j8bh.onrender.com/box.ts?id=4'
  },
  {
    name: 'SonyYay',
    url: 'https://ts-j8bh.onrender.com/box.ts?id=3'
  },
  {
    name: 'StarSports2TamilHD',
    url: 'https://ts-j8bh.onrender.com/box.ts?id=2'
  }
];

async function downloadChannel({ name, url }) {
  console.log(`📥 Downloading: ${name}`);
  const folder = path.join('/tmp', name); // <<====== /tmp
  await mkdirp(folder);

  try {
    const { data: m3u8Content } = await axios.get(url);
    const parser = new m3u8Parser.Parser();
    parser.push(m3u8Content);
    parser.end();

    const segments = parser.manifest.segments;
    if (!segments || segments.length < 5) {
      throw new Error('Not enough segments found.');
    }

    let indexM3U8 = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:1\n';

    for (let i = 0; i < 5; i++) {
      const segment = segments[i];
      const segmentUrl = new URL(segment.uri, url).href;

      const { data: segmentData } = await axios.get(segmentUrl, { responseType: 'arraybuffer' });
      const segmentPath = path.join(folder, `index${i + 1}.ts`);
      await fs.writeFile(segmentPath, segmentData);

      indexM3U8 += `#EXTINF:${segment.duration.toFixed(3)},\nindex${i + 1}.ts\n`;
    }

    indexM3U8 += '#EXT-X-ENDLIST\n';
    await fs.writeFile(path.join(folder, 'index.m3u8'), indexM3U8);
    console.log(`✅ Done: ${name}`);
  } catch (err) {
    console.error(`❌ Failed for ${name}:`, err.message);
  }
}

(async () => {
  for (const channel of channels) {
    await downloadChannel(channel);
  }
})();
