// Arkadaşla oynanan oyunlar 7: Bisiklet Yarışı 3D (aynı parkurda en iyi süre kazanır)
// board: "süre0|süre1" (onda bir saniye, -1 = henüz yarışmadı). s: parkur numarası (tohum)
import { bikeGame } from "./bike3d.js?v=1";

const other = (g, me) => (g.x === me ? g.o : g.x);
function endMsg(c) {
  const g = c.g;
  if (g.winner === "draw") return "Berabere!";
  if (g.winner === c.me) return "Kazandın! 🎉";
  return "Kaybettin. " + c.name + " kazandı.";
}
const bp = (b) => { const p = (b || "-1|-1").split("|").map(Number); return [isNaN(p[0]) ? -1 : p[0], isNaN(p[1]) ? -1 : p[1]]; };
const fmt = (t) => (t / 10).toFixed(1) + " sn";
let bk = null;

const bike = {
  icon: "🚴", label: "Bisiklet Yarışı 3D",
  intro: (n) => n + " ile Bisiklet Yarışı oynamak için davet gönder. İkiniz de aynı parkuru sırayla sürersiniz, hangisi daha kısa sürede bitirirse o kazanır. Aynı anda oynamak zorunda değilsiniz.",
  start: () => ({ board: "-1|-1", s: String(1 + Math.floor(Math.random() * 90000)), turn: "" }),
  needs: (g, me) => { if (g.status !== "play") return false; const p = bp(g.board); return p[g.x === me ? 0 : 1] < 0; },
  render(c) {
    const g = c.g, me = c.me, iX = g.x === me, p = bp(g.board);
    const mine = p[iX ? 0 : 1], theirs = p[iX ? 1 : 0];
    if (g.status !== "play") return endMsg(c) + "  Sen: " + fmt(mine) + " – " + c.name + ": " + fmt(theirs);
    if (mine >= 0) return "Süren: " + fmt(mine) + ". " + c.name + " yarışınca sonuç belli olur.";
    const key = g.s + "|" + me + "|" + g.board;
    if (!(bk && bk.key === key && !bk.inst.dead)) {
      if (bk) bk.inst.destroy();
      const seed = parseInt(g.s, 10) || 1;
      const inst = bikeGame({
        el: c.el, act: (label, fn) => { const b = c.el("button", "", label); b.type = "button"; b.onclick = fn; return b; },
        level: 3, seed: seed, theme: seed % 6, len: 190000, rivals: false,
        onFinish: (r) => {
          c.tx((d) => {
            const q = bp(d.board), idx = d.x === me ? 0 : 1;
            if (d.status !== "play" || q[idx] >= 0) return null;
            q[idx] = r.t;
            const o = { board: q[0] + "|" + q[1] };
            if (q[0] >= 0 && q[1] >= 0) { o.status = "done"; o.turn = ""; o.winner = q[0] === q[1] ? "draw" : (q[0] < q[1] ? d.x : d.o); }
            return o;
          });
        }
      });
      bk = { key: key, inst: inst };
    }
    c.body.appendChild(bk.inst.root);
    return "Dokun ve yarışı başlat, bitiş çizgisine en kısa sürede ulaş! " + (theirs >= 0 ? c.name + " yarıştı, sıra sende." : "");
  }
};

export const PAIR = { bike: bike };
