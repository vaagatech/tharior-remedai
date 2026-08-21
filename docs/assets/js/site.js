/* =========================================================================
   Anvesh Docs — Site Scripts
   Theme toggle (light/dark with persistence), code copy, and navigation
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');

  function getTheme() {
    return localStorage.getItem('anvesh-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('anvesh-theme', theme);
    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    }
  }

  // Initial apply
  applyTheme(getTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // 2. Copy Code to Clipboard
  document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', () => {
      const pre = button.closest('.code-box')?.querySelector('pre') || button.nextElementSibling;
      if (!pre) return;
      const code = pre.textContent;
      navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.color = '#10B981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.color = '';
        }, 2000);
      });
    });
  });

  // 3. Highlight Active Sidebar Link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
  document.querySelectorAll('.topnav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
});
