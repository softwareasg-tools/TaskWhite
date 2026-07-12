const fs = require('fs');

const file = 'views/pages/dashboard.ejs';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      } else if (text.includes('every day') || text === 'daily') {`;
const newStr = `      } else if (text.includes('every year') || text === 'yearly' || text === 'annually') {
        detected = { frequency: 'yearly', interval: 1, desc: 'Every year' };
      } else if (text.match(/every (\\d+) years/)) {
        const years = parseInt(text.match(/every (\\d+) years/)[1], 10);
        detected = { frequency: 'yearly', interval: years, desc: \`Every \${years} years\` };
      } else if (text.includes('every day') || text === 'daily' || text === 'everyday') {`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Yearly NLP logic added successfully.');
} else {
  console.log('Failed to find target string.');
}
