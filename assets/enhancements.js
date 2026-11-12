const headingObserver=!reduced?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-typed');headingObserver.unobserve(entry.target);}});},{threshold:.12}):null;
function prepareHeading(h){
if(reduced||h.dataset.typed==='true')return;
h.dataset.typed='true';h.setAttribute('aria-label',h.textContent);h.classList.add('heading-typed');
let position=0;
const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
nodes.forEach(node=>{if(!node.textContent.trim())return;const fragment=document.createDocumentFragment();(node.textContent.match(/\S+|\s+/g)||[]).forEach(part=>{if(/^\s+$/.test(part)){fragment.append(document.createTextNode(part));return;}const word=document.createElement('span');word.className='typed-word';Array.from(part).forEach(letter=>{const span=document.createElement('span');span.className='typed-char';span.textContent=letter;span.style.setProperty('--char-delay',`${Math.min(position++*19,850)}ms`);word.append(span);});fragment.append(word);});node.replaceWith(fragment);});
headingObserver.observe(h);
}
window.refreshHeadings=()=>{$$('h1,h2,h3').forEach(h=>{if(h.dataset.typed==='true'&&!$('.typed-char',h)){delete h.dataset.typed;h.classList.remove('is-typed');}prepareHeading(h);});};
window.refreshHeadings();
if($('.collection-grid')){
const list=products.filter(p=>p.group===page);
const renderCollection=()=>{
 const query=$('#catalog-search').value.trim().toLowerCase(),pet=$('#catalog-pet').value,sort=$('#catalog-sort').value;
 let shown=list.filter(p=>(pet==='all'||p.pet==='both'||p.pet===pet)&&`${p.name} ${p.material} ${p.description}`.toLowerCase().includes(query));
 if(sort==='price-low')shown.sort((a,b)=>parseFloat(a.price.slice(1))-parseFloat(b.price.slice(1)));
 if(sort==='price-high')shown.sort((a,b)=>parseFloat(b.price.slice(1))-parseFloat(a.price.slice(1)));
 if(sort==='name')shown.sort((a,b)=>a.name.localeCompare(b.name));
 $('.collection-grid').innerHTML=shown.map(card).join('');$('#product-count').textContent=shown.length;$('#no-products').hidden=shown.length>0;window.refreshHeadings();if(selected.size)updateCompare();
};
$('#catalog-search').addEventListener('input',renderCollection);$('#catalog-pet').addEventListener('change',renderCollection);$('#catalog-sort').addEventListener('change',renderCollection);
}
if(page==='product'){
const current=products.find(p=>p.id===new URLSearchParams(location.search).get('item'))||products[0];
document.title=`${current.name} | ${C.brand}`;
const crumb=$('.product-detail .breadcrumb');crumb.href=current.group+'.html';crumb.textContent='Collection / '+current.category;
}
if(page==='journal'){
const current=C.journal.find(p=>p.id===new URLSearchParams(location.search).get('article'))||C.journal[0];document.title=`${current.title} | ${C.brand}`;
}
const mainImages=$$('.hero-portrait img');mainImages.forEach((img,i)=>{img.loading=i?'eager':'eager';if(!i)img.fetchPriority='high';});
$$('select').forEach((select,index)=>{
const wrap=document.createElement('div');wrap.className='custom-select';select.before(wrap);wrap.append(select);select.tabIndex=-1;
const trigger=document.createElement('button');trigger.type='button';trigger.className='select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label',select.getAttribute('aria-label')||select.closest('label')?.childNodes[0]?.textContent.trim()||'Choose an option');
const options=document.createElement('div');options.className='select-options';options.id='select-options-'+index;options.setAttribute('role','listbox');options.hidden=true;trigger.setAttribute('aria-controls',options.id);wrap.append(trigger,options);
const sync=()=>{trigger.innerHTML=esc(select.options[select.selectedIndex]?.text||'Choose')+uiIcon('down');[...options.children].forEach((b,i)=>{b.setAttribute('aria-selected',i===select.selectedIndex);b.innerHTML=esc(select.options[i].text)+(i===select.selectedIndex?uiIcon('check'):'');});};
const close=()=>{options.hidden=true;trigger.setAttribute('aria-expanded','false');};
[...select.options].forEach((option,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.onclick=()=>{select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();trigger.focus();};options.append(b);});
trigger.onclick=()=>{const opening=options.hidden;document.querySelectorAll('.select-options').forEach(e=>e.hidden=true);document.querySelectorAll('.select-trigger').forEach(e=>e.setAttribute('aria-expanded','false'));options.hidden=!opening;trigger.setAttribute('aria-expanded',opening);if(opening)options.children[select.selectedIndex]?.focus();};
wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus();}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(options.hidden){trigger.click();return;}const buttons=[...options.children],i=buttons.indexOf(document.activeElement);buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}if(e.key==='Tab')close();});
document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});select.addEventListener('change',sync);select.form?.addEventListener('reset',()=>setTimeout(sync));sync();
});
