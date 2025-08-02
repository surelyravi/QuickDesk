// tickets.js

const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get("id");
const token = sessionStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  // Redirect to login if not authenticated
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Button handlers
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.onclick = () => window.location.href = "dashboard.html";

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => {
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
  };

  if (!ticketId) {
    document.getElementById("ticketInfo").innerHTML = "<p>Ticket not found.</p>";
    return;
  }

  // Initial load
  loadTicketDetails();
  loadTicketComments();

  // Handle posting a new comment
  const commentForm = document.getElementById("commentForm");
  if (commentForm) {
    commentForm.addEventListener("submit", async e => {
      e.preventDefault();
      const commentInput = document.getElementById("commentInput");
      const errorEl = document.getElementById("commentError");
      const message = commentInput.value.trim();
      errorEl.textContent = "";

      if (!message) {
        errorEl.textContent = "Comment cannot be empty.";
        return;
      }

      try {
        const resp = await fetch(`http://localhost:3000/api/tickets/${ticketId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ message }),
        });
        const result = await resp.json();
        if (resp.ok) {
          commentInput.value = "";
          loadTicketComments();
        } else {
          errorEl.textContent = result.message || "Failed to add comment.";
        }
      } catch {
        errorEl.textContent = "Network error.";
      }
    });
  }
});

// ---- Functions ----

async function loadTicketDetails() {
  const infoDiv = document.getElementById("ticketInfo");
  infoDiv.innerHTML = "<p>Loading ticket...</p>";
  try {
    const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) {
      infoDiv.innerHTML = "<p>Ticket not found or permission denied.</p>";
      return;
    }
    const ticket = await res.json();

    // Render details
    infoDiv.innerHTML = `
      <h2 style="margin:0 0 12px 0;">${escapeHTML(ticket.subject)}</h2>
      <div>Status: <b>${escapeHTML(ticket.status)}</b></div>
      <div>Category: ${escapeHTML(ticket.category_name || '')}</div>
      <div>Created by: ${escapeHTML(ticket.created_by_name || '')}</div>
      <div>Assigned to: ${escapeHTML(ticket.assigned_to_name || '-')}</div>
      <div>Created: ${new Date(ticket.created_at).toLocaleString()}</div>
      <div>Last updated: ${new Date(ticket.updated_at).toLocaleString()}</div>
      ${
        ticket.attachment_path
        ? `<div>Attachment: <a href="http://localhost:3000${ticket.attachment_path}" target="_blank" rel="noopener">Download</a></div>`
        : ""
      }
      <div style="margin-top:10px;">Description:<br>${escapeHTML(ticket.description)}</div>
    `;
  } catch {
    infoDiv.innerHTML = "<p>Error loading ticket details.</p>";
  }
}

async function loadTicketComments() {
  const timelineDiv = document.getElementById("ticketTimeline");
  timelineDiv.innerHTML = "<p>Loading conversation...</p>";
  try {
    const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}/comments`, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) {
      timelineDiv.innerHTML = "<p>No conversation found.</p>";
      return;
    }
    const thread = await res.json();
    if (!Array.isArray(thread.comments) || thread.comments.length === 0) {
      timelineDiv.innerHTML = "<p>No replies yet. Be the first to comment!</p>";
      return;
    }
    timelineDiv.innerHTML = thread.comments.map(c => `
      <div class="comment-thread">
        <b>${escapeHTML(c.user_name)}</b> [${new Date(c.created_at).toLocaleString()}]
        <div>${escapeHTML(c.message)}</div>
      </div>
    `).join("");
  } catch {
    timelineDiv.innerHTML = "<p>Error loading conversation.</p>";
  }
}

// -- Simple HTML escape for XSS safety --
function escapeHTML(str) {
  return String(str || "")
    .replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    })[s]);
}
