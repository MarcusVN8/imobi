/* =====================================================================
   ui-forms.js — Modais/Formulários genéricos + confirmação + toast.
   Dá vida aos botões Adicionar/Editar/Excluir de forma enxuta:
   cada página declara os campos e o helper monta o form.
   ===================================================================== */
window.Forms = (function () {
  // Toast de feedback
  function toast(msg, kind) {
    let host = document.getElementById('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:90;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    const cor = kind === 'erro' ? 'var(--danger)' : (kind === 'ok' ? 'var(--success)' : 'var(--primary)');
    el.style.cssText = 'background:var(--card);border:1px solid var(--border);border-left:4px solid ' + cor +
      ';box-shadow:var(--shadow-elevated);padding:12px 16px;border-radius:12px;font-size:14px;max-width:340px;animation:fadeUp .25s ease;';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3200);
  }

  // Modal genérico de formulário
  // fields: [{key, label, type:'text|number|date|select|textarea', options:[{value,label}], required, placeholder}]
  function openForm(title, fields, initial, onSave, opts) {
    opts = opts || {};
    initial = initial || {};
    let scrim = document.createElement('div');
    scrim.className = 'scrim show';

    const body = fields.map(function (f) {
      const val = initial[f.key] != null ? initial[f.key] : '';
      let control;
      if (f.type === 'select') {
        const opts = (f.options || []).map(function (o) {
          return '<option value="' + o.value + '"' + (String(val) === String(o.value) ? ' selected' : '') + '>' + (o.label || o.value) + '</option>';
        }).join('');
        control = '<select class="field full select" data-key="' + f.key + '">' + opts + '</select>';
      } else if (f.type === 'textarea') {
        control = '<textarea class="field full" data-key="' + f.key + '" rows="3" placeholder="' + (f.placeholder || '') + '">' + val + '</textarea>';
      } else {
        const t = f.type === 'number' ? 'number' : (f.type === 'date' ? 'date' : 'text');
        const step = f.type === 'number' ? ' step="0.01"' : '';
        control = '<input class="field full" data-key="' + f.key + '" type="' + t + '"' + step +
          ' value="' + (typeof val === 'number' ? val : String(val).replace(/"/g, '&quot;')) + '" placeholder="' + (f.placeholder || '') + '">';
      }
      return '<label style="display:block;margin-bottom:14px;"><span class="hint" style="display:block;margin-bottom:6px;">' +
        f.label + (f.required ? ' <span style="color:var(--danger)">*</span>' : '') + '</span>' + control + '</label>';
    }).join('');

    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:91;display:grid;place-items:center;padding:16px;';
    box.innerHTML =
      '<div class="card card--pad-lg" style="width:min(520px,100%);max-height:90vh;overflow:auto;">' +
        '<div class="flex justify-between items-center" style="margin-bottom:16px;">' +
          '<h3 class="card-title">' + title + '</h3>' +
          '<button class="icon-btn" data-close>' + window.Icon("X", 20) + '</button>' +
        '</div>' +
        '<form id="frm">' + body +
          '<div class="flex justify-between gap-12" style="margin-top:8px;">' +
            (opts.del ? '<button type="button" class="btn btn--danger" data-del>' + window.Icon("Trash", 16) + 'Excluir</button>' : '<span></span>') +
            '<div class="flex gap-12">' +
              '<button type="button" class="btn btn--ghost" data-close>Cancelar</button>' +
              '<button type="submit" class="btn btn--primary">Salvar</button>' +
            '</div>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(scrim);
    document.body.appendChild(box);

    function close() { scrim.remove(); box.remove(); }
    box.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    scrim.addEventListener('click', close);
    const delBtn = box.querySelector('[data-del]');
    if (delBtn && opts.onDelete) delBtn.addEventListener('click', async function () {
      if (!confirm('Excluir este item?')) return;
      try { await opts.onDelete(); close(); } catch (err) { toast('Erro: ' + err.message, 'erro'); }
    });

    box.querySelector('#frm').addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {};
      let ok = true;
      fields.forEach(function (f) {
        const el = box.querySelector('[data-key="' + f.key + '"]');
        let v = el.value;
        if (f.type === 'number') v = v === '' ? null : Number(v);
        if (f.required && (v === '' || v == null)) { ok = false; el.style.borderColor = 'var(--danger)'; }
        payload[f.key] = v;
      });
      if (!ok) { toast('Preencha os campos obrigatórios.', 'erro'); return; }
      try {
        await onSave(payload);
        close();
      } catch (err) {
        toast('Erro: ' + err.message, 'erro');
      }
    });
  }

  // Confirmação de exclusão
  function confirmDelete(msg, onYes) {
    let scrim = document.createElement('div');
    scrim.className = 'scrim show';
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:91;display:grid;place-items:center;padding:16px;';
    box.innerHTML =
      '<div class="card card--pad-lg" style="width:min(420px,100%);">' +
        '<div class="flex items-center gap-12" style="margin-bottom:12px;color:var(--danger);">' + window.Icon("AlertCircle", 22) + '<h3 class="card-title">Confirmar exclusão</h3></div>' +
        '<p class="muted" style="font-size:14px;margin-bottom:18px;">' + msg + '</p>' +
        '<div class="flex justify-between gap-12">' +
          '<button class="btn btn--ghost" data-no>Cancelar</button>' +
          '<button class="btn" style="background:var(--danger);color:#fff;" data-yes>Excluir</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(scrim); document.body.appendChild(box);
    function close() { scrim.remove(); box.remove(); }
    box.querySelector('[data-no]').addEventListener('click', close);
    scrim.addEventListener('click', close);
    box.querySelector('[data-yes]').addEventListener('click', async function () {
      try { await onYes(); close(); } catch (e) { toast('Erro: ' + e.message, 'erro'); }
    });
  }

  return { toast, openForm, confirmDelete };
})();
