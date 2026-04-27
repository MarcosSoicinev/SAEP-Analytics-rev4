/* ============================================================
   SAEP Analytics — analise-ui.js
   Responsável por toda a lógica e renderização da página
   de Análise Profunda (analise.html).
   Depende de: state.js, saep-service.js, utils.js
============================================================ */

let analyseDistChart = null;
let analyseCapChart = null;

/* ================================================
   UTILITÁRIOS LOCAIS
================================================ */

function getPerformanceColor(performance) {
    if (performance < 40) return '#ef4444';
    if (performance < 60) return '#eab308';
    if (performance < 80) return '#3b82f6';
    return '#22c55e';
}

function getPerformanceTag(performance) {
    if (performance < 40) return { label: 'Crítico',  css: 'critico'  };
    if (performance < 60) return { label: 'Abaixo',   css: 'abaixo'   };
    if (performance < 80) return { label: 'Adequado', css: 'adequado' };
    return                       { label: 'Excelente',css: 'excelente' };
}

function getHeatColor(performance) {
    if (performance < 40) return { bg: '#fecaca', text: '#991b1b' };
    if (performance < 60) return { bg: '#fde68a', text: '#92400e' };
    if (performance < 80) return { bg: '#bfdbfe', text: '#1e3a8a' };
    return                       { bg: '#bbf7d0', text: '#14532d' };
}

function buildAnalyseKpis(studentSummaries) {
    const total = studentSummaries.length;
    const performances = studentSummaries.map(s => Number(s.desempenho) || 0);
    const average = performances.reduce((a, b) => a + b, 0) / total;
    const criticalCount = performances.filter(p => p < 40).length;
    const approvedCount = performances.filter(p => p >= 60).length;
    const best = Math.max(...performances);
    const worst = Math.min(...performances);

    return { total, average, criticalCount, approvedCount, best, worst };
}

/* ================================================
   BLOCO 1: KPIs rápidos
================================================ */

function renderAnalyseKpis(kpis) {
    setTextContentIfElementExists('ap-media',     `${kpis.average.toFixed(1)}%`);
    setTextContentIfElementExists('ap-total',     kpis.total);
    setTextContentIfElementExists('ap-criticos',  kpis.criticalCount);
    setTextContentIfElementExists('ap-aprovacao', `${((kpis.approvedCount / kpis.total) * 100).toFixed(0)}%`);
    setTextContentIfElementExists('ap-melhor',    `${kpis.best.toFixed(1)}%`);
    setTextContentIfElementExists('ap-pior',      `${kpis.worst.toFixed(1)}%`);
}

/* ================================================
   BLOCO 2: Radar de risco
================================================ */

function renderRiskBanner(kpis) {
    const banner = getElementByIdOrNull('ap-riskBanner');
    if (!banner) return;

    if (kpis.criticalCount === 0) {
        banner.style.display = 'none';
        return;
    }

    const pctRisk = (((kpis.criticalCount + (kpis.total - kpis.approvedCount - kpis.criticalCount)) / kpis.total) * 100).toFixed(0);

    banner.style.display = 'flex';
    banner.className = 'ap-risk-banner';
    banner.innerHTML = `
        <i class="fa-solid fa-circle-exclamation" style="color:#dc2626; font-size:1.1rem; flex-shrink:0;"></i>
        <div class="ap-risk-banner-text">
            <b>${kpis.criticalCount} aluno(s) crítico(s)</b> (abaixo de 40%) e
            <b>${kpis.total - kpis.approvedCount} abaixo do básico</b> no total.
            Intervenção recomendada para <b>${pctRisk}%</b> da turma.
        </div>
    `;
}

function renderRiskList(studentSummaries) {
    const list = getElementByIdOrNull('ap-riskList');
    if (!list) return;

    const sorted = [...studentSummaries].sort((a, b) => a.desempenho - b.desempenho);

    list.innerHTML = sorted.map(student => {
        const perf = Number(student.desempenho) || 0;
        const cor  = getPerformanceColor(perf);
        const tag  = getPerformanceTag(perf);
        const nomeCurto = student.nome.split(' ').slice(0, 3).join(' ');

        return `
            <div class="ap-risk-item ${tag.css}">
                <span class="ap-risk-name">${nomeCurto}</span>
                <div class="ap-risk-bar-wrap">
                    <div class="ap-risk-bar" style="width:${perf}%; background:${cor};"></div>
                </div>
                <span class="ap-risk-pct" style="color:${cor};">${perf.toFixed(1)}%</span>
                <span class="ap-risk-tag ${tag.css}">${tag.label}</span>
            </div>
        `;
    }).join('');
}

/* ================================================
   BLOCO 3: Distribuição (gráfico + legenda)
================================================ */

function renderDistribution(studentSummaries) {
    const counts = { critico: 0, abaixo: 0, adequado: 0, excelente: 0 };

    studentSummaries.forEach(student => {
        const perf = Number(student.desempenho) || 0;
        if (perf < 40)       counts.critico++;
        else if (perf < 60)  counts.abaixo++;
        else if (perf < 80)  counts.adequado++;
        else                 counts.excelente++;
    });

    const canvas = getElementByIdOrNull('ap-distChart');
    if (canvas) {
        if (analyseDistChart) analyseDistChart.destroy();
        analyseDistChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Crítico (<40%)', 'Abaixo (40–59%)', 'Adequado (60–79%)', 'Excelente (≥80%)'],
                datasets: [{
                    data: [counts.critico, counts.abaixo, counts.adequado, counts.excelente],
                    backgroundColor: ['#ef4444', '#eab308', '#3b82f6', '#22c55e'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { display: false } }
            }
        });
    }

    const legend = getElementByIdOrNull('ap-distLegend');
    if (!legend) return;

    const total = studentSummaries.length;
    const items = [
        { label: 'Crítico (<40%)',    count: counts.critico,   cor: '#ef4444', textCor: '#dc2626'  },
        { label: 'Abaixo (40–59%)',   count: counts.abaixo,    cor: '#eab308', textCor: '#ca8a04'  },
        { label: 'Adequado (60–79%)', count: counts.adequado,  cor: '#3b82f6', textCor: '#2563eb'  },
        { label: 'Excelente (≥80%)',  count: counts.excelente, cor: '#22c55e', textCor: '#16a34a'  },
    ];

    legend.innerHTML = items.map(item => `
        <div class="ap-dist-row">
            <span class="ap-dist-dot" style="background:${item.cor};"></span>
            <span class="ap-dist-label">${item.label}</span>
            <span class="ap-dist-value" style="color:${item.textCor};">
                ${item.count} aluno(s) · ${((item.count / total) * 100).toFixed(1)}%
            </span>
        </div>
    `).join('');
}

/* ================================================
   BLOCO 4: Mapa de calor aluno × capacidade
================================================ */

function renderHeatmap(classroomAnalysis) {
    const table = getElementByIdOrNull('ap-heatmapTable');
    if (!table) return;

    const { sortedCapacityCodes, studentCapacityPerformance } = classroomAnalysis;
    const students = [...ApplicationState.studentSummaries]
        .sort((a, b) => a.desempenho - b.desempenho);

    if (!sortedCapacityCodes.length) {
        table.innerHTML = '<tr><td style="padding:20px;color:var(--muted);">Sem dados de capacidade disponíveis.</td></tr>';
        return;
    }

    // Largura fixa por coluna para garantir alinhamento
    const CAP_COL_WIDTH = '72px';
    const TOTAL_COL_WIDTH = '68px';

    const colGroup = `
        <colgroup>
            <col style="min-width:160px;">
            ${sortedCapacityCodes.map(() => `<col style="width:${CAP_COL_WIDTH}; min-width:${CAP_COL_WIDTH};">`).join('')}
            <col style="width:${TOTAL_COL_WIDTH}; min-width:${TOTAL_COL_WIDTH};">
        </colgroup>
    `;

    const capHeaders = sortedCapacityCodes.map(code => {
        const avg = calculateCapacityClassAverage(code, classroomAnalysis);
        const { bg, text } = getHeatColor(avg);
        return `<th class="ap-heatmap-th" style="width:${CAP_COL_WIDTH}; text-align:center;" title="${getCapacityDisplayName(code)}">
            ${code}<br>
            <small style="font-weight:700; color:${text}; background:${bg}; padding:1px 5px; border-radius:4px; display:inline-block; margin-top:2px;">${avg}%</small>
        </th>`;
    }).join('');

    let html = colGroup + `
        <thead>
            <tr>
                <th class="ap-heatmap-th" style="text-align:left; padding-left:4px;">Aluno</th>
                ${capHeaders}
                <th class="ap-heatmap-th" style="width:${TOTAL_COL_WIDTH}; text-align:center;">Total</th>
            </tr>
        </thead>
        <tbody>
    `;

    students.forEach(student => {
        const totalPerf = Number(student.desempenho) || 0;
        const { bg: totalBg, text: totalText } = getHeatColor(totalPerf);

        const cells = sortedCapacityCodes.map(code => {
            const metrics = studentCapacityPerformance[student.nome]?.[code];
            const perf = metrics && metrics.total > 0
                ? Number(((metrics.acertos / metrics.total) * 100).toFixed(0))
                : null;

            if (perf === null) {
                return `<td style="text-align:center; padding:5px 4px; border-bottom:1px solid var(--border);">
                    <div class="ap-heat-cell" style="background:#f1f5f9; color:#94a3b8; margin:0 auto;">—</div>
                </td>`;
            }

            const { bg, text } = getHeatColor(perf);
            return `<td style="text-align:center; padding:5px 4px; border-bottom:1px solid var(--border);">
                <div class="ap-heat-cell" style="background:${bg}; color:${text}; margin:0 auto;">${perf}%</div>
            </td>`;
        }).join('');

        const nomeCurto = student.nome.split(' ').slice(0, 2).join(' ');
        html += `
            <tr>
                <td style="padding:5px 4px; border-bottom:1px solid var(--border); font-size:0.82rem; font-weight:600; color:var(--text-2); white-space:nowrap;">${nomeCurto}</td>
                ${cells}
                <td style="text-align:center; padding:5px 4px; border-bottom:1px solid var(--border);">
                    <div class="ap-heat-cell" style="background:${totalBg}; color:${totalText}; font-weight:800; margin:0 auto;">${totalPerf.toFixed(0)}%</div>
                </td>
            </tr>
        `;
    });

    // Linha de média
    const avgCells = sortedCapacityCodes.map(code => {
        const avg = calculateCapacityClassAverage(code, classroomAnalysis);
        const { bg, text } = getHeatColor(avg);
        return `<td style="text-align:center; padding:5px 4px; border-bottom:1px solid var(--border);">
            <div class="ap-heat-cell" style="background:${bg}; color:${text}; font-weight:800; margin:0 auto;">${avg}%</div>
        </td>`;
    }).join('');

    const totalAvg = ApplicationState.studentSummaries.reduce((acc, s) => acc + (Number(s.desempenho) || 0), 0) / ApplicationState.studentSummaries.length;
    const { bg: avgBg, text: avgText } = getHeatColor(totalAvg);

    html += `
        <tr style="background:var(--surface-soft);">
            <td style="padding:6px 4px; font-size:0.82rem; font-weight:800; color:var(--text);">Média turma</td>
            ${avgCells}
            <td style="text-align:center; padding:5px 4px;">
                <div class="ap-heat-cell" style="background:${avgBg}; color:${avgText}; font-weight:800; margin:0 auto;">${totalAvg.toFixed(1)}%</div>
            </td>
        </tr>
    `;

    html += '</tbody>';
    table.innerHTML = html;
}

function calculateCapacityClassAverage(capacityCode, classroomAnalysis) {
    const metrics = classroomAnalysis.performanceByCapacity[capacityCode];
    if (!metrics || metrics.total === 0) return 0;
    return Number(((metrics.acertos / metrics.total) * 100).toFixed(1));
}

/* ================================================
   BLOCO 5: Conhecimentos ordenados
================================================ */

function renderKnowledgeDeep(classroomAnalysis) {
    const container = getElementByIdOrNull('ap-knowledgeList');
    if (!container) return;

    const entries = buildKnowledgePerformanceEntries(classroomAnalysis)
        .sort((a, b) => a.performance - b.performance);

    if (!entries.length) {
        container.innerHTML = '<p style="color:var(--muted); font-size:0.9rem;">Nenhum conhecimento disponível.</p>';
        return;
    }

    container.innerHTML = entries.map(entry => {
        const cor = getPerformanceColor(entry.performance);
        const isCritical = entry.performance < 40;
        return `
            <div class="ap-knowledge-item">
                <span class="ap-knowledge-name" style="${isCritical ? 'color:#dc2626; font-weight:700;' : ''}">
                    ${isCritical ? '⚠ ' : ''}${entry.knowledgeName}
                </span>
                <div class="ap-knowledge-bar-wrap">
                    <div class="ap-knowledge-bar" style="width:${entry.performance}%; background:${cor};"></div>
                </div>
                <span class="ap-knowledge-pct" style="color:${cor};">${entry.performance}%</span>
            </div>
        `;
    }).join('');
}

/* ================================================
   BLOCO 6: Gráfico de capacidades
================================================ */

function renderCapacityChart(classroomAnalysis) {
    const canvas = getElementByIdOrNull('ap-capChart');
    if (!canvas) return;

    const { sortedCapacityCodes, performanceByCapacity } = classroomAnalysis;

    const labels = sortedCapacityCodes.map(code => getCapacityDisplayName(code));
    const values = sortedCapacityCodes.map(code => {
        const m = performanceByCapacity[code];
        return m && m.total > 0 ? Number(((m.acertos / m.total) * 100).toFixed(1)) : 0;
    });
    const colors = values.map(v => getPerformanceColor(v));

    if (analyseCapChart) analyseCapChart.destroy();
    analyseCapChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Desempenho (%)',
                data: values,
                backgroundColor: colors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    min: 0, max: 100,
                    ticks: { callback: v => `${v}%` }
                }
            }
        }
    });
}

/* ================================================
   BLOCO 7: Clusters pedagógicos
================================================ */

function buildClusters(studentSummaries) {
    const groups = {
        excelente: { label: 'Excelente (≥80%)',    css: 'excelente', cor: '#22c55e', bgCor: '#f0fdf4', borderCor: '#86efac', acao: 'Propor atividades de aprofundamento. Pode atuar como par pedagógico.',       alunos: [] },
        adequado:  { label: 'Adequado (60–79%)',   css: 'adequado',  cor: '#3b82f6', bgCor: '#eff6ff', borderCor: '#93c5fd', acao: 'Reforço nos pontos de menor desempenho com atividades progressivas.',         alunos: [] },
        abaixo:    { label: 'Abaixo (40–59%)',     css: 'abaixo',    cor: '#eab308', bgCor: '#fffbeb', borderCor: '#fde68a', acao: 'Retomada sistemática dos conteúdos essenciais com mediação próxima.',         alunos: [] },
        critico:   { label: 'Crítico (<40%)',      css: 'critico',   cor: '#ef4444', bgCor: '#fef2f2', borderCor: '#fca5a5', acao: 'Intervenção imediata. Acompanhamento individual e retomada dos fundamentos.', alunos: [] },
    };

    studentSummaries.forEach(student => {
        const perf = Number(student.desempenho) || 0;
        const nomeCurto = student.nome.split(' ').slice(0, 3).join(' ');
        if (perf >= 80)      groups.excelente.alunos.push(nomeCurto);
        else if (perf >= 60) groups.adequado.alunos.push(nomeCurto);
        else if (perf >= 40) groups.abaixo.alunos.push(nomeCurto);
        else                 groups.critico.alunos.push(nomeCurto);
    });

    return Object.values(groups).filter(g => g.alunos.length > 0);
}

function renderClusters(studentSummaries) {
    const grid = getElementByIdOrNull('ap-clusterGrid');
    if (!grid) return;

    const clusters = buildClusters(studentSummaries);

    grid.innerHTML = clusters.map(cluster => {
        const avgPerf = studentSummaries
            .filter(s => {
                const p = Number(s.desempenho) || 0;
                if (cluster.css === 'excelente') return p >= 80;
                if (cluster.css === 'adequado')  return p >= 60 && p < 80;
                if (cluster.css === 'abaixo')    return p >= 40 && p < 60;
                return p < 40;
            })
            .reduce((acc, s, _, arr) => acc + (Number(s.desempenho) || 0) / arr.length, 0);

        return `
            <div class="ap-cluster-card ap-cluster-${cluster.css}">
                <div class="ap-cluster-title" style="color:${cluster.cor};">${cluster.label}</div>
                <div class="ap-cluster-count">${cluster.alunos.length} aluno(s) · Média: ${avgPerf.toFixed(1)}%</div>
                <div class="ap-cluster-names">${cluster.alunos.join(' · ')}</div>
                <div class="ap-cluster-action" style="border-left-color:${cluster.cor};">${cluster.acao}</div>
            </div>
        `;
    }).join('');
}

/* ================================================
   BLOCO 8: Plano de ação automático
================================================ */

function buildActionPlan(studentSummaries, classroomAnalysis) {
    const actions = [];
    const kpis = buildAnalyseKpis(studentSummaries);

    // Ação 1: alunos críticos
    if (kpis.criticalCount > 0) {
        const criticos = studentSummaries
            .filter(s => (Number(s.desempenho) || 0) < 40)
            .map(s => s.nome.split(' ').slice(0, 2).join(' '))
            .join(', ');

        actions.push({
            prioridade: 1, corP: '#dc2626', bgP: '#fee2e2',
            titulo: `Intervenção imediata — ${kpis.criticalCount} aluno(s) crítico(s)`,
            desc: `${criticos} estão abaixo de 40%. Necessitam de atendimento individual ou em pequeno grupo, retomada dos fundamentos e acompanhamento semanal.`,
            quem: 'Professor responsável pela turma'
        });
    }

    // Ação 2: conhecimento mais crítico
    const knowledgeEntries = buildKnowledgePerformanceEntries(classroomAnalysis)
        .sort((a, b) => a.performance - b.performance);

    if (knowledgeEntries.length > 0) {
        const pior = knowledgeEntries[0];
        actions.push({
            prioridade: 2, corP: '#d97706', bgP: '#fef3c7',
            titulo: `Reforço em "${pior.knowledgeName}" (${pior.performance}% de acerto)`,
            desc: `Este é o conhecimento com menor taxa de acerto da turma. Recomenda-se revisão completa do conteúdo com exercícios práticos antes da próxima avaliação.`,
            quem: 'Professor + coordenação pedagógica'
        });
    }

    // Ação 3: capacidade mais fraca
    const { sortedCapacityCodes, performanceByCapacity } = classroomAnalysis;
    const capPerfs = sortedCapacityCodes.map(code => ({
        code,
        name: getCapacityDisplayName(code),
        perf: calculateCapacityClassAverage(code, classroomAnalysis)
    })).sort((a, b) => a.perf - b.perf);

    if (capPerfs.length > 0) {
        const piorCap = capPerfs[0];
        actions.push({
            prioridade: 3, corP: '#d97706', bgP: '#fef3c7',
            titulo: `Reforço na capacidade ${piorCap.code} — "${piorCap.name}" (${piorCap.perf}%)`,
            desc: `Esta capacidade concentra a maior dificuldade da turma. Atividades direcionadas com progressão de complexidade são recomendadas.`,
            quem: 'Professor em aula expositiva'
        });
    }

    // Ação 4: grupo adequado
    const adequadoCount = studentSummaries.filter(s => {
        const p = Number(s.desempenho) || 0;
        return p >= 60 && p < 80;
    }).length;

    if (adequadoCount > 0) {
        actions.push({
            prioridade: 4, corP: '#2563eb', bgP: '#eff6ff',
            titulo: `Aprofundamento para o grupo adequado (${adequadoCount} aluno(s))`,
            desc: `Estes alunos já atingiram o mínimo. Propor atividades de consolidação nas capacidades mais fracas e desafios extras nas capacidades onde se saem melhor.`,
            quem: 'Professor — atividades diferenciadas'
        });
    }

    // Ação 5: grupo excelência como par pedagógico
    const excelentes = studentSummaries.filter(s => (Number(s.desempenho) || 0) >= 80);
    if (excelentes.length > 0) {
        const nomes = excelentes.map(s => s.nome.split(' ').slice(0, 2).join(' ')).join(', ');
        actions.push({
            prioridade: 5, corP: '#16a34a', bgP: '#f0fdf4',
            titulo: `Aproveitar alunos de excelência como pares pedagógicos`,
            desc: `${nomes} podem apoiar colegas em atividades colaborativas, especialmente nas capacidades onde a turma vai melhor.`,
            quem: 'Professor — dinâmica de grupos'
        });
    }

    return actions;
}

function renderActionPlan(studentSummaries, classroomAnalysis) {
    const container = getElementByIdOrNull('ap-actionPlan');
    if (!container) return;

    const actions = buildActionPlan(studentSummaries, classroomAnalysis);

    container.innerHTML = actions.map(action => `
        <div class="ap-action-item">
            <div class="ap-action-priority" style="background:${action.bgP}; color:${action.corP};">
                ${action.prioridade}
            </div>
            <div class="ap-action-body">
                <div class="ap-action-title">${action.titulo}</div>
                <div class="ap-action-desc">${action.desc}</div>
                <span class="ap-action-who">
                    <i class="fa-solid fa-user" style="font-size:10px;"></i> ${action.quem}
                </span>
            </div>
        </div>
    `).join('');
}


/* ================================================
   BLOCO: ANÁLISE DE ITENS SAEP
   Agrega answerRecords por identificador para
   calcular taxa de acerto e distratores.
================================================ */

function buildItemsAnalysis() {
    const itemMap = {};

    ApplicationState.answerRecords.forEach(record => {
        const id = record.identificador;
        if (!id) return;

        if (!itemMap[id]) {
            itemMap[id] = {
                identificador: id,
                cap:          record.cap || '—',
                conhecimento: record.conhecimento || '—',
                dificuldade:  record.dificuldade || '—',
                gabarito:     record.gabarito || '—',
                total:        0,
                acertos:      0,
                alternativas: { A: 0, B: 0, C: 0, D: 0, E: 0 }
            };
        }

        itemMap[id].total++;
        if (record.acertou) itemMap[id].acertos++;

        const alt = (record.marcacao || '').toUpperCase();
        if (alt && itemMap[id].alternativas.hasOwnProperty(alt)) {
            itemMap[id].alternativas[alt]++;
        }
    });

    return Object.values(itemMap).map(item => {
        const taxaAcerto = item.total > 0
            ? Number(((item.acertos / item.total) * 100).toFixed(1))
            : 0;

        // Distrator: alternativa errada mais escolhida
        const altEntries = Object.entries(item.alternativas)
            .filter(([alt]) => alt !== item.gabarito.toUpperCase())
            .sort((a, b) => b[1] - a[1]);

        const distrator = altEntries[0]?.[0] || '—';
        const pctDistrator = item.total > 0
            ? Number(((altEntries[0]?.[1] || 0) / item.total * 100).toFixed(1))
            : 0;

        // % por alternativa
        const pctAlternativas = {};
        ['A','B','C','D','E'].forEach(alt => {
            pctAlternativas[alt] = item.total > 0
                ? Number(((item.alternativas[alt] / item.total) * 100).toFixed(1))
                : 0;
        });

        return {
            ...item,
            taxaAcerto,
            distrator,
            pctDistrator,
            pctAlternativas
        };
    }).sort((a, b) => a.taxaAcerto - b.taxaAcerto);
}

function getDificuldadeColor(dif) {
    const d = (dif || '').toLowerCase().replace(/\s/g, '');
    if (d.includes('muitofacil') || d.includes('muitofácil')) return { bg: '#dcfce7', text: '#15803d', label: 'Muito Fácil' };
    if (d.includes('facil') || d.includes('fácil'))            return { bg: '#f0fdf4', text: '#16a34a', label: 'Fácil'       };
    if (d.includes('medio') || d.includes('médio'))            return { bg: '#eff6ff', text: '#2563eb', label: 'Médio'       };
    if (d.includes('muitodificil') || d.includes('muitodifícil')) return { bg: '#fee2e2', text: '#dc2626', label: 'Muito Difícil' };
    if (d.includes('dificil') || d.includes('difícil'))        return { bg: '#fef2f2', text: '#ef4444', label: 'Difícil'     };
    return { bg: '#f1f5f9', text: '#64748b', label: dif };
}

function renderItemsTable(items) {
    const container = getElementByIdOrNull('ap-itemsSection');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = '<p style="color:#64748b;font-size:0.9rem;">Nenhum item identificado nos registros. Verifique se a planilha possui a coluna "Identificador".</p>';
        return;
    }

    // Filtros de capacidade
    const caps = [...new Set(items.map(i => i.cap).filter(Boolean))].sort();
    const filterOptions = caps.map(c =>
        `<option value="${c}">${c} — ${getCapacityDisplayName(c)}</option>`
    ).join('');

    container.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
            <select id="ap-itemFilter" class="student-select" style="height:38px; width:auto; min-width:220px; font-size:0.85rem;"
                onchange="filterItemsTable()">
                <option value="">Todas as capacidades</option>
                ${filterOptions}
            </select>
            <span id="ap-itemCount" style="font-size:0.82rem; color:#64748b; font-weight:600;"></span>
        </div>
        <div class="ap-heatmap-wrap">
            <table class="ap-items-table" id="ap-itemsTable">
                <thead>
                    <tr>
                        <th class="ap-items-th">Identificador</th>
                        <th class="ap-items-th">Cap.</th>
                        <th class="ap-items-th">Conhecimento</th>
                        <th class="ap-items-th">Dificuldade</th>
                        <th class="ap-items-th" style="text-align:center;">Gabarito</th>
                        <th class="ap-items-th" style="text-align:center;">Acerto</th>
                        <th class="ap-items-th" style="text-align:center;">Distrator</th>
                        <th class="ap-items-th" style="text-align:center;">% Distrator</th>
                    </tr>
                </thead>
                <tbody id="ap-itemsBody"></tbody>
            </table>
        </div>
    `;

    window._allItems = items;
    filterItemsTable();
}

function filterItemsTable() {
    const filter = (getElementByIdOrNull('ap-itemFilter') || {}).value || '';
    const items = (window._allItems || []).filter(i => !filter || i.cap === filter);
    const tbody = getElementByIdOrNull('ap-itemsBody');
    const count = getElementByIdOrNull('ap-itemCount');

    if (count) count.textContent = `${items.length} item(ns)`;
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
        const acertoCor = getPerformanceColor(item.taxaAcerto);
        const { bg: difBg, text: difText, label: difLabel } = getDificuldadeColor(item.dificuldade);
        const distCor = item.pctDistrator >= 50 ? '#dc2626' : item.pctDistrator >= 30 ? '#d97706' : '#64748b';

        return `
            <tr class="ap-items-row">
                <td class="ap-items-td" style="font-weight:700; color:var(--text);">${item.identificador}</td>
                <td class="ap-items-td" style="font-weight:700; color:var(--primary);">${item.cap}</td>
                <td class="ap-items-td" style="max-width:180px; white-space:normal; line-height:1.3;">${item.conhecimento}</td>
                <td class="ap-items-td">
                    <span style="background:${difBg}; color:${difText}; padding:2px 8px; border-radius:999px; font-size:0.72rem; font-weight:700; white-space:nowrap;">${difLabel}</span>
                </td>
                <td class="ap-items-td" style="text-align:center;">
                    <span style="background:#dcfce7; color:#15803d; font-weight:800; padding:3px 10px; border-radius:999px;">${item.gabarito}</span>
                </td>
                <td class="ap-items-td" style="text-align:center; font-weight:800; color:${acertoCor};">${item.taxaAcerto}%</td>
                <td class="ap-items-td" style="text-align:center;">
                    <span style="background:#fee2e2; color:#dc2626; font-weight:800; padding:3px 10px; border-radius:999px;">${item.distrator}</span>
                </td>
                <td class="ap-items-td" style="text-align:center; font-weight:800; color:${distCor};">${item.pctDistrator}%</td>
            </tr>
        `;
    }).join('');
}

/* ================================================
   BLOCO: DISTRATORES VISUAIS
================================================ */

function renderDistractors(items) {
    const container = getElementByIdOrNull('ap-distractorsSection');
    if (!container) return;

    // Top 8 itens com menor acerto que têm distrator relevante (>30%)
    const topItems = items
        .filter(i => i.pctDistrator >= 30 && i.total >= 3)
        .slice(0, 8);

    if (!topItems.length) {
        container.innerHTML = '<p style="color:#64748b;font-size:0.9rem;">Sem distratores relevantes identificados.</p>';
        return;
    }

    container.innerHTML = topItems.map(item => {
        const alts = ['A','B','C','D','E'];
        const { label: difLabel } = getDificuldadeColor(item.dificuldade);

        const bars = alts.map(alt => {
            const pct = item.pctAlternativas[alt] || 0;
            const isGab  = alt === item.gabarito.toUpperCase();
            const isDist = alt === item.distrator.toUpperCase();
            const cor = isGab ? '#22c55e' : isDist ? '#ef4444' : '#94a3b8';
            const bgCor = isGab ? '#f0fdf4' : isDist ? '#fef2f2' : '#f8fafc';
            const barH = Math.max(4, Math.round(pct * 0.5)); // máx ~50px
            return `
                <div style="display:flex; flex-direction:column; align-items:center; gap:3px; flex:1;">
                    <span style="font-size:0.65rem; font-weight:800; color:${cor};">${pct}%</span>
                    <div style="width:100%; height:${barH}px; background:${cor}; border-radius:4px 4px 0 0; min-height:4px;"></div>
                    <div style="width:28px; height:28px; border-radius:50%; background:${bgCor}; border:2px solid ${cor};
                                display:flex; align-items:center; justify-content:center;
                                font-size:0.78rem; font-weight:800; color:${cor};">
                        ${alt}${isGab ? '✓' : isDist ? '✗' : ''}
                    </div>
                </div>`;
        }).join('');

        const alertLevel = item.pctDistrator >= 60
            ? `<span style="background:#fee2e2;color:#dc2626;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;">⚠ Concepção equivocada forte</span>`
            : `<span style="background:#fef3c7;color:#92400e;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;">Atenção ao distrator</span>`;

        return `
            <div class="ap-distractor-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px; flex-wrap:wrap;">
                    <div>
                        <span style="font-weight:800; font-size:0.9rem; color:var(--text);">${item.identificador}</span>
                        <span style="margin-left:10px; font-size:0.8rem; color:var(--primary); font-weight:700;">${item.cap}</span>
                        <span style="margin-left:8px; font-size:0.8rem; color:var(--muted);">· ${item.conhecimento}</span>
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                        ${alertLevel}
                        <span style="font-size:0.72rem; color:#64748b; font-weight:600;">${difLabel} · Acerto: <b style="color:${getPerformanceColor(item.taxaAcerto)}">${item.taxaAcerto}%</b></span>
                    </div>
                </div>
                <div style="display:flex; gap:6px; align-items:flex-end; height:90px; padding:0 4px;">
                    ${bars}
                </div>
                <div style="margin-top:10px; padding:8px 12px; background:var(--surface-soft); border-radius:10px; font-size:0.78rem; color:var(--text-3); line-height:1.5;">
                    <b>${item.pctDistrator}%</b> da turma escolheu <b style="color:#dc2626">${item.distrator}</b> em vez de
                    <b style="color:#16a34a">${item.gabarito}</b>.
                    ${item.pctDistrator >= 60
                        ? 'Indício forte de concepção equivocada disseminada — recomenda-se retomada conceitual específica.'
                        : 'Verificar se há confusão conceitual entre as alternativas.'}
                </div>
            </div>
        `;
    }).join('');
}

/* ================================================
   INICIALIZAÇÃO DA PÁGINA
================================================ */

function initializeAnalysePage() {
    const empty   = getElementByIdOrNull('analyseEmpty');
    const content = getElementByIdOrNull('analyseContent');

    if (!ApplicationState.studentSummaries.length) {
        if (empty)   empty.style.display   = 'block';
        if (content) content.style.display = 'none';
        return;
    }

    if (empty)   empty.style.display   = 'none';
    if (content) content.style.display = 'block';

    const { studentSummaries } = ApplicationState;
    const kpis = buildAnalyseKpis(studentSummaries);
    const classroomAnalysis = buildClassroomAnalysisStructures();

    // Subtítulo com nome do curso
    const courseName = getSelectedCourseConfig()?.nome || '';
    const subtitle = getElementByIdOrNull('analyseSubtitle');
    if (subtitle && courseName) {
        subtitle.textContent = `${courseName} · Análise detalhada de ${studentSummaries.length} aluno(s)`;
    }

    renderAnalyseKpis(kpis);
    renderRiskBanner(kpis);
    renderRiskList(studentSummaries);
    renderDistribution(studentSummaries);
    renderHeatmap(classroomAnalysis);
    renderKnowledgeDeep(classroomAnalysis);
    renderCapacityChart(classroomAnalysis);
    renderClusters(studentSummaries);
    renderActionPlan(studentSummaries, classroomAnalysis);

    const itemsAnalysis = buildItemsAnalysis();
    renderItemsTable(itemsAnalysis);
    renderDistractors(itemsAnalysis);
}
