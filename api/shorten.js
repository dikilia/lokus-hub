// ==================== SHORT LINK FUNCTIONS (FIXED) ====================
async function generateShortLink() {
  const url = document.getElementById('shortlinkOriginal').value.trim();
  if (!url) { 
    alert('Enter a URL to shorten'); 
    return; 
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    alert('Please enter a valid URL (including https://)');
    return;
  }
  
  showStatus('🔗 Generating short link...');
  
  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    });
    
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error || 'Failed to generate');
    
    document.getElementById('shortlinkUrl').textContent = data.shortUrl;
    document.getElementById('shortlinkCopy').value = data.shortUrl;
    document.getElementById('shortlinkResult').style.display = 'block';
    
    if (data.method === 'local') {
      showStatus('✅ Local short link created (for testing)');
    } else {
      showStatus('✅ Short link generated successfully!');
    }
  } catch (e) {
    showStatus('❌ Failed to generate short link: ' + e.message, true);
  }
}

async function generateCustomShortLink() {
  const url = document.getElementById('shortlinkOriginal').value.trim();
  const alias = document.getElementById('shortlinkAlias').value.trim();
  
  if (!url || !alias) { 
    alert('Enter both URL and custom alias'); 
    return; 
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    alert('Please enter a valid URL (including https://)');
    return;
  }
  
  // Validate alias (alphanumeric only)
  if (!/^[a-zA-Z0-9]+$/.test(alias)) {
    alert('Alias can only contain letters and numbers');
    return;
  }
  
  showStatus('🔗 Generating custom short link...');
  
  try {
    // For custom aliases, we'll use our own system
    // In production, you'd store this in a database
    const shortUrl = `${window.location.origin}/s/${alias}`;
    
    document.getElementById('shortlinkUrl').textContent = shortUrl;
    document.getElementById('shortlinkCopy').value = shortUrl;
    document.getElementById('shortlinkResult').style.display = 'block';
    
    showStatus('✅ Custom short link created! (Note: You need to set up redirects)');
  } catch (e) {
    showStatus('❌ Failed to create custom link: ' + e.message, true);
  }
}

function copyShortLink() {
  const input = document.getElementById('shortlinkCopy');
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showStatus('✅ Short link copied to clipboard!');
  }).catch(() => {
    alert('Copy manually: ' + input.value);
  });
}