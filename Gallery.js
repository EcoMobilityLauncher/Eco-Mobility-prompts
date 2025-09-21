async function loadBranding() {
  try {
    const res = await fetch('branding.json');
    if (res.ok) {
      const branding = await res.json();
      const logo = document.getElementById('logo');
      if (branding.logo) logo.src = branding.logo;
      if (branding.brandColor) document.documentElement.style.setProperty('--brand', branding.brandColor);
      if (branding.accentColor) document.documentElement.style.setProperty('--accent', branding.accentColor);
    }
  } catch {}
}

async function loadGallery() {
  const res = await fetch('gallery.json');
  const data = await res.json();
  const cards = document.getElementById('cards');
  const filterCat = document.getElementById('filterCat');
  const search = document.getElementById('search');

  const categories = Array.from(new Set(data.map(x => x.category))).sort();
  filterCat.innerHTML = ['All', ...categories].map(c => `<option>${c}</option>`).join('');

  function render() {
    const q = search.value.toLowerCase().trim();
    const cat = filterCat.value;
    const items = data.filter(x => (cat === 'All' || x.category === cat) && (
      !q || `${x.title} ${x.author} ${x.template} ${x.notes}`.toLowerCase().includes(q)
    ));

    cards.innerHTML = items.map(x => `
      <article class="card">
        <img src="${x.image}" alt="${x.title}" />
        <div class="meta">
          <h3>${x.title}</h3>
          <p><strong>Category:</strong> ${x.category} • <strong>Template:</strong> ${x.template}</p>
          <p><strong>Author:</strong> ${x.author || 'Anonymous'}</p>
          ${x.notes ? `<p>${x.notes}</p>` : ''}
          ${x.link ? `<p><a href="${x.link}" target="_blank" rel="noopener">Source</a></p>` : ''}
        </div>
      </article>
    `).join('');
  }

  filterCat.addEventListener('change', render);
  search.addEventListener('input', render);
  render();
}

loadBranding();
loadGallery();
