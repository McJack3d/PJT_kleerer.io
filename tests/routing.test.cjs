const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const routes=['/','/compare/','/compare/en/','/compare/fr/'];
const page=route=>read(route.slice(1)+'index.html');

test('the homepage and legacy comparator load the same working app',()=>{
  for(const route of routes){
    const html=page(route);
    assert.match(html,/id="q"/);
    assert.match(html,/id="grid"/);
    const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(match=>new URL(match[1],'https://n3gh.com'+route).pathname);
    assert.ok(scripts.includes('/compare/data.js'),route);
    assert.ok(scripts.includes('/compare/i18n.js'),route);
    for(const script of scripts) assert.ok(fs.existsSync(path.join(root,script)),route+' '+script);
    assert.match(html,/<a href="\/about\/" data-i18n="navAbout">/);
  }
});

test('canonical URLs, language alternatives and search verification survive the move',()=>{
  for(const route of routes){
    const html=page(route);
    const canonical=route==='/compare/'?'/':route;
    assert.ok(html.includes('<link rel="canonical" href="https://n3gh.com'+canonical+'">'));
    assert.ok(html.includes('<link rel="alternate" hreflang="x-default" href="https://n3gh.com/">'));
    const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.url,'https://n3gh.com'+canonical);
  }
  assert.match(page('/'),/name="google-site-verification" content="HPrFMnAHMGvPunnkzkRGwmSo9eUX548T0pA9T73I61Q"/);
  assert.match(page('/'),/name="msvalidate\.01" content="6F0ECEC2DF113A827FA5E97B55993661"/);
});

test('language switching preserves queries and category or modal deep links',()=>{
  for(const lang of ['en','fr']){
    const html=page('/compare/'+lang+'/');
    const pin=html.match(/<script>(window\.N3GH_FORCE_LANG=[\s\S]*?)<\/script>/)[1];
    const setLang=html.match(/function setLang\(l\)\{[\s\S]*?\n\}/)[0];
    for(const hash of ['#cat=glycine','#methodology','#about']){
      const saved={};
      const context={window:{},LANG:lang,LANG_KEY:'lang',localStorage:{setItem:(k,v)=>saved[k]=v},location:{search:'?from=saved',hash},applyLang:()=>assert.fail('Expected route navigation')};
      vm.createContext(context);
      vm.runInContext(pin+'\n'+setLang,context);
      const target=lang==='fr'?'en':'fr';
      vm.runInContext('setLang("'+target+'")',context);
      assert.equal(context.location.href,'../'+target+'/?from=saved'+hash);
      assert.equal(saved.lang,target);
    }
  }
});

test('published navigation and assets still resolve after moving the presentation',()=>{
  const sitemap=read('sitemap.xml');
  const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>new URL(match[1]));
  assert.ok(urls.some(url=>url.pathname==='/about/'));
  assert.ok(!urls.some(url=>url.pathname==='/compare/'));
  for(const url of urls){
    const html=page(url.pathname);
    for(const match of html.matchAll(/(?:href|src)="([^"\s]+)"/g)){
      if(match[1].includes('${')) continue;
      const target=new URL(match[1],url);
      if(target.origin!==url.origin) continue;
      const file=target.pathname+(target.pathname.endsWith('/')?'index.html':'');
      assert.ok(fs.existsSync(path.join(root,file)),url.pathname+' -> '+target.pathname);
    }
  }
  const about=page('/about/');
  assert.match(about,/src="\/molecules\.js/);
  assert.match(about,/src="\/assets\/molecules\/glycine\.png"/);
});

test('the presentation directory tracks every published category',()=>{
  const data=JSON.parse(read('compare/data.js').split('const N3GH_DATA = ')[1].trim().replace(/;$/,''));
  const expected=[...new Set(data.products.map(product=>product.category))].sort();
  const actual=[...page('/about/').matchAll(/data-category="([^"]+)"/g)].map(match=>match[1]).sort();
  assert.deepEqual(actual,expected);
});

test('installed app opens the homepage while retaining its existing identity',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url,'/');
  assert.equal(manifest.id,'/compare/');
  assert.equal(manifest.shortcuts[0].url,'/');
  assert.equal(manifest.shortcuts[1].url,'/#methodology');
});
