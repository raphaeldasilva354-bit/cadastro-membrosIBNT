// ─── FIREBASE CONFIG — SUBSTITUA PELOS SEUS DADOS ────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
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

// ─── MÁSCARA CELULAR ──────────────────────────────────────
window.mascara = function(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
  else if (v.length > 0) v = `(${v}`;
  el.value = v;
};

// ─── IDADE AUTOMÁTICA ─────────────────────────────────────
window.autoIdade = function() {
  const nasc = document.getElementById('nasc').value;
  if (!nasc) return;
  const hoje = new Date();
  const dn = new Date(nasc + 'T00:00:00');
  let idade = hoje.getFullYear() - dn.getFullYear();
  const m = hoje.getMonth() - dn.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dn.getDate())) idade--;
  if (idade >= 0) document.getElementById('idade').value = idade;
};

// ─── VALIDAÇÃO ────────────────────────────────────────────
function validar() {
  let ok = true;
  const campos = [
    { id: 'nome',   fid: 'f-nome',   val: v => v.trim() !== '' },
    { id: 'nasc',   fid: 'f-nasc',   val: v => v !== '' },
    { id: 'idade',  fid: 'f-idade',  val: v => v !== '' && +v >= 0 && +v <= 120 },
    { id: 'genero', fid: 'f-genero', val: v => v !== '' },
    { id: 'cel1',   fid: 'f-cel1',   val: v => /^\(\d{2}\) \d{5}-\d{4}$/.test(v) },
    { id: 'funcao', fid: 'f-funcao', val: v => v.trim() !== '' },
    { id: 'civil',  fid: 'f-civil',  val: v => v !== '' },
  ];
  campos.forEach(c => {
    const el = document.getElementById(c.id);
    const wrap = document.getElementById(c.fid);
    if (wrap && !c.val(el.value)) {
      wrap.classList.add('has-error');
      ok = false;
    } else if (wrap) {
      wrap.classList.remove('has-error');
    }
  });
  return ok;
}

// ─── CADASTRAR ────────────────────────────────────────────
window.cadastrar = async function() {
  if (!validar()) return;

  const btn = document.getElementById('btn-cadastrar');
  const txt = document.getElementById('btn-text');
  btn.disabled = true;
  txt.textContent = '⏳ Enviando...';

  const membro = {
    nome:        document.getElementById('nome').value.trim(),
    nasc:        document.getElementById('nasc').value,
    idade:       parseInt(document.getElementById('idade').value),
    genero:      document.getElementById('genero').value,
    cel1:        document.getElementById('cel1').value,
    cel2:        document.getElementById('cel2').value || null,
    funcao:      document.getElementById('funcao').value.trim(),
    civil:       document.getElementById('civil').value,
    cadastradoEm: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'membros'), membro);
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('confirm-section').style.display = 'block';
  } catch (e) {
    console.error(e);
    alert('Erro ao cadastrar. Verifique sua conexão e tente novamente.');
    btn.disabled = false;
    txt.textContent = '✅ Realizar Cadastro';
  }
};

// ─── NOVO CADASTRO ────────────────────────────────────────
window.novoCadastro = function() {
  ['nome','nasc','idade','genero','cel1','cel2','funcao','civil'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['f-nome','f-nasc','f-idade','f-genero','f-cel1','f-funcao','f-civil'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('has-error');
  });
  const btn = document.getElementById('btn-cadastrar');
  const txt = document.getElementById('btn-text');
  btn.disabled = false;
  txt.textContent = '✅ Realizar Cadastro';
  document.getElementById('confirm-section').style.display = 'none';
  document.getElementById('form-section').style.display = 'block';
};
