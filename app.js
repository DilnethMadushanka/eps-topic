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
  document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#/" + p[0]));
  window.scrollTo(0, 0);
  if (p[0] === "") return home();
  if (p[0] === "lessons") return lessons();
  if (p[0] === "unit") return unitPage(+p[1], p[2]);
  if (p[0] === "vocab") return vocabPage();
  if (p[0] === "quiz") return vocabQuiz(p[1]);
  if (p[0] === "exam") return examStart();
  if (p[0] === "paper69") return paperStart();
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
  <h1>EPS-TOPIK Korean · 2025</h1>
  <p class="sub">Standard Textbook පාඩම් 60ම, හැම වචනයක්ම Sinhala meaning එක්ක, සහ exam එක වගේම mock paper.</p>
  <div class="stats">
    <div class="stat"><b>60</b><span>පාඩම්</span></div>
    <div class="stat"><b>${tv}</b><span>වචන (Sinhala + English)</span></div>
    <div class="stat"><b>${tq}</b><span>EPS-TOPIK practice questions</span></div>
    <div class="stat"><b>${known}/${tv}</b><span>ඔයා දන්න වචන</span></div>
    <div class="stat"><b>${done}/${tq}</b><span>practice කරපු questions</span></div>
  </div>
  <div class="card"><h2 style="margin-top:0">Mock Exam (සැබෑ exam එක වගේ)</h2>
    <p class="sub">40 questions · Reading 20 (විනාඩි 25) + Listening 20 (විනාඩි 25) · ලකුණු 100 (එකකට 2.5). අවසානයේ හරි උත්තරත්, හැම question එකකම Sinhala තේරුමත් පෙන්නනවා.</p>
    <div class="row"><a class="btn" href="#/exam">Mock exam එක පටන් ගන්න</a><a class="btn ghost" href="#/paper69">Paper 69 (Reading)</a></div></div>
  <div class="card"><h2 style="margin-top:0">පාඩම් අනුව ඉගෙන ගන්න</h2>
    <p class="sub">පාඩමක් තෝරලා වචන, flashcards, vocab quiz, EPS questions කරන්න.</p>
    <div class="row"><a class="btn" href="#/lessons">පාඩම් 60</a><a class="btn ghost" href="#/vocab">වචන search</a><a class="btn ghost" href="#/quiz/all">Vocab quiz (සියල්ල)</a></div></div>`;
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

/* practice with instant feedback */
function practiceCards(list, backHref, title) {
  app.innerHTML = `<p><a href="${backHref}">← back</a></p><h1>${title}</h1><p class="sub">Answer එක tap කරාම හරිද වැරදිද කියලා, සිංහල තේරුමත් එක්ක පෙන්නනවා.</p>${voiceWarning()}
  ${list.map((x, k) => `<div class="card" data-k="${k}"><div class="row"><span class="tag">${x.sec === "r" ? "Reading" : "Listening"}</span><span class="tag">පාඩම ${x.u}</span></div>
    ${x.sec === "l" ? `<p><button class="btn ghost sm" data-play='${esc(JSON.stringify(x.item.script))}'>🔊 audio</button></p>` : ""}
    <img class="qimg" loading="lazy" src="img/${x.item.img}" alt="question">
    <div class="choices">${[1, 2, 3, 4].map(c => `<button class="choice" data-c="${c}">${CIRC[c - 1]}</button>`).join("")}</div><div class="fb"></div></div>`).join("")}`;
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
  const list = [...u.r.map((item, i) => ({ item, sec: "r", u: u.n, q: i + 1 })), ...u.l.map((item, i) => ({ item, sec: "l", u: u.n, q: i + 1 }))];
  practiceCards(list, `#/unit/${u.n}`, `${u.n}. ${esc(u.ko)} · EPS-TOPIK`);
}
function wrongPractice() {
  const res = LS.get("qres", {}); const list = [];
  for (const u of U) for (const sec of "rl") (u[sec] || []).forEach((item, i) => { if (res[keyOf(u.n, sec, i + 1)] === 0) list.push({ item, sec, u: u.n, q: i + 1 }); });
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
  app.innerHTML = `<h1>Mock Exam</h1><p class="sub">EPS-TOPIK (2024+ CBT format): 40 questions, ලකුණු 100, විනාඩි 50.</p>
  <div class="card"><table><tr><td>Reading</td><td>20 Q</td><td>විනාඩි 25</td><td>ලකුණු 50</td></tr><tr><td>Listening</td><td>20 Q</td><td>විනාඩි 25</td><td>ලකුණු 50</td></tr></table>
  <p class="sub">Question paper එකේ පාඩම් 6–60 වල EPS-TOPIK questions අහඹු ලෙස තෝරනවා. Listening වලට audio browser එකේ Korean voice එකෙන් වාදනය වෙනවා (එක question එකකට 2 වතාවක් වගේ අහන්න පුළුවන්). Exam එක ඉවර වුණාම හරි උත්තර + සිංහල තේරුම් පෙන්නනවා.</p>${voiceWarning()}
  <button class="btn" id="go">පටන් ගන්න</button></div>`;
  document.getElementById("go").onclick = () => runExam({ title: "Mock Exam", sections: buildMock(), kind: "mock" });
}
function paperStart() {
  app.innerHTML = `<h1>Paper 69 (Reading 1–20)</h1><p class="sub">ඔයා දුන්න "Dream Korean Academy – EPS 2026 Paper 69" එකේ Reading questions 20. විනාඩි 25.</p>
  <div class="note">මේ PDF එකේ answer key එකක් තිබුණේ නෑ. හරි උත්තර මම (AI) විසඳලා දාපු ඒවා - ගුරුවරයෙකුගෙන් confirm කරගන්න. Q21–40 (Listening) වලට audio / script නැති නිසා ඇතුළත් කළේ නෑ. Q1 (ඔවන්/toaster oven) වගේ picture questions වල උත්තරය 1-2 ක් ගැටලු සහගත වෙන්න පුළුවන්.</div>
  <div class="card"><button class="btn" id="go">පටන් ගන්න</button></div>`;
  document.getElementById("go").onclick = () => runExam({ title: "Paper 69 · Reading", kind: "p69", sections: [{ name: "Reading (읽기)", sec: "r", min: 25, qs: DATA.paper69.map(p => ({ item: { img: p.img, ans: p.ans, si: p.si, opts: [] }, sec: "r", u: 0, q: p.q })) }] });
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
  const pts = 50 / s.qs.length;
  app.innerHTML = `<div class="timer"><span><b>${esc(EX.cfg.title)}</b> · ${esc(s.name)}</span><b id="tm">${fmt(left)}</b></div>
  <div class="qnav">${s.qs.map((_, i) => `<button class="${a[i] ? "done" : ""} ${i === EX.qi ? "cur" : ""}" data-g="${i}">${i + 1}</button>`).join("")}</div>
  <div class="card"><div class="row"><span class="tag">Question ${EX.qi + 1} / ${s.qs.length}</span></div>
    ${s.sec === "l" ? `<p><button class="btn" id="pl">🔊 audio ධාවනය (${EX.plays[EX.si][EX.qi]}/2)</button> <span class="sub">${EX.plays[EX.si][EX.qi] >= 2 ? "2 වතාවක් අහලා ඉවරයි" : ""}</span></p>` : ""}
    <img class="qimg" src="img/${q.item.img}" alt="question ${EX.qi + 1}">
    <div class="choices">${[1, 2, 3, 4].map(c => `<button class="choice ${a[EX.qi] === c ? "sel" : ""}" data-c="${c}">${CIRC[c - 1]}</button>`).join("")}</div>
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
  if (EX.si < EX.cfg.sections.length - 1) { EX.si++; app.innerHTML = `<div class="card"><h2>Listening කොටස</h2><p>විනාඩි 25 ක්. Audio එක එක question එකට 2 වතාවක් අහන්න පුළුවන්.</p>${voiceWarning()}<button class="btn" id="go">පටන් ගන්න</button></div>`; document.getElementById("go").onclick = startSection; return; }
  results();
}
function results() {
  const sects = EX.cfg.sections; let total = 0, max = 0; const secScore = [];
  const wrong = LS.get("qres", {});
  sects.forEach((s, si) => {
    const pts = 50 / s.qs.length; let c = 0;
    s.qs.forEach((q, i) => { const ok = EX.ans[si][i] === q.item.ans; if (ok) c++; if (q.u) wrong[keyOf(q.u, q.sec, q.q)] = ok ? 1 : 0; });
    secScore.push({ name: s.name, c, n: s.qs.length, p: c * pts }); total += c * pts; max += 50;
  });
  LS.set("qres", wrong);
  const hist = LS.get("exams", []); hist.push({ d: Date.now(), kind: EX.cfg.kind, score: total, max: sects.length === 1 ? 50 : 100, parts: secScore.map(x => x.c + "/" + x.n) }); LS.set("exams", hist.slice(-50));
  const shownMax = sects.length === 1 ? 50 : 100;
  let html = `<h1>ප්‍රතිඵලය</h1><div class="stats"><div class="stat"><b>${total}/${shownMax}</b><span>මුළු ලකුණු</span></div>${secScore.map(x => `<div class="stat"><b>${x.c}/${x.n}</b><span>${esc(x.name)} · ${x.p}</span></div>`).join("")}</div>
  ${EX.cfg.kind === "p69" ? `<div class="note">මේ paper එකේ උත්තර AI විසඳපු ඒවා - confirm කරගන්න.</div>` : ""}
  <div class="row" style="margin:14px 0"><a class="btn" href="#/${EX.cfg.kind === "p69" ? "paper69" : "exam"}" onclick="setTimeout(route,0)">නැවත exam එකක්</a><a class="btn ghost" href="#/progress">Progress</a></div>
  <h2>හරි උත්තර + සිංහල තේරුම</h2>`;
  sects.forEach((s, si) => {
    html += `<h3>${esc(s.name)}</h3>`;
    s.qs.forEach((q, i) => {
      const my = EX.ans[si][i], ok = my === q.item.ans;
      html += `<div class="card"><div class="row"><span class="tag">Q${i + 1}</span>${ok ? '<span class="tag ok">හරි ✓</span>' : my ? '<span class="tag bad">වැරදියි</span>' : '<span class="tag warn">උත්තර නැහැ</span>'}${q.u ? `<a class="tag" href="#/unit/${q.u}">පාඩම ${q.u}</a>` : ""}</div>
      <img class="qimg" loading="lazy" src="img/${q.item.img}" alt="">
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
  app.innerHTML = `<h1>Progress</h1>
  <div class="stats"><div class="stat"><b>${Object.keys(known).length}</b><span>දන්න වචන</span></div><div class="stat"><b>${good}</b><span>හරි questions</span></div><div class="stat"><b>${bad}</b><span>වැරදුණු questions</span></div><div class="stat"><b>${ex.length}</b><span>exams කළා</span></div></div>
  <div class="row" style="margin:12px 0">${bad ? `<a class="btn" href="#/wrong">වැරදුණු ${bad} නැවත practice</a>` : ""}<button class="btn ghost" id="rs">Progress reset</button></div>
  <h2>Exam history</h2>${ex.length ? `<div class="card tbl-wrap"><table><thead><tr><th>දිනය</th><th>වර්ගය</th><th>ලකුණු</th><th>කොටස්</th></tr></thead><tbody>${ex.slice().reverse().map(e => `<tr><td>${fmtD(e.d)}</td><td>${e.kind === "p69" ? "Paper 69" : "Mock"}</td><td>${e.score}/${e.max}</td><td>${e.parts.join(" · ")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub">තවම exam කරලා නෑ.</p>`}`;
  document.getElementById("rs").onclick = () => { if (confirm("සියලු progress මකන්නද?")) { ["exams", "qres", "known", "vq"].forEach(k => { try { localStorage.removeItem("eps_" + k); } catch (e) { } }); progress(); } };
}

route();

