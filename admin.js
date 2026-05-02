// ─── FIREBASE CONFIG — SUBSTITUA PELOS SEUS DADOS ────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, deleteDoc, doc, getDocs, writeBatch }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAh_5E7to23fnjoMQ6P7TjLZnWAyuYviRk",
  authDomain:        "cadastro-ibnt.firebaseapp.com",
  projectId:         "cadastro-ibnt",
  storageBucket:     "cadastro-ibnt.firebasestorage.app",
  messagingSenderId: "160859899460",
  appId:             "1:160859899460:web:fe2f57486a439751561e11"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── SENHA ADMIN ──────────────────────────────────────────
// Troque para a senha que você quiser
const SENHA_ADMIN = 'Jesus#é#bom#';

// ─── TELEGRAM CONFIG ──────────────────────────────────────
const TG_TOKEN = '8461460512:AAEYeZc5ZHufXzG3MabchHw7B3cnzb-QZxY'; // cole seu token novo aqui
const TG_CHAT  = '8736295268';
const TG_CTRL  = 'tg_enviados_hoje';

// ─── VARIÁVEIS GLOBAIS ────────────────────────────────────
let todosMembros = [];

// ─── LOGIN ────────────────────────────────────────────────
window.fazerLogin = function() {
  const senha = document.getElementById('senha').value;
  const wrap  = document.getElementById('f-senha');
  if (senha === SENHA_ADMIN) {
    wrap.classList.remove('has-error');
    sessionStorage.setItem('admin_logado', '1');
    document.getElementById('login-section').style.display  = 'none';
    document.getElementById('painel-section').style.display = 'block';
    iniciarPainel();
  } else {
    wrap.classList.add('has-error');
  }
};

window.sair = function() {
  sessionStorage.removeItem('admin_logado');
  document.getElementById('painel-section').style.display = 'none';
  document.getElementById('login-section').style.display  = 'block';
  document.getElementById('senha').value = '';
};

// Verifica se já está logado
if (sessionStorage.getItem('admin_logado') === '1') {
  document.getElementById('login-section').style.display  = 'none';
  document.getElementById('painel-section').style.display = 'block';
  iniciarPainel();
}

// ─── INICIAR PAINEL ───────────────────────────────────────
function iniciarPainel() {
  onSnapshot(collection(db, 'membros'), (snapshot) => {
    todosMembros = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Ordena por nome
    todosMembros.sort((a, b) => a.nome.localeCompare(b.nome));
    renderizar(todosMembros);
    checarAniversarios(todosMembros);
  });
}

// ─── ANIVERSÁRIO ──────────────────────────────────────────
function ehAniversario(nasc) {
  if (!nasc) return false;
  const hoje = new Date();
  const dn = new Date(nasc + 'T00:00:00');
  return dn.getMonth() === hoje.getMonth() && dn.getDate() === hoje.getDate();
}

// ─── TELEGRAM ─────────────────────────────────────────────
function jaEnviouHoje(id) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  try {
    const ctrl = JSON.parse(localStorage.getItem(TG_CTRL)) || {};
    return ctrl[id] === hoje;
  } catch { return false; }
}

function marcarEnviado(id) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  try {
    const ctrl = JSON.parse(localStorage.getItem(TG_CTRL)) || {};
    ctrl[id] = hoje;
    localStorage.setItem(TG_CTRL, JSON.stringify(ctrl));
  } catch {}
}

async function enviarTelegram(m) {
  if (jaEnviouHoje(m.id)) return;
  const texto =
    `🎂 *Aniversário hoje!*\n\n` +
    `🙏 Hoje é aniversário de *${m.nome}*!\n` +
    `📅 Nascimento: ${fmtData(m.nasc)}\n` +
    `⛪ Função: ${m.funcao}\n` +
    `📞 Celular: ${m.cel1}\n\n` +
    `Não esqueça de parabenizar! 🎉`;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: texto, parse_mode: 'Markdown' })
    });
    if (res.ok) marcarEnviado(m.id);
  } catch (e) {
    console.error('Erro Telegram:', e);
  }
}

function checarAniversarios(lista) {
  const aniversariantes = lista.filter(m => ehAniversario(m.nasc));
  const statBday = document.getElementById('stat-bday');
  const bdayCount = document.getElementById('bday-count');
  if (aniversariantes.length) {
    statBday.style.display = 'block';
    bdayCount.textContent = aniversariantes.length;
    aniversariantes.forEach(m => enviarTelegram(m));
  } else {
    statBday.style.display = 'none';
  }
}

// ─── FORMATA DATA ─────────────────────────────────────────
function fmtData(str) {
  if (!str) return '-';
  const [a, m, d] = str.split('-');
  return `${d}/${m}/${a}`;
}

function fmtDateTime(ts) {
  if (!ts) return '-';
  const dt = ts.toDate ? ts.toDate() : new Date(ts);
  return dt.toLocaleDateString('pt-BR') + ' às ' +
    dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── EXCLUIR ──────────────────────────────────────────────
window.excluir = async function(id) {
  if (!confirm('Remover este membro?')) return;
  try {
    await deleteDoc(doc(db, 'membros', id));
    showToast('Membro removido.', 'success');
  } catch (e) {
    showToast('Erro ao remover.', 'error');
  }
};

// ─── LIMPAR TUDO ──────────────────────────────────────────
window.limparTudo = async function() {
  if (!todosMembros.length) { showToast('Nenhum membro cadastrado.', 'error'); return; }
  if (!confirm('Apagar TODOS os membros? Essa ação não pode ser desfeita.')) return;
  try {
    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, 'membros'));
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    showToast('Todos os membros foram removidos.', 'success');
  } catch (e) {
    showToast('Erro ao limpar.', 'error');
  }
};

// ─── FILTRAR/BUSCAR ───────────────────────────────────────
window.filtrar = function() {
  const termo = document.getElementById('busca').value.toLowerCase();
  const filtrados = todosMembros.filter(m =>
    m.nome.toLowerCase().includes(termo) ||
    (m.funcao && m.funcao.toLowerCase().includes(termo)) ||
    (m.cel1 && m.cel1.includes(termo))
  );
  renderizar(filtrados);
};

// ─── RENDERIZAR ───────────────────────────────────────────
function renderizar(lista) {
  const el = document.getElementById('lista-admin');
  document.getElementById('total-count').textContent = todosMembros.length;

  if (!lista.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><div>Nenhum membro encontrado.</div></div>`;
    return;
  }

  el.innerHTML = lista.map(m => {
    const bday    = ehAniversario(m.nasc);
    const enviado = jaEnviouHoje(m.id);
    const bdayBanner = bday
      ? `<div class="bday-banner">🎂 Aniversariante hoje! ${enviado ? '<span class="tg-badge">✈️ Telegram enviado</span>' : ''}</div>`
      : '';
    return `
      <div class="member-card ${bday ? 'aniversario' : ''}">
        <button class="del-btn" onclick="excluir('${m.id}')" title="Remover">✕</button>
        ${bdayBanner}
        <div class="member-name">${esc(m.nome)}</div>
        <div class="member-info">
          📅 <strong>${fmtData(m.nasc)}</strong> &nbsp;|&nbsp; ${m.idade} anos &nbsp;|&nbsp; ${m.genero}<br>
          📞 <strong>${m.cel1}</strong>${m.cel2 ? ' / ' + m.cel2 : ''}<br>
          ⛪ ${m.funcao} &nbsp;|&nbsp; 💍 ${m.civil}
        </div>
        <div class="registered-time">⏱ Cadastrado em: ${fmtDateTime(m.cadastradoEm)}</div>
      </div>`;
  }).join('');
}

// ─── HELPERS ──────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

let toastTimer;
function showToast(msg, tipo = '') {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast ${tipo}`;
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
