"use strict";
const DATA = window.APP_DATA || [];
const GENS = (window.GENS || []).filter(g => g.start <= "2026-07-01"); // 排除 MATE
const MIN_DATE = GENS[0].start;
const MAX_DATE = "2026-07-01";                       // 数据锚点 = X-VERSE-X 末
const GEN_BY_DATE = (() => {                         // 预排序，便于 genAtDate
  const a = GENS.slice().sort((x, y) => x.start < y.start ? -1 : 1);
  return a;
})();
const ROW_H = 30;

// ---------- 日期工具 ----------
const dt = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const daysBetween = (a,b) => Math.round((dt(b)-dt(a))/86400000);
const addDays = (s,n) => iso(new Date(dt(s).getTime()+n*86400000));
const TOTAL_DAYS = daysBetween(MIN_DATE, MAX_DATE);

// ---------- 状态 ----------
const state = { date: MAX_DATE, snap: false, playing: false, playTimer: null };
const $ = id => document.getElementById(id);

// ---------- 核心查询 ----------
function genAtDate(date){
  for (let i=GEN_BY_DATE.length-1; i>=0; i--){
    const g=GEN_BY_DATE[i];
    if (g.start <= date && (!g.end || date <= g.end)) return g;
  }
  return GEN_BY_DATE[0];
}
function constAt(song, diff, date){
  const tl = (song.charts[diff] || {}).timeline;
  if (!tl) return null;
  let v = null;
  for (const e of tl){ if (e.date <= date) v = e.const; else break; }
  return v;
}
function primaryConst(song, date){
  // 主难度 = 最难的难度定数：有 ULT 取 ULT(ULT 不会比 MAS 简单)，否则 MAS
  const u = constAt(song, "ULT", date);
  return u != null ? u : constAt(song, "MAS", date);
}
function availableAt(song, date){
  const r = song.releaseDate || MIN_DATE;
  if (r > date) return false;
  if (song.endDate && date > song.endDate) return false;
  return true;
}
function diffChange(song, diff, gen){
  // 该难度在本代(gen.start)的变动：new=本代首次出现(新歌/后追加) / up / down / null
  if (!gen) return null;
  const tl = (song.charts[diff]||{}).timeline || [];
  const i = tl.findIndex(e => e.date === gen.start);
  if (i < 0) return null;
  const prev = i>0 ? tl[i-1].const : null;
  if (prev == null) return "new";
  return tl[i].const > prev ? "up" : "down";
}
function rowChanged(song, gen){
  return gen && ["EXP","MAS","ULT"].some(d => diffChange(song, d, gen));
}
function trailStr(song, diff, date){
  const tl = (song.charts[diff]||{}).timeline;
  if (!tl || !tl.length) return "";
  return tl.map(e => `${e.genName} ${e.const}`).join(" → ");
}

// ---------- 筛选/排序 ----------
function readFilters(){
  return {
    diffs: ["EXP","MAS","ULT"].filter(d => $("f-"+d.toLowerCase()).checked),
    min: parseFloat($("f-min").value)||0, max: parseFloat($("f-max").value)||16,
    q: $("f-search").value.trim().toLowerCase(),
    status: $("f-status").value, changed: $("f-changed").checked, sort: $("f-sort").value,
  };
}
function computeList(){
  const f = readFilters(), date = state.date, gen = genAtDate(date);
  let list = DATA.filter(s => availableAt(s, date));
  if (f.q) list = list.filter(s => s.title.toLowerCase().includes(f.q));
  if (f.status !== "all") list = list.filter(s => s.status === f.status);
  if (f.changed) list = list.filter(s => rowChanged(s, gen));
  // 定数区间：任一勾选难度落在区间内
  list = list.filter(s => {
    if (!f.diffs.length) return true;
    return f.diffs.some(d => { const c=constAt(s,d,date); return c!=null && c>=f.min && c<=f.max; });
  });
  // 排序
  const k = f.sort;
  const usePrimary = k==="primary-desc"||k==="primary-asc";
  list.sort((a,b)=>{
    if (k==="name") return a.title<b.title?-1:1;
    if (k==="release") return (a.releaseDate||"9")<(b.releaseDate||"9")?-1:1;
    const ca=(usePrimary?primaryConst(a,date):constAt(a,"MAS",date))??-1;
    const cb=(usePrimary?primaryConst(b,date):constAt(b,"MAS",date))??-1;
    return (k==="mas-asc"||k==="primary-asc") ? ca-cb : cb-ca;
  });
  return list;
}

// ---------- 渲染 ----------
function renderStatus(list){
  const g = genAtDate(state.date);
  const totalAvail = DATA.filter(s=>availableAt(s,state.date)).length;
  $("statusbar").innerHTML =
    `📅 <b>${state.date}</b> · 所属代: <b style="background:${g.color};padding:1px 6px;border-radius:3px">${g.name}</b>` +
    ` · 当天实装 <b>${totalAvail}</b> 首 · 当前筛选命中 <b>${list.length}</b> 首`;
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function renderList(){
  const list = computeList();
  renderStatus(list);
  const scrollEl = $("listscroll");
  const body = $("listbody");
  const top = scrollEl.scrollTop, h = scrollEl.clientHeight;
  const start = Math.max(0, Math.floor(top/ROW_H) - 4);
  const end = Math.min(list.length, Math.ceil((top+h)/ROW_H) + 4);
  const gen = genAtDate(state.date);
  body.style.paddingTop = (start * ROW_H) + "px";
  body.style.paddingBottom = (Math.max(0, list.length - end) * ROW_H) + "px";
  body.innerHTML = list.slice(start, end).map(s => innerRow(s, gen)).join("");
}
function diffCell(s, diff, d, gen){
  const c = constAt(s,diff,d);
  const ch = diffChange(s,diff,gen);
  const mark = ch ? ` <span class="mark ${ch}">${ch==="up"?"▲":ch==="down"?"▼":"★"}</span>` : "";
  return `<div class="c-${diff.toLowerCase()}">${c==null?`<span class="const-null">—</span>`:c.toFixed(1)}${mark}</div>`;
}
function innerRow(s, listGen){
  const d=state.date;
  const changed = rowChanged(s, listGen);
  const cls=["row", s.status==="delisted"?"delisted":"", changed?"changed":""].join(" ").trim();
  return `<div class="${cls}">
    <div class="c-title" data-copy="${esc(s.title)}" data-full="${esc(s.title)}">${esc(s.title)}</div>
    ${diffCell(s,"EXP",d,listGen)}${diffCell(s,"MAS",d,listGen)}${diffCell(s,"ULT",d,listGen)}
    <div class="c-trail" data-full="${esc(trailStr(s,'MAS',d))}">${esc(trailStr(s,'MAS',d))}</div>
    <div class="c-wiki">${s.wiki_url?`<a href="${esc(s.wiki_url)}" target="_blank" rel="noopener">🔗</a>`:""}</div>
  </div>`;
}

function render(){ renderList(); }

// ---------- 时间轴 ----------
function buildBands(){
  const wrap = $("genbands");
  wrap.innerHTML = "";
  for (const g of GEN_BY_DATE){
    const dur = daysBetween(g.start, g.end || MAX_DATE);
    const b = document.createElement("div");
    b.className = "band" + (g.short==="MATE"?" outscope":"");
    b.style.flexGrow = Math.max(1, dur);
    b.style.flexBasis = "0";
    b.style.background = g.color;
    b.title = `${g.name}  ${g.start} ~ ${g.end||"至今"}`;
    b.innerHTML = `<span class="bname">${g.short}</span>`;
    wrap.appendChild(b);
  }
  const h = document.createElement("div"); h.id = "tlhandle"; wrap.appendChild(h);
}
function setDate(d){
  if (d < MIN_DATE) d = MIN_DATE;
  if (d > MAX_DATE) d = MAX_DATE;
  if (state.snap){
    const g = genAtDate(d);
    const idx = GEN_BY_DATE.indexOf(g);
    const next = GEN_BY_DATE[idx+1];
    d = next ? addDays(next.start, -1) : (g.end || MAX_DATE);   // 吸附到当前代最后一天
  }
  state.date = d;
  $("dateinput").value = d;
  const h = $("tlhandle");
  if (h) h.style.left = (daysBetween(MIN_DATE, d) / TOTAL_DAYS * 100) + "%";
  render();
}

// ---------- 交互 ----------
function setupEvents(){
  $("dateinput").onchange = e => setDate(e.target.value);
  // 在色带上拖动/点击 = 精确 scrub（手柄 left = 天数比例，与色带同坐标系，严丝合缝）
  const bands = $("genbands");
  const scrub = x => { const r = bands.getBoundingClientRect(); let f = (x - r.left) / r.width; f = Math.max(0, Math.min(1, f)); setDate(addDays(MIN_DATE, Math.round(f * TOTAL_DAYS))); };
  bands.addEventListener("pointerdown", e => { bands.setPointerCapture(e.pointerId); bands._drag = true; scrub(e.clientX); });
  bands.addEventListener("pointermove", e => { if (bands._drag) scrub(e.clientX); });
  bands.addEventListener("pointerup", () => { bands._drag = false; });
  bands.addEventListener("pointercancel", () => { bands._drag = false; });
  $("prevday").onclick = () => setDate(addDays(state.date, -1));
  $("nextday").onclick = () => setDate(addDays(state.date, 1));
  $("todaybtn").onclick = () => setDate(MAX_DATE);
  $("snap").onchange = e => { state.snap = e.target.checked; setDate(state.date); };
  $("playbtn").onclick = togglePlay;
  ["f-exp","f-mas","f-ult","f-min","f-max","f-search","f-status","f-changed","f-sort"].forEach(id=>{
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  $("listscroll").addEventListener("scroll", renderList);
  // 行：hover 全名 tooltip / 点击复制
  document.addEventListener("mouseover", e=>{
    const t = e.target.closest("[data-full]");
    const tip = $("tooltip");
    if (t && t.dataset.full){
      tip.textContent = t.dataset.full;
      tip.style.display = "block";
    } else tip.style.display = "none";
  });
  document.addEventListener("mousemove", e=>{
    const tip=$("tooltip");
    if (tip.style.display!=="none"){ tip.style.left=(e.clientX+12)+"px"; tip.style.top=(e.clientY+12)+"px"; }
  });
  document.addEventListener("click", e=>{
    const t = e.target.closest("[data-copy]");
    if (t) copyText(t.dataset.copy, e.clientX, e.clientY);
  });
}
function copyText(text, x, y){
  const show=()=>{const c=$("copied");c.style.display="block";c.style.left=(x+12)+"px";c.style.top=(y+12)+"px";setTimeout(()=>c.style.display="none",800);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(show).catch(()=>{fallbackCopy(text);show();});}
  else{fallbackCopy(text);show();}
}
function fallbackCopy(text){const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch(e){}document.body.removeChild(ta);}
function togglePlay(){
  if (state.playing){
    state.playing=false; clearInterval(state.playTimer); $("playbtn").textContent="▶ 播放";
  } else {
    if (state.date >= MAX_DATE) setDate(MIN_DATE);
    state.playing=true; $("playbtn").textContent="⏸ 暂停";
    state.playTimer=setInterval(()=>{
      let nd=addDays(state.date, 7);
      if (nd > MAX_DATE){ nd=MAX_DATE; togglePlay(); }
      setDate(nd);
    }, 120);
  }
}

// ---------- init ----------
$("missing-note").id = "missing-note";
const _total = DATA.length;
const _withHist = DATA.filter(s => s.charts && Object.keys(s.charts).length).length;
$("missing-note").innerHTML = `数据：${_total} 首，${_withHist} 有完整历史。`;
buildBands();
setupEvents();
state.snap = $("snap").checked;   // 同步勾选状态(默认开)，否则加载时不吸附
setDate(MAX_DATE);
