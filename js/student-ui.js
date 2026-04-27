/* ============================================================
   SAEP Analytics — student-ui.js
   Renderização da página de Boletim do Aluno (aluno.html)
============================================================ */

function getStudentInitials(studentName) {
    const nameParts = studentName.split(' ').filter(Boolean);
    if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return (nameParts[0]?.slice(0, 2) || '--').toUpperCase();
}

/* ================================================
   ESCALA DE NÍVEL VISUAL
================================================ */

function updateNivelScale(saepLevel, levelColor) {
    const scaleIds = {
        'Abaixo do Básico': 'scaleAbaixo',
        'Básico':           'scaleBasico',
        'Adequado':         'scaleAdequado',
        'Avançado':         'scaleAvancado'
    };

    const descriptions = {
        'Abaixo do Básico': 'Nível Abaixo do Básico — necessita de intervenção pedagógica intensiva',
        'Básico':           'Nível Básico — domínio parcial, necessita consolidação',
        'Adequado':         'Nível Adequado — domínio satisfatório das capacidades avaliadas',
        'Avançado':         'Nível Avançado — domínio consistente e potencial de aprofundamento'
    };

    ['scaleAbaixo', 'scaleBasico', 'scaleAdequado', 'scaleAvancado'].forEach(id => {
        const el = getElementByIdOrNull(id);
        if (el) el.classList.remove('active');
    });

    const activeId = scaleIds[saepLevel];
    if (activeId) {
        const activeEl = getElementByIdOrNull(activeId);
        if (activeEl) activeEl.classList.add('active');
    }

    const label = getElementByIdOrNull('nivelScaleLabel');
    if (label) {
        label.textContent = descriptions[saepLevel] || saepLevel;
        label.style.color = levelColor;
    }
}

/* ================================================
   CABEÇALHO DO ALUNO
================================================ */

function updateStudentHeader(studentSummary) {
    const saepLevel  = getStudentSaepLevel(studentSummary);
    const levelColor = getLevelColor(saepLevel);

    // Avatar com cor dinâmica
    const initialsBox = getElementByIdOrNull('initialsBox');
    if (initialsBox) {
        initialsBox.style.background = `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`;
    }

    setTextContentIfElementExists('initials',    getStudentInitials(studentSummary.nome));
    setTextContentIfElementExists('studentName', studentSummary.nome);
    setTextContentIfElementExists('regNumber',   studentSummary.matricula || '--');
    setTextContentIfElementExists('hits',        studentSummary.acertos);
    setTextContentIfElementExists('misses',      studentSummary.erros);
    setTextContentIfElementExists('time',        studentSummary.tempo || '--');
    setTextContentIfElementExists('statusLabel', saepLevel);

    // Desempenho %
    const scoreEl = getElementByIdOrNull('totalScore');
    if (scoreEl) {
        scoreEl.innerText = `${Number(studentSummary.desempenho || 0).toFixed(1)}%`;
        scoreEl.style.color = levelColor;
    }

    // Badge de nível
    const badgeEl = getElementByIdOrNull('nivelBadge');
    if (badgeEl) {
        const bgMap = {
            'Avançado':        '#dcfce7',
            'Adequado':        '#dbeafe',
            'Básico':          '#fef9c3',
            'Abaixo do Básico':'#fee2e2'
        };
        badgeEl.style.color       = levelColor;
        badgeEl.style.borderColor = levelColor;
        badgeEl.style.background  = bgMap[saepLevel] || '#f8fafc';
    }

    // Borda lateral do cabeçalho
    const headerEl = getElementByIdOrNull('studentHeader');
    if (headerEl) headerEl.style.borderLeftColor = levelColor;

    // Escala visual de nível
    updateNivelScale(saepLevel, levelColor);

    // Curso do aluno
    const courseConfig = getSelectedCourseConfig();
    const courseTag    = getElementByIdOrNull('courseTag');
    const courseNameEl = getElementByIdOrNull('courseName');
    if (courseConfig && courseConfig.nome && courseTag && courseNameEl) {
        courseNameEl.textContent = courseConfig.nome;
        courseTag.style.display  = 'inline-flex';
    } else if (courseTag) {
        courseTag.style.display = 'none';
    }

    // Diagnóstico: borda lateral
    const diagBox = getElementByIdOrNull('diagnosticBox');
    if (diagBox) diagBox.style.borderLeftColor = levelColor;
}

/* ================================================
   DIAGNÓSTICO PEDAGÓGICO MELHORADO
================================================ */

function buildDiagnosticLines(
    saepLevel, levelColor,
    capacityExtremes, knowledgeExtremes,
    pedagogicalGuidance, courseName
) {
    const lines = [];

    // Leitura interpretativa por nível
    const interpretations = {
        'Avançado':        'Domínio consistente das capacidades avaliadas, com bom potencial para aprofundamento e resolução de situações mais complexas.',
        'Adequado':        'Desempenho satisfatório, com domínio funcional da maior parte das capacidades avaliadas. Existem pontos específicos a consolidar.',
        'Básico':          'Domínio parcial das capacidades avaliadas. Compreensão inicial dos conteúdos, com necessidade de consolidação mais sistemática.',
        'Abaixo do Básico':'Dificuldades relevantes nas capacidades avaliadas. Necessita de intervenção pedagógica mais intensiva e acompanhamento frequente.'
    };

    const interventions = {
        'Avançado':        'Propor atividades de ampliação, problemas desafiadores e aplicações integradoras para consolidar autonomia.',
        'Adequado':        'Reforçar os pontos de menor desempenho com atividades direcionadas. Manter desafios graduais para ampliar segurança.',
        'Básico':          'Retomada orientada dos conteúdos essenciais com exercícios progressivos, mediação próxima e foco nas dificuldades prioritárias.',
        'Abaixo do Básico':'Retomada dos fundamentos, atividades guiadas, reforço estruturado e acompanhamento contínuo com foco em pequenas evoluções.'
    };

    const iconColors = {
        'Avançado':        '#16a34a',
        'Adequado':        '#2563eb',
        'Básico':          '#d97706',
        'Abaixo do Básico':'#dc2626'
    };

    const icColor = iconColors[saepLevel] || '#64748b';
    const iconBg  = `${icColor}18`;

    function linha(iconClass, iconColor, iconBgColor, html) {
        return `
            <div class="diagnostico-linha">
                <div class="diagnostico-icone" style="background:${iconBgColor}; color:${iconColor};">
                    <i class="${iconClass}"></i>
                </div>
                <div>${html}</div>
            </div>`;
    }

    // Leitura pedagógica
    lines.push(linha(
        'fa-solid fa-chart-line', icColor, iconBg,
        `<strong>Leitura pedagógica:</strong> ${interpretations[saepLevel] || ''}`
    ));

    // Ponto forte em capacidade
    if (capacityExtremes) {
        lines.push(linha(
            'fa-solid fa-trophy', '#16a34a', '#dcfce7',
            `<strong>Capacidade mais forte:</strong> ${capacityExtremes.best.label} — ${getCapacityDisplayName(capacityExtremes.best.label)} <span style="color:#16a34a; font-weight:700;">(${capacityExtremes.best.value}%)</span>`
        ));
        lines.push(linha(
            'fa-solid fa-triangle-exclamation', '#dc2626', '#fee2e2',
            `<strong>Capacidade que precisa de atenção:</strong> ${capacityExtremes.worst.label} — ${getCapacityDisplayName(capacityExtremes.worst.label)} <span style="color:#dc2626; font-weight:700;">(${capacityExtremes.worst.value}%)</span>`
        ));
    }

    // Conhecimentos
    if (knowledgeExtremes) {
        lines.push(linha(
            'fa-solid fa-brain', '#7c3aed', '#ede9fe',
            `<strong>Conhecimento com melhor resultado:</strong> ${knowledgeExtremes.best.label} <span style="color:#16a34a; font-weight:700;">(${knowledgeExtremes.best.value}%)</span>
             &nbsp;·&nbsp; <strong>Conhecimento que mais exige reforço:</strong> ${knowledgeExtremes.worst.label} <span style="color:#dc2626; font-weight:700;">(${knowledgeExtremes.worst.value}%)</span>`
        ));
    }

    // Encaminhamento pedagógico da capacidade mais fraca
    if (pedagogicalGuidance) {
        lines.push(linha(
            'fa-solid fa-bullseye', '#d97706', '#fef3c7',
            `<strong>Encaminhamento prioritário:</strong> ${pedagogicalGuidance}`
        ));
    }

    // Estratégia geral
    lines.push(linha(
        'fa-solid fa-wand-magic-sparkles', icColor, iconBg,
        `<strong>Estratégia recomendada:</strong> ${interventions[saepLevel] || ''}`
    ));

    return lines.join('');
}

function renderStudentPedagogicalDiagnosis(
    studentSummary,
    capacityPerformance,
    knowledgePerformance
) {
    const diagnosisTextElement = getElementByIdOrNull('diagnosticText');
    const diagnosisBoxElement  = getElementByIdOrNull('diagnosticBox');

    if (!diagnosisTextElement || !diagnosisBoxElement) return;

    const saepLevel  = getStudentSaepLevel(studentSummary);
    const levelColor = getLevelColor(saepLevel);
    diagnosisBoxElement.style.borderLeftColor = levelColor;

    if (!capacityPerformance.labels.length) {
        diagnosisTextElement.innerHTML =
            '<p style="color:#64748b;">Não foi possível gerar diagnóstico pedagógico para este aluno.</p>';
        return;
    }

    const capacityExtremes = getPerformanceExtremes(
        capacityPerformance.labels,
        capacityPerformance.values
    );

    const knowledgeExtremes = knowledgePerformance.labels.length
        ? getPerformanceExtremes(knowledgePerformance.labels, knowledgePerformance.values)
        : null;

    const pedagogicalGuidance = capacityExtremes
        ? getCapacityPedagogicalGuidance(capacityExtremes.worst.label)
        : '';

    const courseName = getSelectedCourseConfig()?.nome || '';

    diagnosisTextElement.className = 'diagnostico-bloco';
    diagnosisTextElement.innerHTML = buildDiagnosticLines(
        saepLevel, levelColor,
        capacityExtremes, knowledgeExtremes,
        pedagogicalGuidance, courseName
    );
}

/* ================================================
   GRÁFICOS
================================================ */

function renderStudentCharts(studentSummary) {
    const capacityPerformance  = calculateStudentCapacityPerformance(studentSummary.nome);
    const knowledgePerformance = calculateStudentKnowledgePerformance(studentSummary.nome);

    destroyChartIfExists(ApplicationState.charts.capacityChart);
    destroyChartIfExists(ApplicationState.charts.knowledgeChart);

    ApplicationState.charts.capacityChart = renderHorizontalBarChart(
        'studentCapChart',
        capacityPerformance.labels,
        capacityPerformance.values,
        'Desempenho por Capacidade'
    );

    ApplicationState.charts.knowledgeChart = renderHorizontalBarChart(
        'studentKnowledgeChart',
        knowledgePerformance.labels,
        knowledgePerformance.values,
        'Desempenho por Conhecimento'
    );

    renderStudentPedagogicalDiagnosis(
        studentSummary,
        capacityPerformance,
        knowledgePerformance
    );
}

/* ================================================
   SELEÇÃO DE ALUNO
================================================ */

function renderSelectedStudent(studentSummary) {
    if (!getElementByIdOrNull('studentHeader')) return;
    ApplicationState.selectedStudent = studentSummary;
    updateStudentHeader(studentSummary);
    renderStudentCharts(studentSummary);
}

function populateStudentSelector(students) {
    const studentSelector = getElementByIdOrNull('studentSelector');
    if (!studentSelector) return;

    if (!ApplicationState.studentSummaries.length) {
        studentSelector.innerHTML = '<option value="">Faça o upload da planilha primeiro...</option>';
        return;
    }

    studentSelector.innerHTML = '<option value="">Selecione um estudante...</option>';
    students.forEach((studentSummary, index) => {
        studentSelector.innerHTML += `<option value="${index}">${studentSummary.nome}</option>`;
    });

    studentSelector.onchange = function handleStudentChange() {
        if (this.value === '') return;
        renderSelectedStudent(students[this.value]);
    };
}

/* ================================================
   INICIALIZAÇÃO
================================================ */

function initializeStudentPage() {
    const studentSelector = getElementByIdOrNull('studentSelector');
    if (!studentSelector) return;

    const orderedStudents = getOrderedStudentsByName();
    populateStudentSelector(orderedStudents);
    configurePdfButtons(orderedStudents);
    configurePrintButton();
}
