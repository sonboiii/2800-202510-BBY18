document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new URLSearchParams(new FormData(form));

    let res = await fetch('/pantry/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    // 409 error to handle conflicts w/ existing items
    if (res.status === 409) {
      const data = await res.json();
      const proceed = confirm(`${data.message}\nDo you want to add this item anyway?`);

      if (proceed) {
        formData.append('forceInsert', 'true'); // allow user to add duplicate (after prompting)

        res = await fetch('/pantry/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        if (res.redirected) {
          window.location.href = res.url;
        } else {
          alert('Something went wrong while adding the item.');
        }
      }

      return;
    }

    if (res.redirected) {
      window.location.href = res.url;
    } else {
      alert('Something went wrong while adding the item.');
    }
  });
});
