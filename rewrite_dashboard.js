const fs = require('fs');

let ejs = fs.readFileSync('views/pages/dashboard.ejs', 'utf-8');

// 1. Remove the Filters button from the top header
ejs = ejs.replace(
  /<button class="btn btn-outline-secondary shadow-sm mb-1 position-relative" type="button" data-bs-toggle="offcanvas" data-bs-target="#filterOffcanvas">[\s\S]*?<\/button>/,
  ''
);

// 2. Remove the Offcanvas completely (from <!-- Filter Offcanvas --> up to its closing </div>)
const offcanvasStart = ejs.indexOf('<!-- Filter Offcanvas -->');
const offcanvasEndStr = '<!-- KPIs -->';
const offcanvasEnd = ejs.indexOf(offcanvasEndStr);
if (offcanvasStart !== -1 && offcanvasEnd !== -1) {
  ejs = ejs.slice(0, offcanvasStart) + ejs.slice(offcanvasEnd);
}

// 3. Wrap everything from <!-- KPIs --> down to the end of <!-- Calendar View --> inside the right column.
const kpiIndex = ejs.indexOf('<!-- KPIs -->');
const afterHeader = ejs.slice(0, kpiIndex);
let restOfPage = ejs.slice(kpiIndex);

const endOfCalendarView = restOfPage.indexOf('<!-- New Task Modal -->');
const contentToWrap = restOfPage.slice(0, endOfCalendarView);
const restOfFile = restOfPage.slice(endOfCalendarView);

const sidebarHTML = `
<!-- Main Layout Row -->
<div class="row">
  <!-- Sidebar Filters -->
  <div class="col-lg-3 col-xl-2 mb-4 d-none d-lg-block">
    <div class="card border-0 shadow-sm sticky-top" style="top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; background-color: var(--card-bg);">
      <div class="card-header bg-transparent border-bottom fw-bold text-uppercase py-3" style="letter-spacing: 0.5px; font-size: 0.85rem;">
        <i class="bi bi-funnel-fill text-primary me-2"></i> Filters
        <% if (activeFilterCount > 0) { %>
          <span class="badge bg-primary ms-1"><%= activeFilterCount %></span>
          <a href="/dashboard<%= query.view ? '?view=' + query.view : '' %>" class="float-end text-decoration-none small text-muted text-capitalize" style="font-size: 0.75rem;">Reset</a>
        <% } %>
      </div>
      <div class="card-body p-3" id="sidebarFiltersContainer">
        <form id="filterForm" method="GET" action="/dashboard" onchange="submitDashboardFilters()">
          <% if (query.view) { %>
            <input type="hidden" name="view" value="<%= query.view %>">
          <% } %>
          
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small">Time Period</label>
            <select name="time" id="timeFilterSelect" class="form-select form-select-sm" onchange="toggleCustomDateFields()">
              <option value="">All Time</option>
              <option value="today" <%= query.time === 'today' ? 'selected' : '' %>>Today</option>
              <option value="7days" <%= query.time === '7days' ? 'selected' : '' %>>Next 7 Days</option>
              <option value="15days" <%= query.time === '15days' ? 'selected' : '' %>>Next 15 Days</option>
              <option value="30days" <%= query.time === '30days' ? 'selected' : '' %>>Next 30 Days</option>
              <option value="60days" <%= query.time === '60days' ? 'selected' : '' %>>Next 60 Days</option>
              <option value="90days" <%= query.time === '90days' ? 'selected' : '' %>>Next 90 Days</option>
              <option value="custom" <%= query.time === 'custom' ? 'selected' : '' %>>Custom Date</option>
            </select>
            
            <div id="customDateFields" class="mt-2 p-2 bg-light rounded" style="display: <%= query.time === 'custom' ? 'block' : 'none' %>;">
              <div class="mb-2">
                <label class="text-muted" style="font-size:0.7rem;">START DATE</label>
                <input type="date" name="start_date" class="form-control form-control-sm" value="<%= query.start_date || '' %>">
              </div>
              <div>
                <label class="text-muted" style="font-size:0.7rem;">END DATE</label>
                <input type="date" name="end_date" class="form-control form-control-sm" value="<%= query.end_date || '' %>">
              </div>
            </div>
          </div>
          
          <hr class="text-muted opacity-25">
          
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small d-flex justify-content-between">
              Clients 
              <span class="badge bg-light text-secondary border rounded-pill"><%= clients.length %></span>
            </label>
            <div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">
              <div class="form-check mb-1">
                <input class="form-check-input shadow-sm" type="radio" name="client_id" id="client_none" value="" <%= !query.client_id ? 'checked' : '' %>>
                <label class="form-check-label small text-muted" for="client_none" style="cursor: pointer;">All Clients</label>
              </div>
              <% clients.forEach(client => { %>
                <div class="form-check mb-1">
                  <input class="form-check-input shadow-sm" type="radio" name="client_id" id="client_<%= client.id %>" value="<%= client.id %>" <%= query.client_id == client.id ? 'checked' : '' %>>
                  <label class="form-check-label small" for="client_<%= client.id %>" style="cursor: pointer;"><%= client.name %></label>
                </div>
              <% }) %>
            </div>
          </div>
          
          <hr class="text-muted opacity-25">
          
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small d-flex justify-content-between">
              Team Members
            </label>
            <div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">
              <div class="form-check mb-1">
                <input class="form-check-input shadow-sm" type="radio" name="user_id" id="user_none" value="" <%= !query.user_id ? 'checked' : '' %>>
                <label class="form-check-label small text-muted" for="user_none" style="cursor: pointer;">All Members</label>
              </div>
              <% users.forEach(u => { %>
                <div class="form-check mb-1">
                  <input class="form-check-input shadow-sm" type="radio" name="user_id" id="user_<%= u.id %>" value="<%= u.id %>" <%= query.user_id == u.id ? 'checked' : '' %>>
                  <label class="form-check-label small" for="user_<%= u.id %>" style="cursor: pointer;"><%= u.name %></label>
                </div>
              <% }) %>
            </div>
          </div>
          
          <hr class="text-muted opacity-25">
          
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small d-flex justify-content-between">
              Task Types
            </label>
            <div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">
              <div class="form-check mb-1">
                <input class="form-check-input shadow-sm" type="radio" name="task_type_id" id="taskType_none" value="" <%= !query.task_type_id ? 'checked' : '' %>>
                <label class="form-check-label small text-muted" for="taskType_none" style="cursor: pointer;">All Tasks</label>
              </div>
              <% taskTypes.forEach(type => { %>
                <div class="form-check mb-1">
                  <input class="form-check-input shadow-sm" type="radio" name="task_type_id" id="taskType_<%= type.id %>" value="<%= type.id %>" <%= query.task_type_id == type.id ? 'checked' : '' %>>
                  <label class="form-check-label small" for="taskType_<%= type.id %>" style="cursor: pointer;"><%= type.name %></label>
                </div>
              <% }) %>
            </div>
          </div>

          <hr class="text-muted opacity-25">
          
          <div class="mb-2">
            <label class="form-label fw-bold text-dark small d-flex justify-content-between">
              Tags
            </label>
            <div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">
               <div class="form-check mb-1">
                  <input class="form-check-input shadow-sm" type="radio" name="tag" id="tag_none" value="" <%= !query.tag ? 'checked' : '' %>>
                  <label class="form-check-label small text-muted" for="tag_none" style="cursor: pointer;">All Tags</label>
                </div>
              <% availableTags.forEach(tag => { %>
                <div class="form-check mb-1">
                  <input class="form-check-input shadow-sm" type="radio" name="tag" id="tag_<%= tag %>" value="<%= tag %>" <%= query.tag === tag ? 'checked' : '' %>>
                  <label class="form-check-label small" for="tag_<%= tag %>" style="cursor: pointer;"><%= tag %></label>
                </div>
              <% }) %>
            </div>
          </div>

          <!-- Hidden Submit Button (triggered via JS) -->
          <button type="submit" class="d-none">Apply</button>
        </form>
      </div>
    </div>
  </div>
  
  <!-- Main Content Area -->
  <div class="col-lg-9 col-xl-10" id="mainDashboardContent">
`;

// Add the closing divs for row and col-lg-9
const newRestOfPage = sidebarHTML + contentToWrap + '\n  </div>\n</div>\n' + restOfFile;

ejs = afterHeader + newRestOfPage;

const ajaxScript = `
  function submitDashboardFilters() {
    const form = document.getElementById('filterForm');
    const timeSelect = document.getElementById('timeFilterSelect').value;
    if (timeSelect === 'custom') {
      const start = form.querySelector('[name="start_date"]').value;
      const end = form.querySelector('[name="end_date"]').value;
      if (!start || !end) return; // wait until they pick both dates
    }
    form.submit();
  }
</script>
`;

ejs = ejs.replace('</script>', ajaxScript);

fs.writeFileSync('views/pages/dashboard.ejs', ejs);
console.log('Done!');
