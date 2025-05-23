let pantryData = [];
let dataTableInstance = null;

// Fetch pantry items from the server and render the table
async function fetchPantryItems() {
  const res = await fetch(`/pantry/json`);
  pantryData = await res.json();
  renderPantryTable();
}

// Render the pantry table using pantryData and initialize DataTables
function renderPantryTable() {
  const table = $('#pantryTable');

  // If DataTable is already initialized, destroy it before re-rendering
  if ($.fn.DataTable.isDataTable(table)) {
    table.DataTable().destroy();
  }

  const tableBody = document.getElementById('pantryTableBody');
  tableBody.innerHTML = '';

  // Create a row for each pantry item
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

  // Initialize DataTables with sorting and pagination
  dataTableInstance = table.DataTable({
    order: [[0, 'asc']],
    pageLength: 10,
    columnDefs: [{ orderable: false, targets: [-1] }]
  });
}

// Format a date string into YYYY-MM-DD format for input fields
function formatDateForInput(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


// Open edit modal and prefill form with item data
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

// Fetch pantry data once the DOM is fully loaded
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

let lastClearedItems = []; // store current pantry in local mem

// Confirm before clearing all pantry items and offer undo option
async function confirmClearPantry() {
  const confirmed = confirm("Are you sure you want to clear your entire pantry?");
  if (!confirmed) return;

  try {
    lastClearedItems = [...pantryData];
    const res = await fetch('/pantry/clear', { method: 'POST' });

    if (res.ok) {
      showUndoClearToast();
      fetchPantryItems();
    } else {
      alert('Something went wrong while clearing your pantry.');
    }
  } catch (err) {
    console.error("Error clearing pantry:", err);
    alert("Something went wrong while clearing your pantry.");
  }
}

// Display a toast notification with the option to undo pantry clear
function showUndoClearToast() {
  const toastEl = document.getElementById('undo-clear-toast');
  const toast = new bootstrap.Toast(toastEl, { delay: 10000 });
  toast.show();
}

// Restore pantry items from the last cleared list
async function undoClearPantry() {
  if (!lastClearedItems.length) return;

  const res = await fetch('/pantry/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: lastClearedItems })
  });

  if (res.ok) {
    lastClearedItems = [];
    fetchPantryItems();
  } else {
    alert("Failed to restore pantry items");
  }
}
