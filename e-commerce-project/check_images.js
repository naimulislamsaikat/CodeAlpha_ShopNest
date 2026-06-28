const fs = require('fs');
const src = fs.readFileSync('database.js', 'utf8');

const broken = [
  'https://images.unsplash.com/photo-160804315226-423dbba4e7e1',
  'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a',
  'https://images.unsplash.com/photo-1624222247344-550fb8ecfe7c',
  'https://images.unsplash.com/photo-1559592482-124b33670950',
  'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c',
  'https://images.unsplash.com/photo-1561361513-2d000a50f0db',
  'https://images.unsplash.com/photo-1591808302639-68d84a1271e4',
  'https://images.unsplash.com/photo-1549492423-400259a2e57f',
  'https://images.unsplash.com/photo-1517263904838-7fa9a4403a1b',
  'https://images.unsplash.com/photo-1515488042361-404e9250afef',
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b',
  'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0',
  'https://images.unsplash.com/photo-1608463567784-cf89dd7fc73a',
  'https://images.unsplash.com/photo-1522337627787-4be9c723b216',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2',
  'https://images.unsplash.com/photo-1607860108855-64cac2078bd2',
  'https://images.unsplash.com/photo-1604654894610-df4906b187a2',
  'https://images.unsplash.com/photo-1617083934335-e1143c7b916d',
  'https://images.unsplash.com/photo-1595273670150-db0d3bf3cab2',
  'https://images.unsplash.com/photo-1622445262465-2481c4574875',
  'https://images.unsplash.com/photo-1563163447-10aff1c398d5',
  'https://images.unsplash.com/photo-1596131397999-cc3b5c3ff902',
  'https://images.unsplash.com/photo-1576871337622-98d48d4aa53e',
];

const lines = src.split('\n');
broken.forEach(url => {
  lines.forEach((line, i) => {
    if (line.includes(url)) {
      const nameMatch = line.match(/name:\s*'([^']+)'/);
      console.log(`Line ${i+1}: ${nameMatch ? nameMatch[1] : 'UNKNOWN'} => ${url.split('/').pop()}`);
    }
  });
});
