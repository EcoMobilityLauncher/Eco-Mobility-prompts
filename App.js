let DATA = {};
const catSelect = document.getElementById('category');
const varSelect = document.getElementById('variation');
const output = document.getElementById('output');

const DESCRIPTORS = {
  materials: " Realistic materials: powder-coated steel, bead-blasted aluminum, satin ABS plastics, matte polycarbonate lenses, synthetic leather, braided cables. Visible stainless cap screws, nyloc nuts, rivnuts, dzus fasteners where appropriate.",
  wiring: " Show HV orange conduits, braided phase leads, Deutsch/XT90/Anderson connectors with silicone boots, cable clamps and grommets. Add safety decals, QR service labels, embossed branding.",
  textures: " Subtle manufacturing marks: light scratches, brushed grain, extrusion seams, TIG weld coloring, faint road dust in crevices.",
  lighting: " Clean white cyclorama studio, soft three-point lighting, mild floor reflection, HDR highlights, controlled shadow falloff.",
  cameras: " Primary 3/4 front-left view; also provide top-down, side profile, rear 3/4, and a macro detail of powertrain/battery/controls.",
  exploded: " Include an exploded-view variant separating body panels, battery tray, motor, controllers, suspension, and fasteners along aligned axes with clear spacing.",
  colorways: " Colorways: (1) satin graphite + eco-green accent, (2) matte desert khaki + black hardware, (3) metallic midnight blue + neon green pinstripe.",
  quality: " Photorealistic, clean topology, watertight geometry, high-detail normals; avoid stylization; prioritize manufacturable realism."
};

async function loadBranding() {
  try {
    const res = await fetch('branding.json');
    if (res.ok) {
      const branding = await res.json();
      applyBranding(branding);
      document.getElementById('logoUrl').value = branding.logo || '';
      if (branding.brandColor) document.getElementById('brandColor').value = branding.brandColor;
      if (branding.accentColor) document.getElementById('accentColor').value = branding.accentColor;
    }
  } catch {}
  const saved = JSON.parse(localStorage.getItem('eco_branding') || '{}');
  if (Object.keys(saved).length) applyBranding(saved);
}

function applyBranding(branding) {
  const logo = document.getElementById('logo');
  if (branding.logo) logo.src = branding.logo;
  if (branding.brandColor) document.documentElement.style.setProperty('--brand', branding.brandColor);
  if (branding.accentColor) document.documentElement.style.setProperty('--accent', branding.accentColor);
}

async function loadData() {
  const res = await fetch('templates.json');
  DATA = await res.json();
  catSelect.innerHTML = Object.keys(DATA).map(k => `<option value="${k}">${k}</option>`).join('');
  updateVariations();
  updateOutput();
}

function updateVariations() {
  const cat = catSelect.value;
  const items = DATA[cat] || [];
  varSelect.innerHTML = items.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
}

function buildPrompt() {
  const cat = catSelect.value;
  const idx = parseInt(varSelect.value || 0, 10);
  const base = DATA[cat]?.[idx]?.prompt || '';

  const v = document.getElementById('voltage').value.trim();
  const c = document.getElementById('capacity').value.trim();
  const p = document.getElementById('power').value.trim();
  const ctrl = document.getElementById('controller').value.trim();
  const finish = document.getElementById('finish').value.trim();
  const notes = document.getElementById('notes').value.trim();

  let extras = [];
  if (v) extras.push(`${v}V`);
  if (c) extras.push(`${c}Ah`);
  if (p) extras.push(`${p} kW motor`);
  if (ctrl) extras.push(`controller: ${ctrl}`);
  if (finish) extras.push(`finish: ${finish}`);
  const extraStr = extras.length ? ` Additional specs: ${extras.join(', ')}.` : '';

  const descToggles = [...document.querySelectorAll('input.desc:checked')].map(el => el.value);
  const descStr = descToggles.map(k => DESCRIPTORS[k]).join('');

  const noteStr = notes ? ` Notes: ${notes}.` : '';

  return `${base}${extraStr}${noteStr}${descStr}`.trim();
}

function updateOutput() { output.value = buildPrompt(); }

document.getElementById('generate').addEventListener('click', updateOutput);

document.getElementById('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(output.value);
  alert('Prompt copied');
});

document.getElementById('download').addEventListener('click', () => {
  const blob = new Blob([output.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'meshy_prompt.txt'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('downloadZip').addEventListener('click', async () => {
  const zip = new JSZip();
  const readme = `# Eco Mobility Prompt Pack

This ZIP includes: templates.json (full library), branding.json (optional), and one sample generated prompt.

Open index.html on your deployed site to generate new prompts.
`;
  zip.file('README.md', readme);
  const t = await fetch('templates.json').then(r => r.text());
  zip.file('templates.json', t);
  const branding = localStorage.getItem('eco_branding') || '{
  "logo": "",
  "brandColor": "#0ea5e9",
  "accentColor": "#22c55e"
}';
  zip.file('branding.json', branding);
  zip.file('sample_prompt.txt', output.value || '');
  const blob = await zip.generateAsync({type:'blob'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'eco-mobility-prompts.zip'; a.click();
  URL.revokeObjectURL(url);
});

// Branding save
const saveBtn = document.getElementById('saveBranding');
saveBtn.addEventListener('click', () => {
  const branding = {
    logo: document.getElementById('logoUrl').value.trim(),
    brandColor: document.getElementById('brandColor').value,
    accentColor: document.getElementById('accentColor').value
  };
  localStorage.setItem('eco_branding', JSON.stringify(branding));
  applyBranding(branding);
  alert('Branding saved');
});

catSelect.addEventListener('change', () => { updateVariations(); updateOutput(); });
varSelect.addEventListener('change', updateOutput);
['voltage','capacity','power','controller','finish','notes']
  .forEach(id => document.getElementById(id).addEventListener('input', updateOutput));

loadBranding();
loadData();
