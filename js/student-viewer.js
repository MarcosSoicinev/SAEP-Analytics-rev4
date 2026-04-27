/* ============================================================
   SAEP Analytics — student-viewer.js
   Painel de visualização caso a caso com navegação prev/next
   Injeta interface acima do boletim existente (no-print)
============================================================ */

(function () {

/* ---- Injetar estilos do viewer ---- */
function injectViewerStyles() {
    if (document.getElementById('sv-styles')) return;
    const s = document.createElement('style');
    s.id = 'sv-styles';
    s.textContent = `
        /* ===== STUDENT VIEWER ===== */
        #sv-panel {
            margin-bottom: 28px;
        }

        /* Navegação */
        .sv-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .sv-nav-arrows {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .sv-arrow {
            width: 40px; height: 40px;
            border-radius: 12px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            font-size: 1rem;
            transition: 0.2s ease;
        }

        .sv-arrow:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
        .sv-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
        .sv-arrow:disabled:hover { background: var(--surface); color: var(--text); border-color: var(--border); }

        .sv-counter {
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--muted);
            min-width: 80px;
            text-align: center;
        }

        .sv-student-pill {
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 10px 16px;
            flex: 1;
            min-width: 200px;
        }

        .sv-avatar {
            width: 42px; height: 42px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 0.88rem;
            color: #fff;
            flex-shrink: 0;
        }

        .sv-student-name {
            font-size: 1rem;
            font-weight: 800;
            color: var(--text);
            letter-spacing: -0.02em;
        }

        .sv-student-sub {
            font-size: 0.78rem;
            color: var(--muted);
            margin-top: 2px;
        }

        .sv-level-badge {
            margin-left: auto;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 800;
            white-space: nowrap;
        }

        /* Score bar */
        .sv-score-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .sv-score-pct {
            font-size: 2.2rem;
            font-weight: 800;
            letter-spacing: -0.04em;
            min-width: 80px;
        }

        .sv-score-track {
            flex: 1;
            height: 10px;
            background: var(--border);
            border-radius: 999px;
            overflow: hidden;
        }

        .sv-score-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        .sv-kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }

        .sv-kpi {
            background: var(--surface-soft);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 12px 14px;
            text-align: center;
        }

        .sv-kpi-label {
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
            margin-bottom: 4px;
        }

        .sv-kpi-value {
            font-size: 1.4rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            color: var(--text);
        }

        /* Grid de capacidades */
        .sv-cap-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .sv-cap-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            overflow: hidden;
            transition: box-shadow 0.2s;
        }

        .sv-cap-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

        .sv-cap-header {
            padding: 10px 12px 8px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }

        .sv-cap-badge {
            width: 32px; height: 32px;
            border-radius: 10px;
            border: 2px solid currentColor;
            background: var(--surface-soft);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.72rem;
            font-weight: 800;
            flex-shrink: 0;
        }

        .sv-cap-name {
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--text);
            line-height: 1.3;
            flex: 1;
        }

        .sv-cap-pct {
            font-size: 1.1rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            flex-shrink: 0;
        }

        .sv-cap-track {
            height: 5px;
            background: var(--border);
            margin: 0 12px 10px;
            border-radius: 999px;
            overflow: hidden;
        }

        .sv-cap-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.5s ease;
        }

        /* Conhecimentos dentro do card */
        .sv-know-list {
            padding: 0 12px 10px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .sv-know-row {
            display: grid;
            grid-template-columns: 14px 1fr 36px;
            align-items: center;
            gap: 5px;
            font-size: 0.73rem;
        }

        .sv-know-icon {
            font-size: 0.65rem;
            text-align: center;
            font-weight: 800;
        }

        .sv-know-name {
            color: var(--text-2);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .sv-know-pct {
            font-weight: 800;
            text-align: right;
            font-size: 0.72rem;
        }

        .sv-cap-flag {
            margin: 0 12px 10px;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 3px 8px;
            border-radius: 6px;
            display: inline-block;
        }

        /* Diagnóstico */
        .sv-diag {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 16px;
            border-left: 4px solid var(--primary);
        }

        .sv-diag-title {
            font-size: 0.82rem;
            font-weight: 800;
            color: var(--text);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sv-diag-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .sv-diag-item {
            background: var(--surface-soft);
            border-radius: 10px;
            padding: 10px 12px;
        }

        .sv-diag-item-label {
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--muted);
            margin-bottom: 4px;
        }

        .sv-diag-item-value {
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--text);
            line-height: 1.4;
        }

        .sv-diag-text {
            margin-top: 10px;
            font-size: 0.82rem;
            color: var(--text-2);
            line-height: 1.6;
            padding-top: 10px;
            border-top: 1px solid var(--border);
        }

        /* Dropdown customizado */
        .sv-drop-item {
            padding: 10px 16px;
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--text);
            cursor: pointer;
            border-bottom: 1px solid var(--border);
            transition: background 0.15s;
        }
        .sv-drop-item:last-child { border-bottom: none; }
        .sv-drop-item:hover { background: var(--surface-soft); }
        .sv-drop-active {
            background: var(--primary-soft);
            color: var(--primary);
            font-weight: 800;
        }

        /* Scrollbar no dropdown */
        #sv-dropdown::-webkit-scrollbar { width: 6px; }
        #sv-dropdown::-webkit-scrollbar-track { background: var(--surface); border-radius: 999px; }
        #sv-dropdown::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }

        @media (max-width: 760px) {
            .sv-cap-grid { grid-template-columns: 1fr 1fr; }
            .sv-kpi-row { grid-template-columns: repeat(2, 1fr); }
            .sv-diag-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(s);
}

/* ---- Utilitários ---- */
function svColor(perf) {
    if (perf >= 80) return '#16a34a';
    if (perf >= 60) return '#2563eb';
    if (perf >= 40) return '#d97706';
    return '#dc2626';
}

function svLevelBg(level) {
    const m = {
        'Avançado':        { bg: '#dcfce7', color: '#15803d' },
        'Adequado':        { bg: '#dbeafe', color: '#1d4ed8' },
        'Básico':          { bg: '#fef9c3', color: '#854d0e' },
        'Abaixo do Básico':{ bg: '#fee2e2', color: '#b91c1c' },
    };
    return m[level] || { bg: '#f1f5f9', color: '#475569' };
}

function svFlag(perf) {
    if (perf >= 80) return { text: 'Destaque',  bg: '#dcfce7', color: '#15803d' };
    if (perf >= 60) return { text: 'Adequado',  bg: '#dbeafe', color: '#1d4ed8' };
    if (perf >= 40) return { text: 'Atenção',   bg: '#fef9c3', color: '#854d0e' };
    return                  { text: 'Crítico',   bg: '#fee2e2', color: '#b91c1c' };
}

function svInitials(name) {
    const p = name.split(' ').filter(Boolean);
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0]?.slice(0,2) || '--').toUpperCase();
}

/* ---- Constrói o painel ---- */
function buildViewerPanel(students) {
    let idx = 0;

    // Cria container
    const panel = document.createElement('div');
    panel.id = 'sv-panel';
    panel.className = 'no-print';

    // Injeta antes do boletimPrintArea (ou do studentHeader)
    const anchor = document.getElementById('boletimPrintArea') ||
                   document.getElementById('studentHeader');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor);
    else document.querySelector('main')?.appendChild(panel);

    function render(s) {
        const saepLevel  = getStudentSaepLevel(s);
        const levelColor = getLevelColor(saepLevel);
        const levelStyle = svLevelBg(saepLevel);
        const capPerf    = calculateStudentCapacityPerformance(s.nome);
        const knowPerf   = calculateStudentKnowledgePerformance ?
                           calculateStudentKnowledgePerformance(s.nome) :
                           { labels: [], values: [] };

        const total  = (s.acertos || 0) + (s.erros || 0);
        const desemp = Number(s.desempenho || 0).toFixed(1);

        // Extremos de capacidade
        let bestCap = '--', worstCap = '--';
        if (capPerf.labels.length) {
            const maxI = capPerf.values.indexOf(Math.max(...capPerf.values));
            const minI = capPerf.values.indexOf(Math.min(...capPerf.values));
            bestCap  = `${capPerf.labels[maxI]} — ${getCapacityDisplayName(capPerf.labels[maxI])} (${capPerf.values[maxI]}%)`;
            worstCap = `${capPerf.labels[minI]} — ${getCapacityDisplayName(capPerf.labels[minI])} (${capPerf.values[minI]}%)`;
        }

        // Encaminhamento pedagógico
        const guidance = capPerf.labels.length
            ? (getCapacityPedagogicalGuidance
                ? getCapacityPedagogicalGuidance(capPerf.labels[capPerf.values.indexOf(Math.min(...capPerf.values))])
                : 'Reforço direcionado nas capacidades de menor desempenho.')
            : 'Sem dados suficientes.';

        // Cards de capacidade
        const capCards = capPerf.labels.map((cap, i) => {
            const perf  = capPerf.values[i];
            const color = svColor(perf);
            const flag  = svFlag(perf);

            // Conhecimentos desta capacidade
            const recs = ApplicationState.answerRecords.filter(
                r => r.aluno === s.nome && r.cap === cap && r.conhecimento
            );
            const knowMap = {};
            recs.forEach(r => {
                if (!knowMap[r.conhecimento]) knowMap[r.conhecimento] = { ac: 0, tot: 0 };
                knowMap[r.conhecimento].tot++;
                if (r.acertou) knowMap[r.conhecimento].ac++;
            });

            const knowRows = Object.entries(knowMap)
                .sort((a, b) => (b[1].ac/b[1].tot) - (a[1].ac/a[1].tot))
                .slice(0, 5)
                .map(([name, m]) => {
                    const p   = Math.round((m.ac / m.tot) * 100);
                    const c   = svColor(p);
                    const ico = m.ac === m.tot ? '✓' : p === 0 ? '✗' : '~';
                    const icoC = m.ac === m.tot ? '#16a34a' : p === 0 ? '#dc2626' : '#d97706';
                    const sn  = name.length > 28 ? name.slice(0,26)+'…' : name;
                    return `
                        <div class="sv-know-row">
                            <span class="sv-know-icon" style="color:${icoC}">${ico}</span>
                            <span class="sv-know-name">${sn}</span>
                            <span class="sv-know-pct" style="color:${c}">${p}%</span>
                        </div>`;
                }).join('');

            return `
                <div class="sv-cap-card">
                    <div class="sv-cap-header">
                        <div class="sv-cap-badge" style="color:${color}">${cap}</div>
                        <span class="sv-cap-name">${getCapacityDisplayName(cap)}</span>
                        <span class="sv-cap-pct" style="color:${color}">${perf}%</span>
                    </div>
                    <div class="sv-cap-track">
                        <div class="sv-cap-fill" style="width:${perf}%;background:${color}"></div>
                    </div>
                    <div class="sv-know-list">${knowRows || '<span style="font-size:0.7rem;color:var(--muted)">Sem registros</span>'}</div>
                    <span class="sv-cap-flag" style="background:${flag.bg};color:${flag.color}">${flag.text}</span>
                </div>`;
        }).join('');

        panel.innerHTML = `
            <!-- Navegação -->
            <div class="sv-nav">
                <div class="sv-nav-arrows">
                    <button class="sv-arrow" id="sv-prev" ${idx === 0 ? 'disabled' : ''} title="Aluno anterior">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <span class="sv-counter">${idx + 1} / ${students.length}</span>
                    <button class="sv-arrow" id="sv-next" ${idx === students.length - 1 ? 'disabled' : ''} title="Próximo aluno">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>

                <div class="sv-student-pill">
                    <div class="sv-avatar" style="background:${levelColor}">${svInitials(s.nome)}</div>
                    <div style="flex:1;min-width:0;position:relative;">
                        <div id="sv-selector-btn" style="
                            font-size:1rem;font-weight:800;color:var(--text);
                            cursor:pointer;display:flex;align-items:center;gap:6px;">
                            <span id="sv-selector-label">${s.nome}</span>
                            <i class="fa-solid fa-chevron-down" style="font-size:0.7rem;color:var(--muted);"></i>
                        </div>
                        <div class="sv-student-sub">
                            Mat. ${s.matricula || '--'} &nbsp;·&nbsp; ${total} questões
                        </div>
                        <!-- Dropdown customizado -->
                        <div id="sv-dropdown" style="
                            display:none;position:absolute;top:calc(100% + 8px);left:-16px;
                            background:var(--surface);border:1px solid var(--border);
                            border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.25);
                            z-index:999;min-width:320px;max-height:320px;overflow-y:auto;">
                            ${students.map((st,i) => `
                                <div class="sv-drop-item ${i===idx?'sv-drop-active':''}" data-idx="${i}">
                                    ${st.nome}
                                </div>`).join('')}
                        </div>
                    </div>
                    <span class="sv-level-badge" style="background:${levelStyle.bg};color:${levelStyle.color}">
                        ${saepLevel}
                    </span>
                </div>
            </div>

            <!-- Score + KPIs -->
            <div class="saep-card section-card" style="margin-bottom:14px;">
                <div class="sv-score-row">
                    <span class="sv-score-pct" style="color:${levelColor}">${desemp}%</span>
                    <div class="sv-score-track">
                        <div class="sv-score-fill" style="width:${desemp}%;background:${levelColor}"></div>
                    </div>
                </div>
                <div class="sv-kpi-row">
                    <div class="sv-kpi">
                        <div class="sv-kpi-label">Acertos</div>
                        <div class="sv-kpi-value" style="color:#16a34a">${s.acertos || 0}</div>
                    </div>
                    <div class="sv-kpi">
                        <div class="sv-kpi-label">Erros</div>
                        <div class="sv-kpi-value" style="color:#dc2626">${s.erros || 0}</div>
                    </div>
                    <div class="sv-kpi">
                        <div class="sv-kpi-label">Total</div>
                        <div class="sv-kpi-value">${total || '--'}</div>
                    </div>
                    <div class="sv-kpi">
                        <div class="sv-kpi-label">Tempo</div>
                        <div class="sv-kpi-value" style="font-size:1rem">${s.tempo || '--'}</div>
                    </div>
                </div>
            </div>

            <!-- Cards de capacidade -->
            <div class="sv-cap-grid">${capCards}</div>

            <!-- Diagnóstico pedagógico limpo -->
            <div class="sv-diag" style="border-left-color:${levelColor}">
                <div class="sv-diag-title">
                    <i class="fa-solid fa-lightbulb" style="color:${levelColor}"></i>
                    Diagnóstico Pedagógico
                </div>
                <div class="sv-diag-grid">
                    <div class="sv-diag-item">
                        <div class="sv-diag-item-label">🏆 Capacidade mais forte</div>
                        <div class="sv-diag-item-value" id="sv-best-cap">--</div>
                    </div>
                    <div class="sv-diag-item">
                        <div class="sv-diag-item-label">⚠️ Precisa de atenção</div>
                        <div class="sv-diag-item-value" id="sv-worst-cap">--</div>
                    </div>
                    <div class="sv-diag-item">
                        <div class="sv-diag-item-label">✅ Melhor conhecimento</div>
                        <div class="sv-diag-item-value" id="sv-best-know">--</div>
                    </div>
                    <div class="sv-diag-item">
                        <div class="sv-diag-item-label">📌 Conhecimento crítico</div>
                        <div class="sv-diag-item-value" id="sv-worst-know">--</div>
                    </div>
                </div>
                <div class="sv-diag-text" id="sv-diag-text">--</div>
            </div>
        `;

        // Preenche diagnóstico com dados calculados diretamente
        function syncDiag() {
            // Capacidades
            if (capPerf.labels.length) {
                const maxI = capPerf.values.indexOf(Math.max(...capPerf.values));
                const minI = capPerf.values.indexOf(Math.min(...capPerf.values));

                const bestEl  = document.getElementById('sv-best-cap');
                const worstEl = document.getElementById('sv-worst-cap');
                if (bestEl)  bestEl.innerHTML  = `<span style="color:var(--success);font-weight:800;">${capPerf.labels[maxI]}</span> — ${getCapacityDisplayName(capPerf.labels[maxI])} <span style="color:var(--success);font-weight:800;">(${capPerf.values[maxI]}%)</span>`;
                if (worstEl) worstEl.innerHTML = `<span style="color:var(--danger);font-weight:800;">${capPerf.labels[minI]}</span> — ${getCapacityDisplayName(capPerf.labels[minI])} <span style="color:var(--danger);font-weight:800;">(${capPerf.values[minI]}%)</span>`;
            }

            // Conhecimentos
            const knowMap2 = {};
            ApplicationState.answerRecords
                .filter(r => r.aluno === s.nome && r.conhecimento)
                .forEach(r => {
                    if (!knowMap2[r.conhecimento]) knowMap2[r.conhecimento] = { ac: 0, tot: 0 };
                    knowMap2[r.conhecimento].tot++;
                    if (r.acertou) knowMap2[r.conhecimento].ac++;
                });
            const knowEntries = Object.entries(knowMap2)
                .map(([k, v]) => ({ name: k, pct: Math.round((v.ac/v.tot)*100) }))
                .sort((a, b) => b.pct - a.pct);

            if (knowEntries.length) {
                const bestK  = knowEntries[0];
                const worstK = knowEntries[knowEntries.length - 1];
                const bkEl = document.getElementById('sv-best-know');
                const wkEl = document.getElementById('sv-worst-know');
                if (bkEl)  bkEl.innerHTML  = `${bestK.name}  <span style="color:var(--success);font-weight:800;">(${bestK.pct}%)</span>`;
                if (wkEl)  wkEl.innerHTML  = `${worstK.name} <span style="color:var(--danger);font-weight:800;">(${worstK.pct}%)</span>`;
            }

            // Texto de encaminhamento e estratégia
            const worstCapCode = capPerf.labels.length
                ? capPerf.labels[capPerf.values.indexOf(Math.min(...capPerf.values))]
                : null;
            const guidance = worstCapCode && typeof getCapacityPedagogicalGuidance === 'function'
                ? getCapacityPedagogicalGuidance(worstCapCode)
                : 'Reforço direcionado nas capacidades de menor desempenho.';

            const strategies = {
                'Avançado':         'Propor atividades de ampliação, problemas desafiadores e aplicações integradoras para consolidar autonomia.',
                'Adequado':         'Reforçar pontos de menor desempenho com atividades direcionadas e manter desafios graduais.',
                'Básico':           'Retomada orientada dos conteúdos essenciais, com exercícios progressivos e mediação próxima.',
                'Abaixo do Básico': 'Retomada dos fundamentos, atividades guiadas e acompanhamento contínuo com foco em pequenas evoluções.',
            };
            const strategy = strategies[saepLevel] || strategies['Básico'];

            const textEl = document.getElementById('sv-diag-text');
            if (textEl) textEl.innerHTML = `
                <strong>Encaminhamento prioritário:</strong> ${guidance}<br><br>
                <strong>Estratégia recomendada:</strong> ${strategy}
            `;
        }
        setTimeout(syncDiag, 120);

        // Dropdown customizado de aluno
        const selectorBtn = document.getElementById('sv-selector-btn');
        const dropdown    = document.getElementById('sv-dropdown');

        selectorBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            if (dropdown) dropdown.style.display = 'none';
        }, { once: false });

        dropdown?.querySelectorAll('.sv-drop-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                idx = parseInt(item.dataset.idx);
                dropdown.style.display = 'none';
                const s2 = students[idx];
                renderSelectedStudent(s2);
                ApplicationState.selectedStudent = s2;
                const sel = document.getElementById('studentSelector');
                if (sel) sel.value = s2.nome;
                render(s2);
            });
        });

        // Eventos de navegação
        document.getElementById('sv-prev')?.addEventListener('click', () => {
            if (idx > 0) {
                idx--;
                const s2 = students[idx];
                renderSelectedStudent(s2);
                ApplicationState.selectedStudent = s2;
                const sel = document.getElementById('studentSelector');
                if (sel) sel.value = s2.nome;
                render(s2);
            }
        });

        document.getElementById('sv-next')?.addEventListener('click', () => {
            if (idx < students.length - 1) {
                idx++;
                const s2 = students[idx];
                renderSelectedStudent(s2);
                ApplicationState.selectedStudent = s2;
                const sel = document.getElementById('studentSelector');
                if (sel) sel.value = s2.nome;
                render(s2);
            }
        });
    }

    // Sincroniza com o selector existente
    const sel = document.getElementById('studentSelector');
    if (sel) {
        sel.addEventListener('change', () => {
            const s2 = students.find(s => s.nome === sel.value);
            if (s2) {
                idx = students.indexOf(s2);
                render(s2);
            }
        });
    }

    // Renderiza o primeiro aluno
    if (students.length > 0) render(students[0]);
}

/* ---- Boot ---- */
function initStudentViewer() {
    const students = getOrderedStudentsByName ? getOrderedStudentsByName() : [];
    if (!students.length) return;
    injectViewerStyles();
    buildViewerPanel(students);
}

// Aguarda o app inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initStudentViewer, 300));
} else {
    setTimeout(initStudentViewer, 300);
}

})();
