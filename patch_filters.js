const fs = require('fs');

// Patch dashboardController.js
let ctrl = fs.readFileSync('controllers/dashboardController.js', 'utf8');

const oldFilter1 = `    if (req.query.task_type_id) {
      filteredTasks = filteredTasks.filter(t => t.task_type_id === req.query.task_type_id);
    }
    if (req.query.tag) {
      filteredTasks = filteredTasks.filter(t => t.tags && t.tags.includes(req.query.tag));
    }`;
const newFilter1 = `    if (req.query.task_type_id) {
      let types = Array.isArray(req.query.task_type_id) ? req.query.task_type_id : [req.query.task_type_id];
      filteredTasks = filteredTasks.filter(t => types.includes(t.task_type_id));
    }
    if (req.query.tag) {
      let tags = Array.isArray(req.query.tag) ? req.query.tag : [req.query.tag];
      filteredTasks = filteredTasks.filter(t => t.tags && tags.some(tag => t.tags.includes(tag)));
    }`;
ctrl = ctrl.replace(oldFilter1, newFilter1);

const oldFilter2 = `    if (req.query.task_type_id) {
      chartTaskTypes = taskTypes.filter(t => t.id === req.query.task_type_id);
    }`;
const newFilter2 = `    if (req.query.task_type_id) {
      let types = Array.isArray(req.query.task_type_id) ? req.query.task_type_id : [req.query.task_type_id];
      chartTaskTypes = taskTypes.filter(t => types.includes(t.id));
    }`;
ctrl = ctrl.replace(oldFilter2, newFilter2);

fs.writeFileSync('controllers/dashboardController.js', ctrl);
console.log('Fixed dashboardController.js');

// Patch dashboard.ejs
let dash = fs.readFileSync('views/pages/dashboard.ejs', 'utf8');

// Convert Task Types select to checkboxes
const oldTaskSelect = `<div class="mb-4">
            <label class="form-label fw-bold  small">Task Types</label>
            <select name="task_type_id" class="form-select form-select-sm">
              <option value="">All Tasks</option>
              <% taskTypes.forEach(type => { %>
                <option value="<%= type.id %>" <%= query.task_type_id == type.id ? 'selected' : '' %>><%= type.name %></option>
              <% }) %>
            </select>
          </div>`;
          
const newTaskSelect = `<div class="mb-4">
            <label class="form-label fw-bold small">Task Types</label>
            <div class="filter-checkbox-list" style="max-height: 200px; overflow-y: auto;">
              <% 
                let selectedTypes = [];
                if (query.task_type_id) {
                  selectedTypes = Array.isArray(query.task_type_id) ? query.task_type_id : [query.task_type_id];
                }
              %>
              <% taskTypes.forEach(type => { %>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="task_type_id" value="<%= type.id %>" id="filter_type_<%= type.id %>" <%= selectedTypes.includes(type.id) ? 'checked' : '' %>>
                  <label class="form-check-label text-muted small" for="filter_type_<%= type.id %>"><%= type.name %></label>
                </div>
              <% }) %>
            </div>
          </div>`;
dash = dash.replace(oldTaskSelect, newTaskSelect);

// Convert Tags select to checkboxes
const oldTagSelect = `<div class="mb-2">
            <label class="form-label fw-bold  small">Tags</label>
            <select name="tag" class="form-select form-select-sm">
              <option value="">All Tags</option>
              <% availableTags.forEach(tag => { %>
                <option value="<%= tag %>" <%= query.tag === tag ? 'selected' : '' %>><%= tag %></option>
              <% }) %>
            </select>
          </div>`;

const newTagSelect = `<div class="mb-2">
            <label class="form-label fw-bold small">Tags</label>
            <div class="filter-checkbox-list" style="max-height: 200px; overflow-y: auto;">
              <% 
                let selectedTags = [];
                if (query.tag) {
                  selectedTags = Array.isArray(query.tag) ? query.tag : [query.tag];
                }
              %>
              <% availableTags.forEach(tag => { %>
                <div class="form-check">
                  <input class="form-check-input sidebar-tag-checkbox" type="checkbox" name="tag" value="<%= tag %>" id="filter_tag_<%= Buffer.from(tag).toString('hex') %>" <%= selectedTags.includes(tag) ? 'checked' : '' %>>
                  <label class="form-check-label text-muted small" for="filter_tag_<%= Buffer.from(tag).toString('hex') %>"><%= tag %></label>
                </div>
              <% }) %>
            </div>
          </div>`;
dash = dash.replace(oldTagSelect, newTagSelect);

// Tag pill highlight logic inside EJS mapping
const oldTagPill = `<% t.tags.forEach(tag => { %>
                                  <span class="badge rounded-pill border fw-normal" style="color: var(--text-muted); background: var(--surface);">
                                    <%= tag %>
                                  </span>
                                <% }) %>`;
const newTagPill = `<% t.tags.forEach(tag => { 
                                  let isActive = false;
                                  if (query.tag) {
                                    let activeTags = Array.isArray(query.tag) ? query.tag : [query.tag];
                                    isActive = activeTags.includes(tag);
                                  }
                                %>
                                  <span class="badge rounded-pill border fw-normal tag-pill-clickable" style="cursor: pointer; <%= isActive ? 'background: var(--primary); color: white; border-color: var(--primary) !important;' : 'color: var(--text-muted); background: var(--surface);' %>" onclick="toggleTagFilter('<%= tag %>')">
                                    <%= tag %>
                                  </span>
                                <% }) %>`;
// We might need a global replace if there are multiple places rendering tag pills (List view vs Calendar view vs Grid view)
dash = dash.replace(new RegExp(oldTagPill.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), newTagPill);

// Wait, the regex might fail. Let's do a more robust replace for the tags inside the dashboard list view and calendar view
// Calendar view uses same tag pill logic? Let's check. 
// Instead of regex, I will do split/join.
dash = dash.split(oldTagPill).join(newTagPill);


// Add toggleTagFilter JS function
const extraJS = `
  function toggleTagFilter(tagVal) {
    // Find the corresponding checkbox in the sidebar
    const checkboxes = document.querySelectorAll('.sidebar-tag-checkbox');
    for (let cb of checkboxes) {
      if (cb.value === tagVal) {
        cb.checked = !cb.checked;
        break;
      }
    }
    submitDashboardFilters();
  }

  async function handleInlineCreateCustom(type, event) {`;
dash = dash.replace(`  async function handleInlineCreateCustom(type, event) {`, extraJS);

// What if list/calendar uses different tag rendering logic? Let's inspect dashboard.ejs to see where it renders tags.
// Calendar view render tags inside renderCalendar() using JS string building!
const oldCalTag = `tagsHtml += \`<span class="badge bg-light text-dark border me-1 mb-1">\${tag}</span>\`;`;
const newCalTag = `
        const urlParams = new URLSearchParams(window.location.search);
        const queryTags = urlParams.getAll('tag');
        const isActive = queryTags.includes(tag);
        const style = isActive ? 'background: var(--primary); color: white; border-color: var(--primary) !important;' : 'background: var(--surface); color: var(--text-muted);';
        tagsHtml += \`<span class="badge rounded-pill border me-1 mb-1 fw-normal" style="cursor:pointer; \${style}" onclick="event.stopPropagation(); toggleTagFilter('\${tag.replace(/'/g, "\\\\'")}')">\${tag}</span>\`;`;
dash = dash.replace(oldCalTag, newCalTag);

// Also we should check if dashboard has another oldTagPill style.
fs.writeFileSync('views/pages/dashboard.ejs', dash);
console.log('Fixed dashboard.ejs');
