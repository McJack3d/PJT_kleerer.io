const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'compare/index.html'), 'utf8');
const app = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(script => script.includes('const P = N3GH_DATA.products;'));
assert.ok(app, 'the comparator app must be present');
const translations = fs.readFileSync(path.join(root, 'compare/i18n.js'), 'utf8');
const profile = {w:75, h:180, a:35, s:'m', ac:'active'};

function fixtures() {
  const base = {
    category:'glycine', form:'L-glycine', vegan:true, confidence:'high',
    price_note:'Fixture price', notes:'', form_note:'', dose_note:'',
    flags:[], additives_detail:[], certifications:[], transparency:{},
    rank_in_category:1,
    scores:{form:20, dose:10, purity:30, transparency:30, total:90, grade:'A', red_card:false},
    value:{std:0.18, std_label:'€ / 3 g glycine', cost_per_day:0.18, days_per_pack:100, price_tier:1},
  };
  return [
    {...base, id:'glycine-powder', brand:'Powder brand', name:'Glycine powder',
      variant:'400 g', price_eur:18, pack_g:400, serving_g:4, active_per_serving_g:3},
    {...base, id:'glycine-capsules', brand:'Capsule brand', name:'Glycine capsules',
      variant:'90 capsules', price_eur:13.5, units_pack:90, active_per_unit:0.5,
      units_per_day:3, unit_name:'capsule',
      value:{...base.value, std:0.90, cost_per_day:0.45, days_per_pack:30, price_tier:4}},
    {...base, id:'creatine-powder', brand:'Creatine brand', name:'Creatine powder',
      category:'creatine', form:'Creatine monohydrate', variant:'300 g',
      price_eur:20, pack_g:300, serving_g:3, active_per_serving_g:3,
      scores:{...base.scores, transparency:0, total:60, grade:'C'},
      value:{...base.value, std:0.20, std_label:'€ / 3 g creatine', cost_per_day:0.20}},
  ];
}

// Execute the production UI, including startup and rerenders. Only browser
// primitives are stubbed; dose, stack, comparison and localization code is real.
function loadApp({lang='en', savedProfile=null, products=fixtures(), hash=''}={}) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {
        innerHTML:'', textContent:'', value:id === 'sort' ? 'score' : '',
        style:{}, dataset:{}, open:false, className:'',
        classList:{
          add:name => classes.add(name), remove:name => classes.delete(name),
          toggle(name, force) {
            const enabled = force === undefined ? !classes.has(name) : force;
            if (enabled) classes.add(name); else classes.delete(name);
            return enabled;
          },
          contains:name => classes.has(name),
        },
        addEventListener(){}, setAttribute(){},
      });
    }
    return elements.get(id);
  }
  const stored = new Map([['n3gh_lang', lang]]);
  if (savedProfile) stored.set('n3gh_profile', JSON.stringify(savedProfile));
  const alerts = [];
  const sandbox = {
    N3GH_DATA:{products, meta:{n_products:products.length, n_categories:2,
      region:'EU/FR', generated:'2026-10-13', snapshot:'2026-10', methodology_version:'1.2'}},
    document:{getElementById:element, querySelector:() => null, querySelectorAll:() => [],
      addEventListener(){}, documentElement:{lang}, body:{style:{}}},
    window:{addEventListener(){}},
    navigator:{language:lang}, location:{pathname:'/', search:'', hash},
    history:{replaceState(){}}, alert:message => alerts.push(message),
    localStorage:{getItem:key => stored.get(key) ?? null,
      setItem:(key, value) => stored.set(key, value), removeItem:key => stored.delete(key)},
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(translations, context, {filename:'compare/i18n.js'});
  vm.runInContext(app, context, {filename:'compare/index.html'});
  return {run:script => vm.runInContext(script, context), element, alerts, stored};
}

function assertFiniteHTML(value) {
  assert.doesNotMatch(value, /\b(?:NaN|undefined|Infinity)\b/);
}

test('glycine category links, search and language switch expose powders and capsules', () => {
  const ui = loadApp({hash:'#cat=glycine'});
  assert.match(ui.element('pills').innerHTML, /data-k="glycine"/);
  assert.match(ui.element('grid').innerHTML, /Glycine powder/);
  assert.match(ui.element('grid').innerHTML, /Glycine capsules/);
  assert.doesNotMatch(ui.element('grid').innerHTML, /Creatine powder/);
  ui.element('q').value = 'capsule';
  ui.run('render()');
  assert.doesNotMatch(ui.element('grid').innerHTML, /Glycine powder/);
  assert.match(ui.element('grid').innerHTML, /Glycine capsules/);
  ui.run('setLang("fr")');
  assert.match(ui.element('grid').innerHTML, /cible personnelle non établie/);
  assert.equal(ui.stored.get('n3gh_lang'), 'fr');
  assertFiniteHTML(ui.element('grid').innerHTML);
});

for (const lang of ['en', 'fr']) {
  for (const savedProfile of [null, profile]) {
    test(`${lang}: powder and capsule stack adds active grams, with ${savedProfile ? 'a' : 'no'} profile`, () => {
      const ui = loadApp({lang, savedProfile});
      ui.run('toggleStack("glycine-powder"); toggleStack("glycine-capsules"); renderStack()');
      const stack = ui.element('stack-content').innerHTML;
      // The powder serving weighs 4 g but supplies 3 g glycine. Three
      // capsules at 0.5 g each bring the combined amount to 4.5 g, not 5.5 g.
      assert.match(stack, new RegExp(`<b>4\\.5</b> g ${lang === 'fr' ? 'de ' : ''}glycine`));
      assert.match(stack, /Powder brand 3/);
      assert.match(stack, /Capsule brand 1\.5/);
      assert.match(stack, /€0\.63/);
      assert.match(stack, /€18\.90/);
      assert.match(stack, lang === 'fr' ? /pas de recommandation quotidienne/ : /not a recommended daily intake/);
      assert.doesNotMatch(stack, /fit-(?:ok|low|high|over)|doselegend/);
      assertFiniteHTML(stack);
      assert.deepEqual(JSON.parse(ui.stored.get('n3gh_stack')), ['glycine-powder', 'glycine-capsules']);
      ui.run('toggleStack("glycine-powder"); renderStack()');
      assert.match(ui.element('stack-content').innerHTML, /<b>1\.5<\/b>/);
    });
  }

  test(`${lang}: low and high glycine amounts never acquire a personal dose or safety verdict`, () => {
    const ui = loadApp({lang, savedProfile:profile});
    for (const grams of [0.001, 3, 50]) {
      const fit = ui.run(`doseFit({...P[0], active_per_serving_g:${grams}})`);
      assert.equal(fit.state, 'unestablished');
      assert.equal(fit.d, grams);
      assert.equal(fit.noBar, true);
      assert.equal(fit.t.lo, null);
      assert.equal(fit.t.hi, null);
      assert.equal(fit.t.ul, null);
      assert.equal(fit.t.scaled, false);
      assert.match(fit.label, new RegExp(`${grams} g ${lang === 'fr' ? 'de ' : ''}glycine`));
      assert.doesNotMatch(fit.label, /safe|sans risque|under-dosed|sous-dosé|fits you|vous convient/);
    }
    ui.run('openDetail("glycine-powder")');
    const detail = ui.element('modalbox').innerHTML;
    assert.match(detail, lang === 'fr' ? /3 g de glycine par portion étiquette de 4 g/ : /3 g glycine per 4 g label serving/);
    assert.match(detail, lang === 'fr' ? /ne garantit pas la sécurité à toute dose/ : /does not establish safety at any dose/);
    assert.doesNotMatch(detail, /doselegend|fit-(?:ok|low|high|over)/);
    assertFiniteHTML(detail);
  });

  test(`${lang}: compare accepts glycine formats together and rejects another category`, () => {
    const ui = loadApp({lang, savedProfile:profile});
    ui.run('toggleCompare("glycine-powder"); toggleCompare("glycine-capsules")');
    assert.equal(ui.alerts.length, 0);
    ui.run('toggleCompare("creatine-powder")');
    assert.equal(ui.alerts.length, 1);
    assert.match(ui.alerts[0], lang === 'fr' ? /même catégorie/ : /same category/);
    ui.run('openCompare()');
    const comparison = ui.element('modalbox').innerHTML;
    assert.match(comparison, /Glycine powder/);
    assert.match(comparison, /Glycine capsules/);
    assert.doesNotMatch(comparison, /Creatine powder/);
    assert.match(comparison, new RegExp(`1\\.5 g ${lang === 'fr' ? 'de ' : ''}glycine`));
    assert.match(comparison, lang === 'fr' ? /cible personnelle non établie/ : /no established personal target/);
    assert.doesNotMatch(comparison, /fit-(?:ok|low|high|over)/);
    assertFiniteHTML(comparison);
  });
}

test('fit sorting prioritizes an established fit and the fit-only filter excludes glycine', () => {
  const ui = loadApp({savedProfile:profile});
  ui.element('sort').value = 'fit';
  ui.run('render()');
  const sorted = ui.element('grid').innerHTML;
  // Glycine scores 90 and creatine 60: a NaN sort-rank fallback would
  // incorrectly allow score to put the unestablished glycine target first.
  assert.ok(sorted.indexOf('Creatine powder') < sorted.indexOf('Glycine powder'));
  ui.run('toggleFitOnly()');
  assert.match(ui.element('grid').innerHTML, /Creatine powder/);
  assert.doesNotMatch(ui.element('grid').innerHTML, /Glycine/);
  ui.run('setCat("glycine")');
  assert.doesNotMatch(ui.element('grid').innerHTML, /<article/);
  ui.run('clearProfile()');
  assert.match(ui.element('grid').innerHTML, /Glycine powder/);
  assert.match(ui.element('grid').innerHTML, /Glycine capsules/);
  assertFiniteHTML(ui.element('grid').innerHTML);
});

test('a glycine blend still contributes its declared minerals to stack limit checks', () => {
  const products = fixtures();
  products[0].secondary_actives = [{category:'magnesium', per_day:400}];
  // The full catalogue also has standalone magnesium, making its row visible.
  products.push({...products[2], id:'magnesium', category:'magnesium',
    name:'Magnesium', active_per_unit:100, units_per_day:1, unit_name:'capsule'});
  const ui = loadApp({products});
  ui.run('toggleStack("glycine-powder"); toggleStack("glycine-capsules"); renderStack()');
  const stack = ui.element('stack-content').innerHTML;
  assert.match(stack, /<b>4\.5<\/b> g glycine/);
  assert.match(stack, /<b>400<\/b> mg elemental Mg/);
  assert.match(stack, /over the 250 limit/);
  assert.match(stack, /\(built-in\)/);
  assertFiniteHTML(stack);
});

test('every published glycine format renders complete cards and details in both languages', () => {
  const dataContext = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'compare/data.js'), 'utf8'), dataContext);
  const products = vm.runInContext('N3GH_DATA.products.filter(p => p.category === "glycine")', dataContext);
  assert.ok(products.some(p => 'pack_g' in p), 'publish the verified powder references');
  assert.ok(products.some(p => 'units_pack' in p), 'publish the verified capsule references');
  for (const lang of ['en', 'fr']) {
    const ui = loadApp({lang, products, savedProfile:profile, hash:'#cat=glycine'});
    assertFiniteHTML(ui.element('grid').innerHTML);
    for (const product of products) {
      ui.run(`openDetail(${JSON.stringify(product.id)})`);
      const detail = ui.element('modalbox').innerHTML;
      assertFiniteHTML(detail);
      assert.match(detail, /glycine/i);
      assert.doesNotMatch(detail, /doselegend|fit-ok|fit-high/);
    }
  }
});
