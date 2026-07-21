const loading = document.getElementById('loading');
const errorPanel = document.getElementById('error');
const albumPanel = document.getElementById('album');
const viewer = document.getElementById('viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerDownload = document.getElementById('viewer-download');

function showError(message) {
  loading.classList.add('hidden');
  albumPanel.classList.add('hidden');
  errorPanel.classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

function openViewer(image) {
  viewerImage.src = image.directUrl;
  viewerDownload.href = image.directUrl;
  viewer.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeViewer() {
  viewer.classList.add('hidden');
  viewerImage.src = '';
  document.body.style.overflow = '';
}

function renderAlbum(session) {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  session.images.forEach((image, index) => {
    const card = document.createElement('figure');
    if (image.kind === 'collage') card.className = 'photo-card featured';
    else card.className = 'photo-card';
    const img = document.createElement('img');
    img.src = image.directUrl;
    img.alt = image.kind === 'collage' ? 'Ảnh ghép hoàn chỉnh' : `Ảnh gốc ${index + 1}`;
    img.loading = index < 2 ? 'eager' : 'lazy';
    img.addEventListener('click', () => openViewer(image));
    const actions = document.createElement('figcaption');
    actions.className = 'photo-actions';
    const label = document.createElement('span');
    label.textContent = image.kind === 'collage' ? 'ẢNH GHÉP' : `ẢNH ${image.order || index + 1}`;
    const link = document.createElement('a');
    link.href = image.directUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'XEM / TẢI';
    actions.append(label, link);
    card.append(img, actions);
    grid.appendChild(card);
  });
  document.getElementById('album-subtitle').textContent = `${session.imageCount} ảnh trong lượt chụp của bạn`;
  document.getElementById('expiry').textContent = `Album khả dụng đến ${new Date(session.expiresAt).toLocaleDateString('vi-VN')}`;
  loading.classList.add('hidden');
  albumPanel.classList.remove('hidden');
}

async function loadAlbum() {
  const match = location.pathname.match(/^\/s\/([A-Za-z0-9_-]{20,80})\/?$/);
  if (!match) return showError('Đường dẫn album không hợp lệ.');
  try {
    const response = await fetch(`/api/sessions/${encodeURIComponent(match[1])}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không tìm thấy album.');
    renderAlbum(result);
  } catch (error) { showError(error.message); }
}

document.getElementById('viewer-close').addEventListener('click', closeViewer);
viewer.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeViewer(); });
loadAlbum();
