const fs = require('fs');

let ejs = fs.readFileSync('views/pages/dashboard.ejs', 'utf-8');

// Replace Clients radio list with select
const clientsRegex = /<div class="mb-4">\s*<label class="form-label fw-bold text-dark small d-flex justify-content-between">\s*Clients[\s\S]*?<\/label>\s*<div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">[\s\S]*?<\/div>\s*<\/div>/;

const clientsSelect = `
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small">Clients</label>
            <select name="client_id" class="form-select form-select-sm">
              <option value="">All Clients</option>
              <% clients.forEach(client => { %>
                <option value="<%= client.id %>" <%= query.client_id == client.id ? 'selected' : '' %>><%= client.name %></option>
              <% }) %>
            </select>
          </div>`;
ejs = ejs.replace(clientsRegex, clientsSelect.trim());

// Replace Team Members radio list with select
const teamRegex = /<div class="mb-4">\s*<label class="form-label fw-bold text-dark small d-flex justify-content-between">\s*Team Members\s*<\/label>\s*<div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">[\s\S]*?<\/div>\s*<\/div>/;

const teamSelect = `
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small">Team Members</label>
            <select name="user_id" class="form-select form-select-sm">
              <option value="">All Members</option>
              <% users.forEach(u => { %>
                <option value="<%= u.id %>" <%= query.user_id == u.id ? 'selected' : '' %>><%= u.name %></option>
              <% }) %>
            </select>
          </div>`;
ejs = ejs.replace(teamRegex, teamSelect.trim());

// Replace Task Types radio list with select
const taskTypesRegex = /<div class="mb-4">\s*<label class="form-label fw-bold text-dark small d-flex justify-content-between">\s*Task Types\s*<\/label>\s*<div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">[\s\S]*?<\/div>\s*<\/div>/;

const taskTypesSelect = `
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small">Task Types</label>
            <select name="task_type_id" class="form-select form-select-sm">
              <option value="">All Tasks</option>
              <% taskTypes.forEach(type => { %>
                <option value="<%= type.id %>" <%= query.task_type_id == type.id ? 'selected' : '' %>><%= type.name %></option>
              <% }) %>
            </select>
          </div>`;
ejs = ejs.replace(taskTypesRegex, taskTypesSelect.trim());

// Replace Tags radio list with select
const tagsRegex = /<div class="mb-2">\s*<label class="form-label fw-bold text-dark small d-flex justify-content-between">\s*Tags\s*<\/label>\s*<div class="filter-checkbox-list" style="max-height: 150px; overflow-y: auto;">[\s\S]*?<\/div>\s*<\/div>/;

const tagsSelect = `
          <div class="mb-2">
            <label class="form-label fw-bold text-dark small">Tags</label>
            <select name="tag" class="form-select form-select-sm">
              <option value="">All Tags</option>
              <% availableTags.forEach(tag => { %>
                <option value="<%= tag %>" <%= query.tag === tag ? 'selected' : '' %>><%= tag %></option>
              <% }) %>
            </select>
          </div>`;
ejs = ejs.replace(tagsRegex, tagsSelect.trim());

fs.writeFileSync('views/pages/dashboard.ejs', ejs);
console.log('Replaced lists with dropdowns successfully!');
