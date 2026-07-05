const fs = require('fs');

let ejs = fs.readFileSync('views/pages/dashboard.ejs', 'utf-8');

const editModalHTML = `
<!-- Edit Task Modal -->
<div class="modal fade" id="editTaskModal" tabindex="-1">
  <div class="modal-dialog">
    <form class="modal-content" id="editTaskForm" onsubmit="submitEditTask(event)">
      <div class="modal-header border-bottom-0">
        <h5 class="modal-title fw-bold">Edit Task</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body pt-0">
        <div id="editTaskError" class="alert alert-danger small py-2" style="display: none;"></div>
        <input type="hidden" id="edit_task_id">

        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">STATUS</label>
          <select id="edit_status_input" class="form-select">
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">CLIENT</label>
          <select id="edit_client_id_input" class="form-select">
            <option value="">No Client (Internal)</option>
            <% clients.forEach(client => { %>
              <option value="<%= client.id %>"><%= client.name %></option>
            <% }) %>
          </select>
        </div>
        
        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">TASK TYPE <span class="text-danger">*</span></label>
          <select id="edit_task_type_id_input" class="form-select" required>
            <% taskTypes.forEach(type => { %>
              <option value="<%= type.id %>"><%= type.name %></option>
            <% }) %>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">ASSIGN TO</label>
          <select id="edit_assigned_user_id_input" class="form-select">
            <option value="">Unassigned</option>
            <% users.forEach(user => { %>
              <option value="<%= user.id %>"><%= user.name %></option>
            <% }) %>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">DUE DATE <span class="text-danger">*</span></label>
          <input type="date" id="edit_due_date_input" class="form-control" required>
        </div>

        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">TAGS (Comma separated)</label>
          <input type="text" id="edit_tags_input" class="form-control" placeholder="e.g. podcast, urgent">
        </div>
      </div>
      <div class="modal-footer border-top-0">
        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-dark" id="updateTaskBtn">Save Changes</button>
      </div>
    </form>
  </div>
</div>
`;

// Insert the modal before newTaskModal
if (!ejs.includes('id="editTaskModal"')) {
  ejs = ejs.replace('<!-- New Task Modal -->', editModalHTML + '\n<!-- New Task Modal -->');
}

const newOpenTaskModal = `
  let editTaskModalObj = null;

  function openTaskModal(taskId) {
    if (!editTaskModalObj) {
      editTaskModalObj = new bootstrap.Modal(document.getElementById('editTaskModal'));
    }
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('edit_task_id').value = task.id;
    document.getElementById('edit_status_input').value = task.status;
    document.getElementById('edit_client_id_input').value = task.client_id || '';
    document.getElementById('edit_task_type_id_input').value = task.task_type_id || '';
    document.getElementById('edit_assigned_user_id_input').value = task.assigned_user_id || '';
    document.getElementById('edit_due_date_input').value = task.due_date || '';
    document.getElementById('edit_tags_input').value = (task.tags || []).join(', ');

    editTaskModalObj.show();
  }

  async function submitEditTask(e) {
    e.preventDefault();
    const taskId = document.getElementById('edit_task_id').value;
    const errorDiv = document.getElementById('editTaskError');
    errorDiv.style.display = 'none';

    const payload = {
      status: document.getElementById('edit_status_input').value,
      client_id: document.getElementById('edit_client_id_input').value,
      task_type_id: document.getElementById('edit_task_type_id_input').value,
      assigned_user_id: document.getElementById('edit_assigned_user_id_input').value,
      due_date: document.getElementById('edit_due_date_input').value,
      tags: document.getElementById('edit_tags_input').value
    };

    try {
      const response = await fetch('/tasks/' + taskId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        window.location.reload();
      } else {
        errorDiv.innerText = data.error || 'Failed to update task.';
        errorDiv.style.display = 'block';
      }
    } catch(err) {
      console.error(err);
      errorDiv.innerText = 'Server error. Please try again.';
      errorDiv.style.display = 'block';
    }
  }
`;

// Replace the old openTaskModal
ejs = ejs.replace(/function openTaskModal\(taskId\) \{[\s\S]*?\}/, newOpenTaskModal.trim());

fs.writeFileSync('views/pages/dashboard.ejs', ejs);
console.log('Successfully injected Edit Task modal into dashboard.ejs');
