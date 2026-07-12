const fs = require('fs');

const file = 'views/pages/dashboard.ejs';
let content = fs.readFileSync(file, 'utf8');

const newParseNLP = `    window.parseNLPRepeat = function(text) {
      text = text.toLowerCase().trim().replace(/\\s+/g, ' ');
      const feedback = document.getElementById('nlpFeedback');
      const freqSelect = document.getElementById('repeat_frequency');
      const intervalInput = document.getElementById('repeat_interval');
      
      if (!text) {
        feedback.style.display = 'none';
        return;
      }
      
      let detected = null;
      
      const dayOfMonthRegexes = [
        /(?:on\\s+)?(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:every|each|the)\\s+month/,
        /monthly[\\s,]*(?:on\\s+)?(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?/,
        /every\\s+month[\\s,]*(?:on\\s+)?(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?/,
        /every\\s+(\\d+)(?:st|nd|rd|th)\\s+(?:of\\s+)?(?:the\\s+)?month/,
        /every\\s+(\\d+)(?:st|nd|rd|th)$/,
        /^(\\d+)(?:st|nd|rd|th)$/
      ];
      
      let monthlyDay = null;
      for (const r of dayOfMonthRegexes) {
        const m = text.match(r);
        if (m) { monthlyDay = parseInt(m[1], 10); break; }
      }

      const daysOfWeek = [
        {name: 'monday', code: 'MO'},
        {name: 'tuesday', code: 'TU'},
        {name: 'wednesday', code: 'WE'},
        {name: 'thursday', code: 'TH'},
        {name: 'friday', code: 'FR'},
        {name: 'saturday', code: 'SA'},
        {name: 'sunday', code: 'SU'}
      ];

      if (monthlyDay && monthlyDay >= 1 && monthlyDay <= 31) {
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfMonth', monthlyDay: monthlyDay, desc: \`Monthly on day \${monthlyDay}\` };
      } else if (text.includes('every day') || text === 'daily') {
        detected = { frequency: 'daily', interval: 1, desc: 'Every day' };
      } else if (text.match(/every (\\d+) days/)) {
        const days = parseInt(text.match(/every (\\d+) days/)[1], 10);
        detected = { frequency: 'daily', interval: days, desc: \`Every \${days} days\` };
      } else if (text.includes('every week') || text === 'weekly') {
        detected = { frequency: 'weekly', interval: 1, desc: 'Every week' };
      } else if (text.match(/every (\\d+) weeks/)) {
        const weeks = parseInt(text.match(/every (\\d+) weeks/)[1], 10);
        detected = { frequency: 'weekly', interval: weeks, desc: \`Every \${weeks} weeks\` };
      } else if (text.includes('every month') || text === 'monthly') {
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfMonth', desc: 'Every month' };
      } else if (text.match(/every (\\d+) months/)) {
        const months = parseInt(text.match(/every (\\d+) months/)[1], 10);
        detected = { frequency: 'monthly', interval: months, monthlyType: 'dayOfMonth', desc: \`Every \${months} months\` };
      } else if (text.includes('last friday')) {
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfWeek', monthlyWeek: 'last', monthlyDayOfWeek: 'FR', desc: 'Monthly on last Friday' };
      } else if (text.includes('first monday')) {
        detected = { frequency: 'monthly', interval: 1, monthlyType: 'dayOfWeek', monthlyWeek: 'first', monthlyDayOfWeek: 'MO', desc: 'Monthly on first Monday' };
      } else {
        for (const d of daysOfWeek) {
          if (text.includes(\`every \${d.name}\`) || text === d.name || text.includes(\`weekly on \${d.name}\`)) {
            detected = { frequency: 'weekly', interval: 1, weeklyDays: [d.code], desc: \`Weekly on \${d.name.charAt(0).toUpperCase() + d.name.slice(1)}\` };
            break;
          }
        }
      }
      
      if (detected) {
        freqSelect.value = detected.frequency;
        intervalInput.value = detected.interval;
        adjustRepeatDetailFields();
        
        if (detected.weeklyDays) {
          document.querySelectorAll('.weekly-day-btn').forEach(btn => {
            btn.checked = detected.weeklyDays.includes(btn.value);
          });
        }
        
        if (detected.monthlyType) {
          document.getElementById('repeat_monthly_type').value = detected.monthlyType;
          adjustMonthlyFields();
          if (detected.monthlyDay) {
            document.getElementById('repeat_monthly_day').value = detected.monthlyDay;
          }
          if (detected.monthlyWeek) {
            document.getElementById('repeat_monthly_week').value = detected.monthlyWeek;
          }
          if (detected.monthlyDayOfWeek) {
            document.getElementById('repeat_monthly_dayofweek').value = detected.monthlyDayOfWeek;
          }
        }
        
        feedback.innerText = \`Matched: "\${detected.desc}"\`;
        feedback.style.display = 'block';
      } else {
        feedback.style.display = 'none';
      }
    };`;

const oldParseNLPStart = `    window.parseNLPRepeat = function(text) {`;
const oldParseNLPEnd = `        feedback.style.display = 'none';\n      }\n    };`;

const startIndex = content.indexOf(oldParseNLPStart);
const endIndex = content.indexOf(oldParseNLPEnd, startIndex) + oldParseNLPEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  const finalContent = content.substring(0, startIndex) + newParseNLP + content.substring(endIndex);
  fs.writeFileSync(file, finalContent, 'utf8');
  console.log('NLP logic patched successfully.');
} else {
  console.log('Failed to find NLP logic block.');
}
