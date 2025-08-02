document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // DOM elements
  const ticketsList = document.getElementById("ticketsList");
  const logoutBtn = document.getElementById("logoutBtn");
  const statusFilter = document.getElementById("statusFilter");
  const searchBox = document.getElementById("searchBox");
  const newTicketBtn = document.getElementById("newTicketBtn");
  const ticketModal = document.getElementById("ticketModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const createTicketForm = document.getElementById("createTicketForm");

  // --- LOGOUT BUTTON ---
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("token");
      window.location.href = "login.html";
    };
  }

  // --- TICKET FILTER & SEARCH ---
  if (statusFilter) {
    statusFilter.onchange = () => loadTickets();
  }
  if (searchBox) {
    searchBox.oninput = () => loadTickets();
  }

  // --- MODAL OPEN/CLOSE ---
  if (newTicketBtn && ticketModal && closeModalBtn) {
    newTicketBtn.onclick = () => {
      ticketModal.style.display = "flex";
      loadCategories();
    };
    closeModalBtn.onclick = () => {
      ticketModal.style.display = "none";
      createTicketForm?.reset();
      const m = document.getElementById("ticketFormMsg");
      if (m) m.textContent = "";
    };
    window.onclick = event => {
      if (event.target === ticketModal) {
        ticketModal.style.display = "none";
        createTicketForm?.reset();
        const m = document.getElementById("ticketFormMsg");
        if (m) m.textContent = "";
      }
    };
  }

  // --- FETCH CATEGORIES INTO DROPDOWN FOR TICKET CREATION ---
  async function loadCategories() {
    const categorySelect = document.getElementById("ticketCategory");
    if (!categorySelect) return;
    try {
      const response = await fetch("http://localhost:3000/api/categories", {
        headers: { Authorization: "Bearer " + token }
      });
      const result = await response.json();
      categorySelect.innerHTML = '<option value="">Select Category</option>';
      if (response.ok && Array.isArray(result.categories)) {
        result.categories.forEach(cat => {
          const opt = document.createElement("option");
          opt.value = cat.id;
          opt.textContent = cat.name;
          categorySelect.appendChild(opt);
        });
      }
    } catch {
      categorySelect.innerHTML = '<option value="">(Failed to load)</option>';
    }
  }

  // --- CREATE TICKET FORM SUBMIT ---
  if (createTicketForm) {
    createTicketForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const subject = document.getElementById("ticketSubject").value.trim();
      const description = document.getElementById("ticketDescription").value.trim();
      const categoryId = document.getElementById("ticketCategory").value;
      const attachment = document.getElementById("ticketAttachment").files[0];
      const msgEl = document.getElementById("ticketFormMsg");
      msgEl.textContent = "";

      if (!subject || !description || !categoryId) {
        msgEl.textContent = "All fields except attachment are required.";
        return;
      }

      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("category_id", categoryId);
      if (attachment) formData.append("attachment", attachment);

      try {
        const response = await fetch("http://localhost:3000/api/tickets", {
          method: "POST",
          headers: { Authorization: 'Bearer ' + token },
          body: formData,
        });
        const result = await response.json();
        if (response.ok) {
          ticketModal.style.display = "none";
          createTicketForm.reset();
          msgEl.textContent = "";
          loadTickets();
        } else {
          msgEl.textContent = result.message || "Failed to create ticket.";
        }
      } catch {
        msgEl.textContent = "Network error.";
      }
    });
  }

  // --- FETCH AND DISPLAY TICKETS (WITH VOTE CONTROLS) ---
  async function loadTickets() {
    let url = "http://localhost:3000/api/tickets?";
    const status = statusFilter ? statusFilter.value : "";
    const search = searchBox ? searchBox.value.trim() : "";
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: "Bearer " + token }
      });
      const result = await response.json();

      ticketsList.innerHTML = "";
      if (response.ok && Array.isArray(result.tickets) && result.tickets.length > 0) {
        result.tickets.forEach(ticket => {
          const div = document.createElement("div");
          div.className = "ticket-card";
          div.innerHTML = `
            <b>${escapeHTML(ticket.subject)}</b>
            <div>Status: ${escapeHTML(ticket.status)}</div>
            <div>Category: ${escapeHTML(ticket.category_name || '')}</div>
            <div>Last updated: ${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : ''}</div>
            <div class="vote-controls" style="margin:8px 0;">
              <button class="vote-btn" data-id="${ticket.id}" data-value="1">&#x25B2;</button>
              <span id="vote-count-${ticket.id}">${ticket.vote_count || 0}</span>
              <button class="vote-btn" data-id="${ticket.id}" data-value="-1">&#x25BC;</button>
            </div>
            <a href="ticket_detail.html?id=${ticket.id}">View Details</a>
          `;
          ticketsList.appendChild(div);
        });

        // --- Add voting handlers for all vote buttons ---
        const voteButtons = ticketsList.querySelectorAll(".vote-btn");
        voteButtons.forEach(btn => {
          btn.onclick = async function(e) {
            e.preventDefault();
            const ticketId = btn.dataset.id;
            const value = parseInt(btn.dataset.value, 10); // 1 or -1
            try {
              await fetch(`http://localhost:3000/api/tickets/${ticketId}/vote`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + token,
                },
                body: JSON.stringify({ value }),
              });
              loadTickets(); // Refresh ticket list for updated vote count
            } catch {
              // Optionally show error message/toast
            }
          };
        });

      } else {
        ticketsList.innerHTML = "<p>No tickets found.</p>";
      }
    } catch (err) {
      ticketsList.innerHTML = "<p>Error loading tickets.</p>";
    }
  }

  // --- HTML ESCAPE (for ticket subject etc.) ---
  function escapeHTML(str) {
    return String(str || "").replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[s]);
  }

  // --- INITIAL LOAD ---
  loadTickets();
});
