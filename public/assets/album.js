const elements = {
  loading: document.getElementById('loading'), error: document.getElementById('error'), survey: document.getElementById('survey'), album: document.getElementById('album'),
  viewer: document.getElementById('viewer'), viewerImage: document.getElementById('viewer-image'), viewerDownload: document.getElementById('viewer-download'),
  form: document.getElementById('survey-form'), formError: document.getElementById('form-error'), submit: document.getElementById('survey-submit')
};
let sessionToken = '';

function showOnly(name) { ['loading','error','survey','album'].forEach(key => elements[key].classList.toggle('hidden', key !== name)); }
function showError(message) { document.getElementById('error-message').textContent = message; showOnly('error'); }
function openViewer(image) { elements.viewerImage.src=image.directUrl; elements.viewerDownload.href=image.directUrl; elements.viewer.classList.remove('hidden'); document.body.style.overflow='hidden'; }
function closeViewer() { elements.viewer.classList.add('hidden'); elements.viewerImage.src=''; document.body.style.overflow=''; }

function renderAlbum(session) {
  const grid=document.getElementById('photo-grid'); grid.innerHTML='';
  const ordered=[...session.images].sort((a,b)=>(a.kind==='collage'?-1:1)-(b.kind==='collage'?-1:1)||(a.order||0)-(b.order||0));
  ordered.forEach((image,index)=>{
    const card=document.createElement('figure'); card.className=`photo-card${image.kind==='collage'?' featured':''}`;
    const img=document.createElement('img'); img.src=image.directUrl; img.alt=image.kind==='collage'?'Ảnh ghép hoàn chỉnh':`Ảnh gốc ${image.order||index+1}`; img.loading=index<2?'eager':'lazy'; img.addEventListener('click',()=>openViewer(image));
    const actions=document.createElement('figcaption'); actions.className='photo-actions';
    const label=document.createElement('span'); label.textContent=image.kind==='collage'?'ẢNH GHÉP':`ẢNH ${image.order||index+1}`;
    const link=document.createElement('a'); link.href=image.directUrl; link.target='_blank'; link.rel='noopener'; link.textContent='XEM / TẢI';
    actions.append(label,link); card.append(img,actions); grid.appendChild(card);
  });
  document.getElementById('page-title').textContent='ẢNH TƯƠI ĐÃ TỚI!';
  document.getElementById('album-subtitle').textContent='Cảm ơn bạn đã chia sẻ cùng Saigon Tếu.';
  document.getElementById('photo-count').textContent=`${session.imageCount} ảnh`;
  document.getElementById('expiry').textContent=`Album khả dụng đến ${new Date(session.expiresAt).toLocaleDateString('vi-VN')}`;
  showOnly('album'); window.scrollTo({top:0,behavior:'smooth'});
}

function surveyPayload(form) {
  const data=new FormData(form);
  return { fullName:data.get('fullName'),email:data.get('email'),phone:data.get('phone'),likesPhotobooth:data.get('likesPhotobooth'),priceRange:data.get('priceRange'),priceOther:data.get('priceOther'),readiness:data.get('readiness'),feedback:data.get('feedback'),consent:data.get('consent')==='on' };
}

elements.form.addEventListener('submit',async event=>{
  event.preventDefault(); elements.formError.classList.add('hidden');
  if(!elements.form.reportValidity()) return;
  elements.submit.disabled=true; elements.submit.textContent='ĐANG LƯU KHẢO SÁT...';
  try {
    const response=await fetch(`/api/sessions/${encodeURIComponent(sessionToken)}/survey`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(surveyPayload(elements.form))});
    const result=await response.json(); if(!response.ok) throw new Error(result.error||'Chưa gửi được khảo sát.'); renderAlbum(result);
  } catch(error) { elements.formError.textContent=error.message; elements.formError.classList.remove('hidden'); }
  finally { elements.submit.disabled=false; elements.submit.textContent='GỬI KHẢO SÁT & MỞ ẢNH →'; }
});

document.querySelectorAll('input[name="priceRange"]').forEach(input=>input.addEventListener('change',()=>{const other=document.getElementById('price-other');const active=input.value==='other'&&input.checked;other.classList.toggle('hidden',!active);other.required=active;if(active)other.focus();}));

async function loadAlbum() {
  const match=location.pathname.match(/^\/s\/([A-Za-z0-9_-]{20,80})\/?$/); if(!match) return showError('Đường dẫn album không hợp lệ.'); sessionToken=match[1];
  try { const response=await fetch(`/api/sessions/${encodeURIComponent(sessionToken)}`); const result=await response.json(); if(!response.ok)throw new Error(result.error||'Không tìm thấy album.'); document.getElementById('album-subtitle').textContent=`${result.imageCount} ảnh đang chờ bạn mở khóa`; showOnly('survey'); }
  catch(error){showError(error.message);}
}

document.getElementById('viewer-close').addEventListener('click',closeViewer); elements.viewer.addEventListener('click',event=>{if(event.target===elements.viewer)closeViewer();}); document.addEventListener('keydown',event=>{if(event.key==='Escape')closeViewer();}); loadAlbum();
