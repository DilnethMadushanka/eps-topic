"use strict";
const app = document.getElementById("app");
const U = DATA.units;
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem("eps_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("eps_" + k, JSON.stringify(v)); } catch (e) { } }
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const CIRC = ["①", "②", "③", "④"];
const allVocab = () => U.flatMap(u => u.vocab.map(v => ({ ...v, n: u.n })));

/* ---------- speech ---------- */
let koVoice = null;
function pickVoice() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  koVoice = vs.find(v => /^ko/i.test(v.lang)) || null;
  return koVoice;
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
let speakToken = 0;
function stopSpeak() { speakToken++; if (window.speechSynthesis) speechSynthesis.cancel(); }
function speakLines(lines, onend) {
  if (!window.speechSynthesis) { alert("මේ browser එකේ audio (speech) support නැහැ. Chrome පාවිච්චි කරන්න."); return; }
  stopSpeak(); const my = speakToken; pickVoice();
  const items = lines.map(l => {
    const m = String(l).match(/^(?:[①②③④]\s*)?([남여])\s*:\s*(.*)$/);
    const text = (m ? m[2] : String(l).replace(/^[①②③④]\s*/, "")).replace(/\s+/g, " ").trim();
    return { text, g: m ? m[1] : "" };
  }).filter(x => x.text);
  let i = 0;
  const next = () => {
    if (my !== speakToken) return;
    if (i >= items.length) { onend && onend(); return; }
    const it = items[i++]; const u = new SpeechSynthesisUtterance(it.text);
    u.lang = "ko-KR"; if (koVoice) u.voice = koVoice;
    u.rate = 0.85; u.pitch = it.g === "남" ? 0.8 : it.g === "여" ? 1.25 : 1;
    u.onend = () => setTimeout(next, 650); u.onerror = () => setTimeout(next, 100);
    speechSynthesis.speak(u);
  };
  next();
}
function voiceWarning() {
  if (!window.speechSynthesis) return `<div class="note">මේ browser එකේ audio support නැහැ.</div>`;
  if (!pickVoice()) return `<div class="note">⚠ Korean voice එකක් මේ device එකේ හොයාගත්තේ නැහැ. Windows: Settings → Time &amp; language → Speech → Add voices → Korean. Android/Chrome වල සාමාන්‍යයෙන් තියෙනවා. තියෙන්නේ නැත්නම් listening scripts exam එකට පස්සේ කියවන්න පුළුවන්.</div>`;
  return "";
}
const speakWord = t => speakLines([t]);

/* ---------- router ---------- */
function route() {
  stopSpeak(); clearInterval(examTimer);
  const h = location.hash.replace(/^#\/?/, "") || "";
  const p = h.split("/");
  document.querySelectorAll("#nav a").forEach(a => {
    const target = a.getAttribute("href").replace(/^#\/?/, "");
    const active = target === p[0] || (p[0].startsWith("paper") && target === "papers") || (p[0] === "quicktest" && target === "papers");
    a.classList.toggle("on", active);
  });
  window.scrollTo(0, 0);
  if (p[0] === "") return home();
  if (p[0] === "lessons") return lessons();
  if (p[0] === "unit") return unitPage(+p[1], p[2]);
  if (p[0] === "vocab") return vocabPage();
  if (p[0] === "quiz") return vocabQuiz(p[1]);
  if (p[0] === "exam") return examStart();
  if (p[0] === "papers") return papersHub();
  if (p[0] === "paper") return paperStart(p[1]);
  if (p[0] === "paper70") return paperStart("70");
  if (p[0] === "paper69") return paperStart("69");
  if (p[0] === "quicktest") return quickTestStart();
  if (p[0] === "practice-paper") return practicePaper(p[1]);
  if (p[0] === "progress") return progress();
  if (p[0] === "wrong") return wrongPractice();
  home();
}
window.addEventListener("hashchange", route);

/* ---------- home ---------- */
function home() {
  const tv = allVocab().length, known = Object.keys(LS.get("known", {})).length;
  const tq = U.reduce((a, u) => a + u.r.length + u.l.length, 0);
  const res = LS.get("qres", {}); const done = Object.keys(res).length;
  app.innerHTML = `
  <h1>EPS-TOPIK Korean · 2025/2026</h1>
  <p class="sub">Standard Textbook පාඩම් 60ම, හැම වචනයක්ම Sinhala meaning එක්ක, සහ CBT අනුමාන විභාග ප්‍රශ්න පත්‍ර 30+ (1,280+ Q).</p>
  <div class="stats">
    <div class="stat"><b>60</b><span>පාඩම්</span></div>
    <div class="stat"><b>${tv}</b><span>වචන (Sinhala + English)</span></div>
    <div class="stat"><b>32</b><span>CBT Model Papers</span></div>
    <div class="stat"><b>1,280+</b><span>අනුමාන ප්‍රශ්න (Guess Q)</span></div>
    <div class="stat"><b>${known}/${tv}</b><span>ඔයා දන්න වචන</span></div>
    <div class="stat"><b>${done}/${tq}</b><span>Textbook Q practice</span></div>
  </div>

  <div class="card" style="border-left: 4px solid var(--pri);">
    <div class="row" style="margin-bottom:6px;"><span class="tag ok">NEW 2026</span><span class="tag">අනුමාන ප්‍රශ්න පත්‍ර 30+</span></div>
    <h2 style="margin-top:0">CBT අනුමාන ප්‍රශ්න පත්‍ර (Guess Papers 01–30)</h2>
    <p class="sub">EPS-TOPIK CBT ආකෘතියට අනුව Reading 20 + Listening 20 ප්‍රශ්න 40 බැගින් වූ සැබෑ CBT අනුමාන ප්‍රශ්න පත්‍ර 30ක් (ප්‍රශ්න 1,200+) සහ ආදර්ශ විභාග.</p>
    <div class="row">
      <a class="btn" href="#/papers">සියලු Papers 30+ බලන්න →</a>
      <a class="btn ghost" href="#/paper/1">Paper 01 (නිෂ්පාදන)</a>
      <a class="btn ghost" href="#/paper70">Paper 70 (Model Exam)</a>
      <a class="btn ghost" href="#/quicktest">⚡ Quick Test (10 Q)</a>
    </div>
  </div>

  <div class="card">
    <h2 style="margin-top:0">Random Mock Exam (පාඩම් 60න් අහඹු ප්‍රශ්න)</h2>
    <p class="sub">පාඩම් 6-60 අතරින් අහඹු ලෙස තෝරාගත් Reading 20 + Listening 20 ප්‍රශ්න 40ක් සහිත විභාගය.</p>
    <div class="row"><a class="btn" href="#/exam">Mock exam එක පටන් ගන්න</a></div>
  </div>

  <div class="card"><h2 style="margin-top:0">පාඩම් අනුව ඉගෙන ගන්න</h2>
    <p class="sub">පාඩමක් තෝරලා වචන, flashcards, vocab quiz, EPS questions කරන්න.</p>
    <div class="row"><a class="btn" href="#/lessons">පාඩම් 60</a><a class="btn ghost" href="#/vocab">වචන search</a><a class="btn ghost" href="#/quiz/all">Vocab quiz (සියල්ල)</a></div>
  </div>`;
}

/* ---------- lessons ---------- */
function lessons() {
  const known = LS.get("known", {});
  const card = u => {
    const k = u.vocab.filter(v => known[u.n + "|" + v.ko]).length;
    return `<a class="unit" href="#/unit/${u.n}"><b>${u.n}</b> <span class="t ko">${esc(u.ko)}</span>
      <div class="m">${esc(u.en)}</div><div class="m si">${esc(u.si)}</div>
      <div class="m">වචන ${u.vocab.length} · ${u.r.length + u.l.length ? "EPS Q " + (u.r.length + u.l.length) : "—"} · දන්නා ${k}</div></a>`;
  };
  app.innerHTML = `<h1>පාඩම් 60</h1><p class="sub">Book 1 (පාඩම් 1–30) · Book 2 NEW (පාඩම් 31–60)</p>
  <h2>පාඩම් 1–30 · දෛනික ජීවිතය</h2><div class="grid">${U.filter(u => u.n <= 30).map(card).join("")}</div>
  <h2>පාඩම් 31–60 · රැකියා ස්ථානය</h2><div class="grid">${U.filter(u => u.n > 30).map(card).join("")}</div>`;
}

/* ---------- unit ---------- */
function unitPage(n, sub) {
  const u = U[n - 1]; if (!u) return lessons();
  if (sub === "cards") return flashcards(u);
  if (sub === "practice") return practiceUnit(u);
  const rows = u.vocab.map(v => `<tr><td class="k ko">${esc(v.ko)}</td><td class="si">${esc(v.si)}</td><td>${esc(v.en)}</td><td><button class="btn ghost sm" data-say="${esc(v.ko)}">🔊</button></td></tr>`).join("");
  app.innerHTML = `<p><a href="#/lessons">← පාඩම්</a></p>
  <h1><span class="ko">${n}. ${esc(u.ko)}</span></h1><p class="sub">${esc(u.en)}<br><span class="si">${esc(u.si)}</span></p>
  <div class="row">
    <a class="btn" href="#/unit/${n}/cards">Flashcards</a>
    <a class="btn ghost" href="#/quiz/${n}">Vocab quiz</a>
    ${u.r.length ? `<a class="btn ghost" href="#/unit/${n}/practice">EPS-TOPIK practice (10)</a>` : ""}
    ${n > 1 ? `<a class="btn ghost" href="#/unit/${n - 1}">← ${n - 1}</a>` : ""}${n < 60 ? `<a class="btn ghost" href="#/unit/${n + 1}">${n + 1} →</a>` : ""}
  </div>
  <h2>වචන (${u.vocab.length})</h2>
  ${u.vocab.length ? `<div class="card tbl-wrap"><table><thead><tr><th>Korean</th><th>සිංහල</th><th>English</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="sub">මේ පාඩමට වෙනම වචන list එකක් නෑ.</p>`}`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-say]"); if (b) speakWord(b.dataset.say);
});

/* ---------- vocab search ---------- */
function vocabPage() {
  app.innerHTML = `<h1>වචන search</h1><p class="sub">Korean / සිංහල / English ඕනෑම එකකින් search කරන්න.</p>
  <div class="row"><input type="search" id="q" placeholder="search..." autofocus>
  <select id="un"><option value="0">සියලු පාඩම්</option>${U.filter(u => u.vocab.length).map(u => `<option value="${u.n}">${u.n}. ${esc(u.en)}</option>`).join("")}</select></div>
  <div class="card tbl-wrap"><table><thead><tr><th>Korean</th><th>සිංහල</th><th>English</th><th>#</th><th></th></tr></thead><tbody id="rows"></tbody></table></div><p id="cnt" class="sub"></p>`;
  const all = allVocab();
  const draw = () => {
    const q = document.getElementById("q").value.trim().toLowerCase(), un = +document.getElementById("un").value;
    const list = all.filter(v => (!un || v.n === un) && (!q || v.ko.includes(q) || v.si.toLowerCase().includes(q) || v.en.toLowerCase().includes(q)));
    document.getElementById("rows").innerHTML = list.slice(0, 300).map(v => `<tr><td class="k ko">${esc(v.ko)}</td><td class="si">${esc(v.si)}</td><td>${esc(v.en)}</td><td><a href="#/unit/${v.n}">${v.n}</a></td><td><button class="btn ghost sm" data-say="${esc(v.ko)}">🔊</button></td></tr>`).join("");
    document.getElementById("cnt").textContent = list.length + " වචන" + (list.length > 300 ? " (මුල් 300 පෙන්නනවා, search එක පටු කරන්න)" : "");
  };
  document.getElementById("q").oninput = draw; document.getElementById("un").onchange = draw; draw();
}

/* ---------- flashcards ---------- */
function flashcards(u) {
  const known = LS.get("known", {});
  let deck = shuffle(u.vocab.filter(v => !known[u.n + "|" + v.ko])); let i = 0, flip = false;
  if (!u.vocab.length) { app.innerHTML = `<p><a href="#/unit/${u.n}">← back</a></p><p>වචන නෑ.</p>`; return; }
  const draw = () => {
    if (i >= deck.length) { app.innerHTML = `<p><a href="#/unit/${u.n}">← ${u.n}</a></p><div class="card"><h2>🎉 Deck එක ඉවරයි</h2><p>මේ පාඩමේ තව ඉගෙන ගන්න වචන ${u.vocab.filter(v => !LS.get("known", {})[u.n + "|" + v.ko]).length}ක් ඉතුරුයි.</p><a class="btn" href="#/unit/${u.n}/cards" onclick="setTimeout(route,0)">නැවත</a></div>`; return; }
    const v = deck[i];
    app.innerHTML = `<p><a href="#/unit/${u.n}">← ${u.n}. ${esc(u.en)}</a></p><div class="bar"><i style="width:${i / deck.length * 100}%"></i></div>
    <div class="card flash" id="fc">${flip ? `<div class="big si">${esc(v.si)}</div><div class="sub">${esc(v.en)}</div><div class="ko sub">${esc(v.ko)}</div>` : `<div class="big ko">${esc(v.ko)}</div><div class="sub">tap කරන්න</div>`}</div>
    <div class="row"><button class="btn ghost" id="sp">🔊</button><button class="btn ghost" id="no">තවම නෑ</button><button class="btn" id="yes">දන්නවා ✓</button></div><p class="sub">${i + 1} / ${deck.length} (දන්න වචන ඊළඟ වතාවේ ඉවත් වෙනවා)</p>`;
    document.getElementById("fc").onclick = () => { flip = !flip; draw(); };
    document.getElementById("sp").onclick = () => speakWord(v.ko);
    document.getElementById("yes").onclick = () => { const k = LS.get("known", {}); k[u.n + "|" + v.ko] = 1; LS.set("known", k); i++; flip = false; draw(); };
    document.getElementById("no").onclick = () => { i++; flip = false; draw(); };
  };
  draw();
}

/* ---------- vocab quiz ---------- */
function vocabQuiz(which) {
  const pool = which === "all" ? allVocab() : (U[+which - 1] ? U[+which - 1].vocab.map(v => ({ ...v, n: +which })) : []);
  const everything = allVocab().filter(v => v.si);
  const qs = shuffle(pool.filter(v => v.si)).slice(0, 15);
  if (qs.length < 1) { app.innerHTML = "<p>වචන නෑ.</p>"; return; }
  let i = 0, score = 0;
  const draw = () => {
    if (i >= qs.length) {
      app.innerHTML = `<h1>Quiz ඉවරයි</h1><div class="card"><div class="stat"><b>${score} / ${qs.length}</b><span>නිවැරදි</span></div></div><div class="row"><a class="btn" href="#/quiz/${which}" onclick="setTimeout(route,0)">නැවත</a><a class="btn ghost" href="#/lessons">පාඩම්</a></div>`;
      const h = LS.get("vq", []); h.push({ d: Date.now(), s: score, t: qs.length }); LS.set("vq", h.slice(-50)); return;
    }
    const v = qs[i];
    let opts = shuffle(everything.filter(x => x.si !== v.si && x.ko !== v.ko)).slice(0, 3).map(x => x.si); opts.push(v.si); opts = shuffle(opts);
    app.innerHTML = `<p><a href="#/lessons">← පාඩම්</a></p><div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
    <div class="card"><div class="sub">${i + 1} / ${qs.length}</div><div class="big ko" style="font-size:32px;font-weight:700">${esc(v.ko)} <button class="btn ghost sm" data-say="${esc(v.ko)}">🔊</button></div><div class="sub">${esc(v.en)}</div>
    <div class="grid" style="margin-top:12px">${opts.map((o, k) => `<button class="choice si" style="font-size:16px;padding:12px" data-o="${k}">${esc(o)}</button>`).join("")}</div><div id="fb"></div></div>`;
    app.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      const ok = opts[+b.dataset.o] === v.si; if (ok) score++;
      app.querySelectorAll("[data-o]").forEach(x => { x.disabled = true; if (opts[+x.dataset.o] === v.si) x.classList.add("ok"); });
      if (!ok) b.classList.add("bad");
      document.getElementById("fb").innerHTML = `<p><button class="btn" id="nx">ඊළඟ →</button></p>`;
      document.getElementById("nx").onclick = () => { i++; draw(); };
    });
  };
  draw();
}

/* ---------- question rendering ---------- */
const keyOf = (u, sec, q) => `${u}${sec}${q}`;
const cleanSi = s => String(s).split("\n").filter(l => !/^[\d.\s①②③④]*$/.test(l)).join("\n");
function sinBlock(item) {
  let h = "";
  if (item.si && cleanSi(item.si).trim()) h += `<div class="sinbox"><b>සිංහල තේරුම:</b>\n${esc(cleanSi(item.si))}</div>`;
  if (item.script) h += `<div class="script"><b>Listening script:</b>\n${esc(item.script.join("\n"))}</div><p><button class="btn ghost sm" data-play='${esc(JSON.stringify(item.script))}'>🔊 script එක අහන්න</button></p>`;
  if (item.siScript) h += `<div class="sinbox"><b>Script එකේ සිංහල තේරුම:</b>\n${esc(item.siScript)}</div>`;
  return h;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-play]"); if (b) speakLines(JSON.parse(b.dataset.play));
});
function ansText(item) { const t = item.opts && item.opts[item.ans - 1]; return t ? ` · ${esc(t)}` : ""; }

function renderQuestionContent(item) {
  let h = "";
  if (item.title) h += `<div class="qtitle">${esc(item.title)}</div>`;
  if (item.box) h += `<div class="qbox">${esc(item.box)}</div>`;
  if (item.img) h += `<img class="qimg" loading="lazy" src="img/${item.img}" alt="question">`;
  return h;
}

function renderChoicesHtml(item, selectedChoice) {
  const hasText = item.opts && item.opts.some(o => o && String(o).trim());
  if (hasText) {
    return `<div class="choices textual">${[1, 2, 3, 4].map(c => `
      <button class="choice ${selectedChoice === c ? "sel" : ""}" data-c="${c}">
        <span class="cnum">${CIRC[c - 1]}</span>
        <span class="ctxt">${esc(item.opts[c - 1] || "")}</span>
      </button>`).join("")}</div>`;
  }
  return `<div class="choices">${[1, 2, 3, 4].map(c => `
    <button class="choice ${selectedChoice === c ? "sel" : ""}" data-c="${c}">${CIRC[c - 1]}</button>`).join("")}</div>`;
}

/* practice with instant feedback */
function practiceCards(list, backHref, title) {
  app.innerHTML = `<p><a href="${backHref}">← back</a></p><h1>${title}</h1><p class="sub">Answer එක tap කරාම හරිද වැරදිද කියලා, සිංහල තේරුමත් එක්ක පෙන්නනවා.</p>${voiceWarning()}
  ${list.map((x, k) => `<div class="card" data-k="${k}"><div class="row"><span class="tag">${x.sec === "r" ? "Reading" : "Listening"}</span><span class="tag">Q ${x.q}</span>${x.u ? `<span class="tag">${esc(x.u)}</span>` : ""}</div>
    ${x.sec === "l" && x.item.script ? `<p><button class="btn ghost sm" data-play='${esc(JSON.stringify(x.item.script))}'>🔊 audio වාදනය</button></p>` : ""}
    ${renderQuestionContent(x.item)}
    ${renderChoicesHtml(x.item, null)}
    <div class="fb"></div></div>`).join("")}`;
  app.querySelectorAll(".card[data-k]").forEach(card => {
    const x = list[+card.dataset.k]; const fb = card.querySelector(".fb");
    card.querySelectorAll(".choice").forEach(b => b.onclick = () => {
      const c = +b.dataset.c, ok = c === x.item.ans;
      card.querySelectorAll(".choice").forEach(y => { y.disabled = true; if (+y.dataset.c === x.item.ans) y.classList.add("ok"); });
      if (!ok) b.classList.add("bad");
      const res = LS.get("qres", {}); res[keyOf(x.u, x.sec, x.q)] = ok ? 1 : 0; LS.set("qres", res);
      fb.innerHTML = `<p>${ok ? '<span class="tag ok">හරි ✓</span>' : '<span class="tag bad">වැරදියි</span>'} හරි උත්තරය: <b>${CIRC[x.item.ans - 1]}</b>${ansText(x.item)}</p>${sinBlock(x.item)}`;
    });
  });
}
function practiceUnit(u) {
  const list = [...u.r.map((item, i) => ({ item, sec: "r", u: "පාඩම " + u.n, q: i + 1 })), ...u.l.map((item, i) => ({ item, sec: "l", u: "පාඩම " + u.n, q: i + 1 }))];
  practiceCards(list, `#/unit/${u.n}`, `${u.n}. ${esc(u.ko)} · EPS-TOPIK`);
}
function wrongPractice() {
  const res = LS.get("qres", {}); const list = [];
  for (const u of U) for (const sec of "rl") (u[sec] || []).forEach((item, i) => { if (res[keyOf(u.n, sec, i + 1)] === 0) list.push({ item, sec, u: "පාඩම " + u.n, q: i + 1 }); });
  if (!list.length) { app.innerHTML = `<p><a href="#/progress">← back</a></p><p>වැරදුණු questions නෑ 👍</p>`; return; }
  practiceCards(list, "#/progress", "වැරදුණු questions නැවත");
}

/* ---------- exam engine ---------- */
let examTimer = null, EX = null;
const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

function buildMock() {
  const pick = sec => {
    const pool = shuffle(U.flatMap(u => (u[sec] || []).map((item, i) => ({ item, sec, u: u.n, q: i + 1 }))));
    const cnt = {}, out = [];
    for (const x of pool) { if ((cnt[x.u] || 0) >= 1 && out.length < 20) { continue; } cnt[x.u] = (cnt[x.u] || 0) + 1; out.push(x); if (out.length === 20) break; }
    for (const x of pool) { if (out.length >= 20) break; if (!out.includes(x)) out.push(x); }
    return out;
  };
  return [{ name: "Reading (읽기)", sec: "r", min: 25, qs: pick("r") }, { name: "Listening (듣기)", sec: "l", min: 25, qs: pick("l") }];
}
function examStart() {
  app.innerHTML = `<h1>Mock Exam (Random 40 Q)</h1><p class="sub">EPS-TOPIK CBT format: පාඩම් 6–60 න් අහඹු ලෙස තෝරාගත් ප්‍රශ්න 40ක්, ලකුණු 100, විනාඩි 50.</p>
  <div class="card"><table><tr><td>Reading</td><td>20 Q</td><td>විනාඩි 25</td><td>ලකුණු 50</td></tr><tr><td>Listening</td><td>20 Q</td><td>විනාඩි 25</td><td>ලකුණු 50</td></tr></table>
  <p class="sub">Listening වලට audio browser එකේ Korean voice එකෙන් වාදනය වෙනවා (එක question එකකට 2 වතාවක් අහන්න පුළුවන්). Exam එක ඉවර වුණාම හරි උත්තර + සිංහල තේරුම් පෙන්නනවා.</p>${voiceWarning()}
  <button class="btn" id="go">පටන් ගන්න</button></div>`;
  document.getElementById("go").onclick = () => runExam({ title: "Mock Exam", sections: buildMock(), kind: "mock" });
}

function getPaperData(id) {
  const nid = +id;
  if (nid === 70) return (typeof DATA !== "undefined" && DATA.paper70) ? DATA.paper70 : [];
  if (nid === 69) return (typeof DATA !== "undefined" && DATA.paper69) ? DATA.paper69 : [];
  if (typeof window !== "undefined" && window.PAPERS && window.PAPERS[nid]) return window.PAPERS[nid];
  return [];
}

function getPaperMeta(id) {
  const nid = +id;
  if (typeof window !== "undefined" && window.PAPERS_META && window.PAPERS_META[nid]) return window.PAPERS_META[nid];
  if (nid === 70) return {
    id: 70,
    titleKo: "2026 CBT 실전 모의고사 (Paper 70)",
    titleSi: "2026 CBT නව Model Exam",
    descSi: "2026 නව ප්‍රශ්න රටාවට අදාළ උපකරණ, ආරක්ෂක පුවරු, වැටුප් ලේඛන, ප්‍රස්තාර, සහ නීති රීති අඩංගු නව ප්‍රශ්න 40. Reading 20 + Listening 20 (Audio සහිතයි).",
    cat: "2026 Model",
    badge: "2026 NEW"
  };
  if (nid === 69) return {
    id: 69,
    titleKo: "Dream Korean Academy (Paper 69)",
    titleSi: "Dream Korean Academy 2026 අනුමාන පේපර්",
    descSi: "Dream Korean Academy Paper 69 හි Reading 20 සහ Listening 20 ප්‍රශ්න 40ම. සියලු Listening ප්‍රශ්න සඳහාම audio script සහ සිංහල තේරුම් ඇතුළත් කර ඇත.",
    cat: "Dream Korean",
    badge: "DKA 69"
  };
  return {
    id: nid,
    titleKo: `모의고사 ${String(nid).padStart(2, "0")}`,
    titleSi: `අනුමාන Paper ${String(nid).padStart(2, "0")}`,
    descSi: "EPS-TOPIK CBT ආකෘතියේ ප්‍රශ්න 40ක් සහිත අනුමාන ප්‍රශ්න පත්‍රය.",
    cat: "Model Exam",
    badge: `Paper ${nid}`
  };
}

function papersHub() {
  const allIds = [...Array.from({ length: 30 }, (_, i) => i + 1), 70, 69];
  const exams = LS.get("exams", []);
  
  // Find highest score per paper
  const scoreMap = {};
  exams.forEach(e => {
    if (e.kind && e.kind.startsWith("p")) {
      const pid = +e.kind.slice(1);
      if (!scoreMap[pid] || e.score > scoreMap[pid]) {
        scoreMap[pid] = e.score;
      }
    }
  });

  app.innerHTML = `<h1>අනුමාන විභාග ප්‍රශ්න පත්‍ර 30+ (CBT Guess Papers)</h1>
  <p class="sub">EPS-TOPIK 2026 CBT විභාගය සඳහා විශේෂයෙන් සකස් කරන ලද සම්පූර්ණ Model Exam ප්‍රශ්න පත්‍ර 32ක් (Reading 20 + Listening 20 Audio සහිතයි). Passing score 80/100.</p>
  
  <div class="filter-bar">
    <div class="search-box">
      <input type="search" id="paperSearch" placeholder="🔍 Paper අංකය, මාතෘකාව හෝ වචනයක් search කරන්න (e.g. 16, 용접, රක්ෂණ)..." autofocus>
    </div>
  </div>

  <div class="tab-pills" id="paperTabs">
    <button class="tab-pill on" data-tab="all">සියල්ල (32)</button>
    <button class="tab-pill" data-tab="p1_10">Papers 01–10 (කර්මාන්ත)</button>
    <button class="tab-pill" data-tab="p11_20">Papers 11–20 (නීති & රක්ෂණ)</button>
    <button class="tab-pill" data-tab="p21_30">Papers 21–30 (ජීවිතය & සමාජය)</button>
    <button class="tab-pill" data-tab="special">Paper 69 & 70</button>
  </div>

  <div class="grid" id="papersGrid"></div>`;

  let currentTab = "all";
  let currentSearch = "";

  const renderGrid = () => {
    const grid = document.getElementById("papersGrid");
    if (!grid) return;
    
    const filtered = allIds.filter(id => {
      // Tab filter
      if (currentTab === "p1_10" && (id < 1 || id > 10)) return false;
      if (currentTab === "p11_20" && (id < 11 || id > 20)) return false;
      if (currentTab === "p21_30" && (id < 21 || id > 30)) return false;
      if (currentTab === "special" && id !== 69 && id !== 70) return false;
      
      // Search filter
      if (currentSearch) {
        const m = getPaperMeta(id);
        const q = currentSearch.toLowerCase();
        const str = `${id} ${m.titleKo} ${m.titleSi} ${m.descSi || ""} ${m.cat || ""} ${m.badge || ""}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align:center; padding:30px;">
        <p class="sub" style="font-size:16px;">සෙවුමට ගැළපෙන ප්‍රශ්න පත්‍රයක් හමු නොවීය.</p>
        <button class="btn ghost sm" id="resetSearch">සෙවුම ඉවත් කරන්න</button>
      </div>`;
      const btn = document.getElementById("resetSearch");
      if (btn) btn.onclick = () => {
        document.getElementById("paperSearch").value = "";
        currentSearch = "";
        renderGrid();
      };
      return;
    }

    grid.innerHTML = filtered.map(id => {
      const m = getPaperMeta(id);
      const best = scoreMap[id];
      let scoreHtml = "";
      if (best !== undefined) {
        if (best >= 80) scoreHtml = `<span class="score-pill pass">✓ Pass (${best}/100)</span>`;
        else scoreHtml = `<span class="score-pill fail">${best}/100</span>`;
      }
      const pNumStr = id < 10 ? `Paper 0${id}` : `Paper ${id}`;
      return `
      <div class="paper-card">
        <div>
          <div class="row" style="margin-bottom:6px;">
            <span class="tag ${id === 70 ? 'ok' : (id === 69 ? 'warn' : '')} badge">${esc(m.badge || pNumStr)}</span>
            ${m.cat ? `<span class="paper-cat">${esc(m.cat)}</span>` : ""}
          </div>
          ${scoreHtml}
          <h3>${esc(pNumStr)}: ${esc(m.titleKo)}</h3>
          <p><b>${esc(m.titleSi)}</b><br><span style="color:var(--mute)">${esc(m.descSi || "Reading 20 + Listening 20 ප්‍රශ්න 40ක් සහිතයි.")}</span></p>
        </div>
        <div class="row">
          <a class="btn" href="#/paper/${id}">Exam එක (විනාඩි 50)</a>
          <a class="btn ghost sm" href="#/practice-paper/${id}">ක්ෂණික පුහුණුව</a>
        </div>
      </div>`;
    }).join("");
  };

  // Attach tab events
  const tabContainer = document.getElementById("paperTabs");
  if (tabContainer) {
    tabContainer.querySelectorAll(".tab-pill").forEach(btn => {
      btn.onclick = () => {
        tabContainer.querySelectorAll(".tab-pill").forEach(b => b.classList.remove("on"));
        btn.classList.add("on");
        currentTab = btn.dataset.tab;
        renderGrid();
      };
    });
  }

  // Attach search event
  const sInput = document.getElementById("paperSearch");
  if (sInput) {
    sInput.oninput = (e) => {
      currentSearch = e.target.value.trim();
      renderGrid();
    };
  }

  renderGrid();
}

function paperStart(paperId) {
  const pid = +paperId;
  const m = getPaperMeta(pid);
  const qs = getPaperData(pid);

  if (!qs || !qs.length) {
    alert("Paper දත්ත හමු නොවීය.");
    location.hash = "#/papers";
    return;
  }

  const rQs = qs.filter(x => x.sec === "r" || x.q <= 20).map(p => ({ item: p, sec: "r", u: 0, q: p.q }));
  const lQs = qs.filter(x => x.sec === "l" || x.q > 20).map(p => ({ item: p, sec: "l", u: 0, q: p.q }));
  const pNumStr = pid < 10 ? `Paper 0${pid}` : `Paper ${pid}`;

  app.innerHTML = `<h1>${esc(pNumStr)} · ${esc(m.titleKo)}</h1>
  <p class="sub"><b>${esc(m.titleSi)}</b><br>${esc(m.descSi || "")}</p>
  <div class="card">
    <table>
      <tr><td>Reading (읽기)</td><td>${rQs.length} Q</td><td>විනාඩි 25</td><td>ලකුණු 50</td></tr>
      <tr><td>Listening (듣기)</td><td>${lQs.length} Q</td><td>විනාඩි 25</td><td>ලකුණු 50</td></tr>
    </table>
    <p class="sub">මුළු ලකුණු 100යි (ප්‍රශ්නයකට ලකුණු 2.5). Passing marks 80/100. Listening වලට Korean voice audio ස්වයංක්‍රීයව වාදනය වේ (2 වතාවක් අහන්න පුළුවන්). අවසානයේ සියලුම ප්‍රශ්නවලට සිංහල තේරුම් හා නිවැරදි උත්තර ලැබේ.</p>
    ${voiceWarning()}
    <div class="row">
      <button class="btn" id="go">Exam එක පටන් ගන්න (විනාඩි 50)</button>
      <a class="btn ghost" href="#/practice-paper/${pid}">Practice Mode (ක්ෂණික පිළිතුරු)</a>
      <a class="btn ghost" href="#/papers">← සියලු Papers</a>
    </div>
  </div>`;

  document.getElementById("go").onclick = () => runExam({
    title: `${pNumStr} · ${m.titleKo}`,
    kind: "p" + pid,
    sections: [
      { name: "Reading (읽기)", sec: "r", min: 25, qs: rQs },
      { name: "Listening (듣기)", sec: "l", min: 25, qs: lQs }
    ]
  });
}

function quickTestStart() {
  const qs = (typeof DATA !== "undefined" && DATA.quickTest) ? DATA.quickTest : [];
  const rQs = qs.filter((_, i) => i < 5).map((p, i) => ({ item: p, sec: "r", u: 0, q: i + 1 }));
  const lQs = qs.filter((_, i) => i >= 5).map((p, i) => ({ item: p, sec: "l", u: 0, q: i + 6 }));
  app.innerHTML = `<h1>ඉක්මන් අනුමාන පරීක්ෂණය (Quick 10-Question Test)</h1>
  <p class="sub">වෙබ් අඩවියේ විභාග ක්‍රියාකාරීත්වය (Reading, Listening audio, Timer, ලකුණු ගණනය) මිනිත්තු කිහිපයකින් test කිරීමට සකසන ලද විශේෂ අනුමාන ප්‍රශ්න 10කි.</p>
  <div class="card"><table><tr><td>Reading (읽기)</td><td>5 Q</td><td>විනාඩි 6</td><td>ලකුණු 12.5</td></tr><tr><td>Listening (듣기)</td><td>5 Q</td><td>විනාඩි 6</td><td>ලකුණු 12.5</td></tr></table>
  <p class="sub">මුළු ලකුණු 25. ප්‍රශ්න 10 අවසානයේ සම්පූර්ණ ලකුණු සහ සිංහල තේරුම් ලැබේ.</p>${voiceWarning()}
  <button class="btn" id="go">පරීක්ෂණය පටන් ගන්න</button></div>`;
  document.getElementById("go").onclick = () => runExam({
    title: "Quick Guess Test (ප්‍රශ්න 10)",
    kind: "quick",
    sections: [
      { name: "Reading (읽기)", sec: "r", min: 6, qs: rQs },
      { name: "Listening (듣기)", sec: "l", min: 6, qs: lQs }
    ]
  });
}

function practicePaper(paperId) {
  const pid = +paperId;
  const m = getPaperMeta(pid);
  const qs = getPaperData(pid);

  if (!qs || !qs.length) {
    alert("Paper දත්ත හමු නොවීය.");
    location.hash = "#/papers";
    return;
  }

  const pNumStr = pid < 10 ? `Paper 0${pid}` : `Paper ${pid}`;
  const list = qs.map(p => ({
    item: p,
    sec: p.sec || (p.q <= 20 ? "r" : "l"),
    u: pNumStr,
    q: p.q
  }));
  practiceCards(list, "#/papers", `${pNumStr} · ${m.titleSi}`);
}

function runExam(cfg) {
  EX = { cfg, si: 0, qi: 0, ans: cfg.sections.map(s => s.qs.map(() => 0)), plays: cfg.sections.map(s => s.qs.map(() => 0)), end: 0, done: false };
  startSection();
}
function startSection() {
  const s = EX.cfg.sections[EX.si]; EX.qi = 0; EX.end = Date.now() + s.min * 60000;
  clearInterval(examTimer);
  examTimer = setInterval(() => {
    const left = Math.max(0, Math.round((EX.end - Date.now()) / 1000)); const t = document.getElementById("tm"); if (t) t.textContent = fmt(left);
    if (left <= 0) { clearInterval(examTimer); endSection(); }
  }, 500);
  drawExam();
}
function drawExam() {
  const s = EX.cfg.sections[EX.si], q = s.qs[EX.qi], a = EX.ans[EX.si], left = Math.max(0, Math.round((EX.end - Date.now()) / 1000));
  app.innerHTML = `<div class="timer"><span><b>${esc(EX.cfg.title)}</b> · ${esc(s.name)}</span><b id="tm">${fmt(left)}</b></div>
  <div class="qnav">${s.qs.map((_, i) => `<button class="${a[i] ? "done" : ""} ${i === EX.qi ? "cur" : ""}" data-g="${i}">${i + 1}</button>`).join("")}</div>
  <div class="card"><div class="row"><span class="tag">Question ${EX.qi + 1} / ${s.qs.length}</span></div>
    ${s.sec === "l" && q.item.script ? `<p><button class="btn" id="pl">🔊 audio ධාවනය (${EX.plays[EX.si][EX.qi]}/2)</button> <span class="sub">${EX.plays[EX.si][EX.qi] >= 2 ? "2 වතාවක් අහලා ඉවරයි" : ""}</span></p>` : ""}
    ${renderQuestionContent(q.item)}
    ${renderChoicesHtml(q.item, a[EX.qi])}
    <div class="row"><button class="btn ghost" id="pv" ${EX.qi === 0 ? "disabled" : ""}>← Back</button><button class="btn ghost" id="nx" ${EX.qi === s.qs.length - 1 ? "disabled" : ""}>Next →</button><span style="flex:1"></span><button class="btn" id="fin">${EX.si < EX.cfg.sections.length - 1 ? "Reading ඉවරයි → Listening" : "Submit"}</button></div></div>`;
  app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { stopSpeak(); EX.qi = +b.dataset.g; drawExam(); });
  app.querySelectorAll(".choice").forEach(b => b.onclick = () => { a[EX.qi] = +b.dataset.c; drawExam(); });
  document.getElementById("pv").onclick = () => { stopSpeak(); EX.qi--; drawExam(); };
  document.getElementById("nx").onclick = () => { stopSpeak(); EX.qi++; drawExam(); };
  document.getElementById("fin").onclick = () => { const un = a.filter(x => !x).length; if (!un || confirm(`උත්තර නොදුන් questions ${un}ක් තියෙනවා. ඉදිරියට යනවද?`)) endSection(); };
  const pl = document.getElementById("pl");
  if (pl) pl.onclick = () => {
    if (EX.plays[EX.si][EX.qi] >= 2) return; EX.plays[EX.si][EX.qi]++; pl.disabled = true;
    speakLines(q.item.script, () => { const b = document.getElementById("pl"); if (b) { b.disabled = EX.plays[EX.si][EX.qi] >= 2; b.textContent = `🔊 audio ධාවනය (${EX.plays[EX.si][EX.qi]}/2)`; } });
    pl.textContent = `🔊 වාදනය වෙමින්... (${EX.plays[EX.si][EX.qi]}/2)`;
  };
}
function endSection() {
  stopSpeak(); clearInterval(examTimer);
  if (EX.si < EX.cfg.sections.length - 1) {
    EX.si++;
    const nextSec = EX.cfg.sections[EX.si];
    app.innerHTML = `<div class="card"><h2>Listening (듣기) කොටස</h2><p>විනාඩි ${nextSec.min} ක්. Audio එක එක question එකට 2 වතාවක් අහන්න පුළුවන්.</p>${voiceWarning()}<button class="btn" id="go">පටන් ගන්න</button></div>`;
    document.getElementById("go").onclick = startSection;
    return;
  }
  results();
}
function results() {
  const sects = EX.cfg.sections; let total = 0, max = 0; const secScore = [];
  const wrong = LS.get("qres", {});
  const isQuick = EX.cfg.kind === "quick";
  const ptsPerQ = isQuick ? 2.5 : 2.5;

  sects.forEach((s, si) => {
    let c = 0;
    const pts = isQuick ? 12.5 / s.qs.length : 50 / s.qs.length;
    s.qs.forEach((q, i) => {
      const ok = EX.ans[si][i] === q.item.ans;
      if (ok) c++;
      if (q.u) wrong[keyOf(q.u, q.sec, q.q)] = ok ? 1 : 0;
    });
    secScore.push({ name: s.name, c, n: s.qs.length, p: Math.round(c * pts * 10) / 10 });
    total += c * pts;
    max += isQuick ? 12.5 : 50;
  });
  total = Math.round(total * 10) / 10;
  LS.set("qres", wrong);
  const hist = LS.get("exams", []);
  hist.push({ d: Date.now(), kind: EX.cfg.kind, score: total, max: max, parts: secScore.map(x => x.c + "/" + x.n) });
  LS.set("exams", hist.slice(-50));

  let retakeHash = "exam";
  if (EX.cfg.kind === "quick") retakeHash = "quicktest";
  else if (EX.cfg.kind && EX.cfg.kind.startsWith("p")) retakeHash = "paper/" + EX.cfg.kind.slice(1);

  let html = `<h1>ප්‍රතිඵලය</h1><div class="stats"><div class="stat"><b>${total}/${max}</b><span>මුළු ලකුණු</span></div>${secScore.map(x => `<div class="stat"><b>${x.c}/${x.n}</b><span>${esc(x.name)} · ${x.p} pt</span></div>`).join("")}</div>
  <div class="row" style="margin:14px 0">
    <a class="btn" href="#/${retakeHash}" onclick="setTimeout(route,0)">නැවත exam එකක්</a>
    <a class="btn ghost" href="#/papers">අනුමාන Papers ලැයිස්තුව</a>
    <a class="btn ghost" href="#/progress">Progress</a>
  </div>
  <h2>හරි උත්තර + සිංහල තේරුම</h2>`;

  sects.forEach((s, si) => {
    html += `<h3>${esc(s.name)}</h3>`;
    s.qs.forEach((q, i) => {
      const my = EX.ans[si][i], ok = my === q.item.ans;
      html += `<div class="card"><div class="row"><span class="tag">Q${i + 1}</span>${ok ? '<span class="tag ok">හරි ✓</span>' : my ? '<span class="tag bad">වැරදියි</span>' : '<span class="tag warn">උත්තර නැහැ</span>'}${q.u ? `<span class="tag">${esc(q.u)}</span>` : ""}</div>
      ${renderQuestionContent(q.item)}
      <p>ඔයාගේ උත්තරය: <b>${my ? CIRC[my - 1] : "—"}</b> &nbsp; හරි උත්තරය: <b style="color:var(--ok)">${CIRC[q.item.ans - 1]}</b>${ansText(q.item)}</p>${sinBlock(q.item)}</div>`;
    });
  });
  app.innerHTML = html; window.scrollTo(0, 0);
}

/* ---------- progress ---------- */
function progress() {
  const ex = LS.get("exams", []), res = LS.get("qres", {}), known = LS.get("known", {});
  const vals = Object.values(res), good = vals.filter(x => x === 1).length, bad = vals.filter(x => x === 0).length;
  const fmtD = t => new Date(t).toLocaleString();
  const getKindLabel = k => {
    if (k === "quick") return "Quick Test (10 Q)";
    if (k === "mock") return "Mock Exam (Random 40)";
    if (k && k.startsWith("p")) {
      const pid = +k.slice(1);
      const m = getPaperMeta(pid);
      const pNum = pid < 10 ? `0${pid}` : `${pid}`;
      return `Paper ${pNum} · ${m.titleSi || m.titleKo}`;
    }
    return "Mock Exam";
  };
  app.innerHTML = `<h1>Progress</h1>
  <div class="stats"><div class="stat"><b>${Object.keys(known).length}</b><span>දන්න වචන</span></div><div class="stat"><b>${good}</b><span>හරි questions</span></div><div class="stat"><b>${bad}</b><span>වැරදුණු questions</span></div><div class="stat"><b>${ex.length}</b><span>exams කළා</span></div></div>
  <div class="row" style="margin:12px 0">${bad ? `<a class="btn" href="#/wrong">වැරදුණු ${bad} නැවත practice</a>` : ""}<button class="btn ghost" id="rs">Progress reset</button></div>
  <h2>Exam history</h2>${ex.length ? `<div class="card tbl-wrap"><table><thead><tr><th>දිනය</th><th>වර්ගය</th><th>ලකුණු</th><th>කොටස්</th></tr></thead><tbody>${ex.slice().reverse().map(e => `<tr><td>${fmtD(e.d)}</td><td>${esc(getKindLabel(e.kind))}</td><td>${e.score}/${e.max}</td><td>${e.parts.join(" · ")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub">තවම exam කරලා නෑ.</p>`}`;
  document.getElementById("rs").onclick = () => { if (confirm("සියලු progress මකන්නද?")) { ["exams", "qres", "known", "vq"].forEach(k => { try { localStorage.removeItem("eps_" + k); } catch (e) { } }); progress(); } };
}

route();


