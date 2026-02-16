// ========================================
// ACCENT COLOR MANAGEMENT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved accent color on page load
  const savedColor = localStorage.getItem('accentColor');
  if (savedColor) {
    applyAccentColor(savedColor);
    
    // Update color picker if on settings page
    const picker = document.getElementById('accent-color');
    if (picker) picker.value = savedColor;
  }

  // Initialize page-specific functionality
  initializeSettings();
  initializeWebhooks();
});

function applyAccentColor(color) {
  const style = `
    :root {
      --accent: ${color};
      --accent-dark: ${adjustColor(color, -15)};
      --accent-light: ${adjustColor(color, 15)};
    }
  `;
  document.getElementById('accent-style').textContent = style;
}

function adjustColor(hex, percent) {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, Math.round(r * (1 + percent / 100))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 + percent / 100))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 + percent / 100))));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ========================================
// SETTINGS PAGE
// ========================================

function initializeSettings() {
  const applyBtn = document.getElementById('apply-color');
  const resetBtn = document.getElementById('reset-color');
  const colorInput = document.getElementById('accent-color');

  if (applyBtn && colorInput) {
    applyBtn.addEventListener('click', () => {
      const color = colorInput.value;
      localStorage.setItem('accentColor', color);
      applyAccentColor(color);
      showMessage('Color applied successfully!', 'success');
    });

    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('accentColor');
      showMessage('Color reset to default', 'success');
      setTimeout(() => location.reload(), 1000);
    });
  }
}

// ========================================
// DISCORD WEBHOOK MANAGEMENT
// ========================================

function initializeWebhooks() {
  const addBtn = document.getElementById('add-webhook');
  const sendBtn = document.getElementById('send-webhook');
  
  if (addBtn) {
    addBtn.addEventListener('click', addWebhook);
    loadWebhooks();
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', sendWebhookMessage);
  }
}

function getWebhooks() {
  const webhooks = localStorage.getItem('webhooks');
  return webhooks ? JSON.parse(webhooks) : [];
}

function saveWebhooks(webhooks) {
  localStorage.setItem('webhooks', JSON.stringify(webhooks));
}

function addWebhook() {
  const nameInput = document.getElementById('webhook-name');
  const urlInput = document.getElementById('webhook-url');
  
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();

  // Validation
  if (!name) {
    showMessage('Please enter a webhook name', 'error');
    return;
  }

  if (!url) {
    showMessage('Please enter a webhook URL', 'error');
    return;
  }

  if (!isValidWebhookUrl(url)) {
    showMessage('Invalid Discord webhook URL', 'error');
    return;
  }

  // Check for duplicate names
  const webhooks = getWebhooks();
  if (webhooks.some(w => w.name === name)) {
    showMessage('A webhook with this name already exists', 'error');
    return;
  }

  // Add webhook
  webhooks.push({
    id: Date.now().toString(),
    name: name,
    url: url,
    createdAt: new Date().toISOString()
  });

  saveWebhooks(webhooks);
  
  // Clear inputs
  nameInput.value = '';
  urlInput.value = '';
  
  // Reload display
  loadWebhooks();
  showMessage('Webhook added successfully!', 'success');
}

function loadWebhooks() {
  const container = document.getElementById('webhook-list');
  if (!container) return;

  const webhooks = getWebhooks();

  if (webhooks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔗</div>
        <p>No webhooks saved yet</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Add your first Discord webhook above</p>
      </div>
    `;
    return;
  }

  container.innerHTML = webhooks.map(webhook => `
    <div class="webhook-item" data-id="${webhook.id}">
      <div class="webhook-info">
        <div class="webhook-name">${escapeHtml(webhook.name)}</div>
        <div class="webhook-url">${escapeHtml(webhook.url)}</div>
      </div>
      <div class="webhook-actions">
        <button class="btn-primary" onclick="testWebhook('${webhook.id}')">Test</button>
        <button class="btn-danger" onclick="deleteWebhook('${webhook.id}')">Delete</button>
      </div>
    </div>
  `).join('');

  // Also populate the select dropdown if it exists
  populateWebhookSelect();
}

function populateWebhookSelect() {
  const select = document.getElementById('webhook-select');
  if (!select) return;

  const webhooks = getWebhooks();
  
  select.innerHTML = webhooks.length === 0
    ? '<option value="">No webhooks available</option>'
    : webhooks.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
}

function deleteWebhook(id) {
  if (!confirm('Are you sure you want to delete this webhook?')) {
    return;
  }

  let webhooks = getWebhooks();
  webhooks = webhooks.filter(w => w.id !== id);
  saveWebhooks(webhooks);
  
  loadWebhooks();
  showMessage('Webhook deleted', 'success');
}

function testWebhook(id) {
  const webhooks = getWebhooks();
  const webhook = webhooks.find(w => w.id === id);
  
  if (!webhook) {
    showMessage('Webhook not found', 'error');
    return;
  }

  const message = {
    content: '✅ Test message from fdiw',
    embeds: [{
      title: 'Webhook Test',
      description: 'This is a test message to verify your webhook is working correctly.',
      color: 0x6366f1,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'fdiw webhook manager'
      }
    }]
  };

  sendToWebhook(webhook.url, message, `Testing webhook "${webhook.name}"`);
}

async function sendWebhookMessage() {
  const select = document.getElementById('webhook-select');
  const messageInput = document.getElementById('webhook-message');
  const usernameInput = document.getElementById('webhook-username');
  const sendBtn = document.getElementById('send-webhook');

  const webhookId = select.value;
  const messageContent = messageInput.value.trim();

  if (!webhookId) {
    showMessage('Please select a webhook', 'error');
    return;
  }

  if (!messageContent) {
    showMessage('Please enter a message', 'error');
    return;
  }

  const webhooks = getWebhooks();
  const webhook = webhooks.find(w => w.id === webhookId);

  if (!webhook) {
    showMessage('Webhook not found', 'error');
    return;
  }

  const payload = {
    content: messageContent
  };

  // Add username if provided
  const username = usernameInput.value.trim();
  if (username) {
    payload.username = username;
  }

  const success = await sendToWebhook(webhook.url, payload, 'Sending message');

  if (success) {
    messageInput.value = '';
  }
}

async function sendToWebhook(url, payload, actionText = 'Sending') {
  const messageDiv = document.getElementById('message');
  
  try {
    showMessage(`${actionText}...`, 'warning');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 204) {
      showMessage('Message sent successfully! ✓', 'success');
      return true;
    } else {
      const errorText = await response.text();
      showMessage(`Failed to send message: ${response.status} ${response.statusText}`, 'error');
      console.error('Webhook error:', errorText);
      return false;
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
    console.error('Webhook error:', error);
    return false;
  }
}

function isValidWebhookUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'discord.com' && 
           urlObj.pathname.includes('/api/webhooks/');
  } catch {
    return false;
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showMessage(text, type = 'success') {
  const messageDiv = document.getElementById('message');
  if (!messageDiv) return;

  messageDiv.textContent = text;
  messageDiv.className = `message ${type} show`;

  // Auto-hide after 4 seconds
  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 4000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ========================================
window.deleteWebhook = deleteWebhook;
window.testWebhook = testWebhook;
