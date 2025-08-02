document.addEventListener("DOMContentLoaded", () => {
  // --- LOGIN HANDLER ---
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const errorEl = document.getElementById("loginError");
      errorEl.textContent = "";

      // Basic client-side validation
      if (!email || !password) {
        errorEl.textContent = "All fields are required.";
        return;
      }
      if (password.length < 6) {
        errorEl.textContent = "Password must be at least 6 characters.";
        return;
      }

      // Post to backend login API
      try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (response.ok) {
          // Store JWT token (or session), redirect to dashboard
          sessionStorage.setItem("token", result.token);
          window.location.href = "dashboard.html";
        } else {
          errorEl.textContent = result.message || "Login failed.";
        }
      } catch (err) {
        errorEl.textContent = "Network error.";
      }
    });
  }

  // --- REGISTER HANDLER ---
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("registerName").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;
      const confirm = document.getElementById("registerConfirm").value;
      const errorEl = document.getElementById("registerError");
      errorEl.textContent = "";

      // Basic validation
      if (!name || !email || !password || !confirm) {
        errorEl.textContent = "All fields are required.";
        return;
      }
      if (password.length < 6) {
        errorEl.textContent = "Password must be at least 6 characters.";
        return;
      }
      if (password !== confirm) {
        errorEl.textContent = "Passwords do not match.";
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const result = await response.json();
        if (response.ok) {
          // Optionally redirect to login or auto-login
          window.location.href = "login.html";
        } else {
          errorEl.textContent = result.message || "Registration failed.";
        }
      } catch {
        errorEl.textContent = "Network error.";
      }
    });
  }
});
