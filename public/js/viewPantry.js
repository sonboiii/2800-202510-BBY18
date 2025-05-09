let pantryData = [];
let dataTableInstance = null;

async function fetchPantryItems() {
  const res = await fetch(`/pantry/json`);
  pantryData = await res.json();
  renderPantryTable();
}

function renderPantryTable() {
  const table = $('#pantryTable');
  if ($.fn.DataTable.isDataTable(table)) {
    table.DataTable().destroy();
  }

  const tableBody = document.getElementById('pantryTableBody');
  tableBody.innerHTML = '';

  pantryData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.unit || ''}</td>
      <td>${item.category || ''}</td>
      <td>${item.expirationDate ? item.expirationDate.split('T')[0] : '—'}</td>
      <td>${item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '—'}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="openEditModal('${item._id}')">Edit</button>
        <form method="post" action="/pantry/delete/${item._id}" style="display:inline;" onsubmit="return confirm('Are you sure?');">
          <button type="submit" class="btn btn-sm btn-danger">Delete</button>
        </form>
      </td>
    `;
    tableBody.appendChild(row);
  });

  dataTableInstance = table.DataTable({
    order: [[0, 'asc']],
    pageLength: 10,
    columnDefs: [{ orderable: false, targets: [-1] }]
  });
}

function formatDateForInput(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function openEditModal(id) {
  const item = pantryData.find(i => i._id === id);
  if (!item) return;

  console.log('Editing item:', item);

  document.getElementById('editItemId').value = id;
  document.getElementById('editName').value = item.name;
  document.getElementById('editQuantity').value = item.quantity;
  document.getElementById('editUnit').value = item.unit;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editExpirationDate').value = item.expirationDate 
    ? item.expirationDate.split('T')[0] 
    : '';

  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();
}

document.addEventListener('DOMContentLoaded', fetchPantryItems);
// src: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects#Sending_form_data
document.getElementById('editForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const itemId = document.getElementById('editItemId').value;
  const formData = new URLSearchParams(new FormData(this));

  const res = await fetch(`/pantry/update/${itemId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });

  if (res.ok) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    modal.hide();
    fetchPantryItems(); 
  } else {
    alert('Failed to update item');
  }
});
