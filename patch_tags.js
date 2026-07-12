const fs = require('fs');
let dash = fs.readFileSync('views/pages/dashboard.ejs', 'utf8');

const oldTagPill = `<% task.tags.forEach(tag => { %>
                      <span class="badge bg-surface text-secondary border px-2 py-1" style="font-size: 0.65rem;"><%= tag %></span>
                    <% }) %>`;

const newTagPill = `<% task.tags.forEach(tag => { 
                      let isActive = false;
                      if (query.tag) {
                        let activeTags = Array.isArray(query.tag) ? query.tag : [query.tag];
                        isActive = activeTags.includes(tag);
                      }
                      const style = isActive ? 'background: var(--primary) !important; color: white !important; border-color: var(--primary) !important;' : 'background: var(--surface); color: var(--text-muted);';
                    %>
                      <span class="badge rounded-pill border px-2 py-1 fw-normal tag-pill-clickable" style="cursor: pointer; font-size: 0.65rem; <%= style %>" onclick="event.stopPropagation(); toggleTagFilter('<%= tag.replace(/'/g, "\\\\'") %>')">
                        <%= tag %>
                      </span>
                    <% }) %>`;

dash = dash.replace(oldTagPill, newTagPill);


const calRegex = /tagsHtml \+= `<span class="badge bg-surface text-secondary border px-2 py-1".*?<\/span>`;/g;
const oldCalStr = `tagsHtml += \`<span class="badge bg-surface text-secondary border px-2 py-1" style="font-size: 0.65rem;">\${tag}</span>\`;`;
const newCalStr = `
        const urlParams = new URLSearchParams(window.location.search);
        const queryTags = urlParams.getAll('tag');
        const isActive = queryTags.includes(tag);
        const style = isActive ? 'background: var(--primary) !important; color: white !important; border-color: var(--primary) !important;' : 'background: var(--surface); color: var(--text-muted);';
        tagsHtml += \`<span class="badge rounded-pill border px-2 py-1 fw-normal tag-pill-clickable" style="cursor:pointer; font-size: 0.65rem; \${style}" onclick="event.stopPropagation(); toggleTagFilter('\${tag.replace(/'/g, "\\\\'")}')">\${tag}</span>\`;`;

if (dash.includes(oldCalStr)) {
  dash = dash.replace(oldCalStr, newCalStr);
} else {
  // try regex if exact match fails
  dash = dash.replace(/tagsHtml \+= `<span class="badge[^>]+>\${tag}<\/span>`;/g, newCalStr);
}

fs.writeFileSync('views/pages/dashboard.ejs', dash);
console.log('Fixed tags in dashboard.ejs');
