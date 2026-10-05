/* Review prototypes: no analytics, account prompts, or changes to the real home. */
const categoryLabels={magnesium:'Magnésium',creatine:'Créatine',omega3:'Oméga-3',vitamin_d3:'Vitamine D3',whey:'Whey',melatonin:'Mélatonine',collagen:'Collagène',probiotics:'Probiotiques',multivitamin:'Multivitamines',zinc:'Zinc',vitamin_c:'Vitamine C',vitamin_b12:'Vitamine B12',vitamin_k2:'Vitamine K2',b_complex:'Complexe B',biotin:'Biotine',folate:'Folates',vitamin_e:'Vitamine E',iron:'Fer',calcium:'Calcium',iodine:'Iode',selenium:'Sélénium',chromium:'Chrome',potassium:'Potassium',ashwagandha:'Ashwagandha',rhodiola:'Rhodiola',ginseng:'Ginseng',curcumin:'Curcuma',turmeric:'Curcuma',tribulus:'Tribulus',tongkat_ali:'Tongkat ali',fenugreek:'Fenugrec',maca:'Maca',zma:'ZMA',daa:'Acide D-aspartique',ecdysterone:'Ecdystérone',turkesterone:'Turkestérone'};
const products=typeof N3GH_DATA!=='undefined'?N3GH_DATA.products:[];
document.querySelectorAll('[data-category-count]').forEach(el=>{const count=products.filter(p=>p.category===el.dataset.categoryCount).length;if(count)el.textContent=count+' produits à comparer';});
const index=document.getElementById('category-index');
if(index&&products.length){
  const categories=[...new Set(products.map(p=>p.category))];
  const known=[...index.querySelectorAll('a')].map(a=>a.hash.slice(5));
  categories.filter(c=>!known.includes(c)).sort((a,b)=>(categoryLabels[a]||a).localeCompare(categoryLabels[b]||b,'fr')).forEach(category=>{const link=document.createElement('a');link.href='../compare/#cat='+category;link.target='_top';link.append(document.createTextNode(categoryLabels[category]||category.replaceAll('_',' ')));const arrow=document.createElement('span');arrow.className='arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';link.append(arrow);index.append(link);});
  document.getElementById('catalog-count').textContent=categories.length+' familles';
}
const search=document.getElementById('category-search');
if(search){
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  search.addEventListener('input',()=>{let visible=0;const term=normalize(search.value.trim());index.querySelectorAll('a').forEach(link=>{link.hidden=!normalize(link.textContent).includes(term);if(!link.hidden)visible++;});document.getElementById('no-results').hidden=visible>0;document.getElementById('filter-status').textContent=visible+' familles affichées';});
}
/* The mockups are French; preserve that choice when following a real route. */
document.querySelectorAll('a[href^="../compare"]').forEach(link=>link.addEventListener('click',()=>{try{localStorage.setItem('n3gh_lang','fr');}catch(e){}}));
