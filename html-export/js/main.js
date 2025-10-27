// ===================================
// MAIN JAVASCRIPT - Global Functions
// ===================================

// Navigation State
let mobileMenuOpen = false;

// Toggle Mobile Menu
function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Navigate to page
function navigate(path) {
  // In Laravel, this would be handled by routes
  // For static HTML, update links manually
  window.location.href = path;
}

// Format Date (Swiss Time - CET/CEST)
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich'
  };
  return new Intl.DateTimeFormat('de-CH', options).format(date);
}

// Format Date Relative (e.g., "vor 2 Stunden")
function formatDateRelative(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'gerade eben';
  if (diffMins < 60) return `vor ${diffMins} ${diffMins === 1 ? 'Minute' : 'Minuten'}`;
  if (diffHours < 24) return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
  if (diffDays < 7) return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`;
  
  return formatDate(dateString);
}

// Format Currency (CHF)
function formatCurrency(amount) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(amount);
}

// Show Toast Notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    border-left: 4px solid ${type === 'success' ? 'hsl(var(--pastel-green-100))' : type === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--brand-500))'};
    z-index: 1000;
    animation: fade-in 0.3s ease-out;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fade-out 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Form Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^(\+41|0041|0)[1-9]\d{1,2}\d{3}\d{2}\d{2}$/;
  return re.test(phone.replace(/\s/g, ''));
}

function validatePostalCode(code) {
  const re = /^[1-9]\d{3}$/;
  return re.test(code);
}

// Accordion Toggle
function toggleAccordion(element) {
  const item = element.closest('.accordion-item');
  const content = item.querySelector('.accordion-content');
  const isOpen = content.style.display === 'block';
  
  // Close all accordion items
  document.querySelectorAll('.accordion-content').forEach(c => {
    c.style.display = 'none';
  });
  
  // Open clicked item if it was closed
  if (!isOpen) {
    content.style.display = 'block';
  }
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}

// File Upload Preview
function previewFile(input, previewId) {
  const preview = document.getElementById(previewId);
  const file = input.files[0];
  
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      if (file.type.startsWith('image/')) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; height: auto; border-radius: 0.5rem;">`;
      } else {
        preview.innerHTML = `<p>Datei ausgewählt: ${file.name}</p>`;
      }
    };
    
    reader.readAsDataURL(file);
  }
}

// Search Filter
function filterTable(searchInput, tableId) {
  const filter = searchInput.value.toLowerCase();
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName('tr');
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getElementsByTagName('td');
    let found = false;
    
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      if (cell.textContent.toLowerCase().indexOf(filter) > -1) {
        found = true;
        break;
      }
    }
    
    row.style.display = found ? '' : 'none';
  }
}

// Local Storage Helpers
function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
}

function getFromLocalStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return null;
  }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', function() {
  // Set current year in footer
  const yearElements = document.querySelectorAll('.current-year');
  yearElements.forEach(el => {
    el.textContent = new Date().getFullYear();
  });
  
  // Add active class to current nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.header-nav a, .sidebar-nav a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
  
  // Initialize tooltips (if needed)
  // Add any other initialization code here
});

// Export functions for use in other scripts
window.App = {
  navigate,
  formatDate,
  formatDateRelative,
  formatCurrency,
  showToast,
  validateEmail,
  validatePhone,
  validatePostalCode,
  toggleAccordion,
  openModal,
  closeModal,
  previewFile,
  filterTable,
  toggleMobileMenu,
  saveToLocalStorage,
  getFromLocalStorage
};
