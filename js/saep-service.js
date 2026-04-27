function getSelectedCourseConfig() {
    return COURSE_CONFIG[getSavedCourseKey()] || null;
}

function populateCourseSelector() {
    const courseSelectors = document.querySelectorAll('#courseSelector');

    if (!courseSelectors.length) {
        return;
    }

    const savedCourseKey = getSavedCourseKey();

    courseSelectors.forEach((courseSelector) => {
        courseSelector.innerHTML = '<option value="">Selecione o curso...</option>';

        Object.entries(COURSE_CONFIG).forEach(([courseKey, courseConfig]) => {
            const optionElement = document.createElement('option');
            optionElement.value = courseKey;
            optionElement.textContent = courseConfig.nome;

            if (courseKey === savedCourseKey) {
                optionElement.selected = true;
            }

            courseSelector.appendChild(optionElement);
        });

        courseSelector.addEventListener('change', function handleCourseChange() {
            if (this.value) {
                saveSelectedCourse(this.value);
            }
        });
    });
}

function getCapacityDisplayName(capacityCode) {
    const selectedCourseConfig = getSelectedCourseConfig();

    if (
        selectedCourseConfig &&
        selectedCourseConfig.capacidades &&
        selectedCourseConfig.capacidades[capacityCode]
    ) {
        return selectedCourseConfig.capacidades[capacityCode];
    }

    return `Capacidade ${String(capacityCode || '').replace('C', '')}`;
}

function getCapacityPedagogicalGuidance(capacityCode) {
    const selectedCourseConfig = getSelectedCourseConfig();

    if (
        selectedCourseConfig &&
        selectedCourseConfig.diagnosticos &&
        selectedCourseConfig.diagnosticos[capacityCode]
    ) {
        return selectedCourseConfig.diagnosticos[capacityCode];
    }

    return 'Necessita reforço pedagógico direcionado nesta capacidade.';
}

function getCourseScale() {
    const courseConfig = getSelectedCourseConfig();

    if (courseConfig && courseConfig.escala) {
        return courseConfig.escala;
    }

    return { abaixo: 400, basico: 500, adequado: 650 };
}

function getLevelByProficiency(proficiency) {
    const scale = getCourseScale();

    if (proficiency < scale.abaixo) {
        return 'Abaixo do Básico';
    }

    if (proficiency < scale.basico) {
        return 'Básico';
    }

    if (proficiency < scale.adequado) {
        return 'Adequado';
    }

    return 'Avançado';
}

function getLevelByPerformance(performance) {
    if (performance < 40) {
        return 'Abaixo do Básico';
    }

    if (performance < 60) {
        return 'Básico';
    }

    if (performance < 80) {
        return 'Adequado';
    }

    return 'Avançado';
}

/* =============================================================
   CONVERSÃO DESEMPENHO % → PROFICIÊNCIA ESTIMADA
   Quando a planilha não traz proficiência, estimamos a partir
   do desempenho % usando a escala do curso selecionado.
   
   Lógica: 
   - 0%   → limite inferior da escala (abaixo - 100)
   - 40%  → limiar do Básico
   - 60%  → limiar do Adequado
   - 80%  → limiar do Avançado
   - 100% → teto (adequado + 300)
   ============================================================= */
function estimateProficiencyFromPerformance(performance) {
    const scale = getCourseScale();
    const p = Number(performance) || 0;

    // Pontos âncora mapeando % para escala do curso
    const anchors = [
        { pct: 0,   score: Math.max(0, scale.abaixo - 100) },
        { pct: 40,  score: scale.abaixo },
        { pct: 60,  score: scale.basico },
        { pct: 80,  score: scale.adequado },
        { pct: 100, score: scale.adequado + 300 }
    ];

    // Interpolação linear entre os pontos âncora
    for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        if (p >= a.pct && p <= b.pct) {
            const ratio = (p - a.pct) / (b.pct - a.pct);
            return Math.round(a.score + ratio * (b.score - a.score));
        }
    }

    return scale.adequado + 300;
}

function getStudentSaepLevel(studentOrScore) {
    if (typeof studentOrScore === 'object' && studentOrScore !== null) {
        // 1ª opção: proficiência real da planilha
        const proficiency = Number(studentOrScore.proficiencia);
        if (!Number.isNaN(proficiency) && proficiency > 0) {
            return getLevelByProficiency(proficiency);
        }

        // 2ª opção: estima proficiência a partir do desempenho %
        // usando a escala do curso configurado
        const performance = Number(studentOrScore.desempenho) || 0;
        const estimatedProficiency = estimateProficiencyFromPerformance(performance);
        return getLevelByProficiency(estimatedProficiency);
    }

    // Chamado com número puro (ex: % de capacidade nos gráficos)
    // Mantém lógica por desempenho % para não quebrar visualizações
    return getLevelByPerformance(Number(studentOrScore) || 0);
}

function getLevelColor(level) {
    if (level === 'Avançado') {
        return COLOR_CONFIG.verde;
    }

    if (level === 'Adequado') {
        return COLOR_CONFIG.azul;
    }

    if (level === 'Básico') {
        return COLOR_CONFIG.amarelo;
    }

    return COLOR_CONFIG.vermelho;
}

function getLevelDescription(level) {
    if (level === 'Avançado') {
        return 'O estudante demonstra domínio ampliado das capacidades avaliadas.';
    }

    if (level === 'Adequado') {
        return 'O estudante demonstra domínio satisfatório das capacidades avaliadas.';
    }

    if (level === 'Básico') {
        return 'O estudante apresenta domínio parcial das capacidades avaliadas e precisa consolidar fundamentos.';
    }

    return 'O estudante apresenta domínio insuficiente das capacidades avaliadas e necessita de retomada intensiva.';
}

function buildClassroomAnalysisStructures() {
    const capacityCodeSet = new Set();
    const performanceByCapacity = {};
    const studentCapacityPerformance = {};

    ApplicationState.answerRecords.forEach((answerRecord) => {
        if (!answerRecord.cap || answerRecord.cap === 'Cundefined' || answerRecord.cap === 'Cnull') {
            return;
        }

        capacityCodeSet.add(answerRecord.cap);

        if (!performanceByCapacity[answerRecord.cap]) {
            performanceByCapacity[answerRecord.cap] = {
                total: 0,
                acertos: 0,
                conhecimentos: {}
            };
        }

        performanceByCapacity[answerRecord.cap].total += 1;

        if (answerRecord.acertou) {
            performanceByCapacity[answerRecord.cap].acertos += 1;
        }

        const knowledgeName = answerRecord.conhecimento || 'Não identificado';

        if (!performanceByCapacity[answerRecord.cap].conhecimentos[knowledgeName]) {
            performanceByCapacity[answerRecord.cap].conhecimentos[knowledgeName] = {
                total: 0,
                acertos: 0
            };
        }

        performanceByCapacity[answerRecord.cap].conhecimentos[knowledgeName].total += 1;

        if (answerRecord.acertou) {
            performanceByCapacity[answerRecord.cap].conhecimentos[knowledgeName].acertos += 1;
        }

        if (!studentCapacityPerformance[answerRecord.aluno]) {
            studentCapacityPerformance[answerRecord.aluno] = {};
        }

        if (!studentCapacityPerformance[answerRecord.aluno][answerRecord.cap]) {
            studentCapacityPerformance[answerRecord.aluno][answerRecord.cap] = {
                total: 0,
                acertos: 0
            };
        }

        studentCapacityPerformance[answerRecord.aluno][answerRecord.cap].total += 1;

        if (answerRecord.acertou) {
            studentCapacityPerformance[answerRecord.aluno][answerRecord.cap].acertos += 1;
        }
    });

    const sortedCapacityCodes = [...capacityCodeSet].sort((firstCode, secondCode) =>
        firstCode.localeCompare(secondCode, undefined, { numeric: true })
    );

    return {
        sortedCapacityCodes,
        performanceByCapacity,
        studentCapacityPerformance
    };
}

function getOrderedStudentsByName() {
    return [...ApplicationState.studentSummaries].sort((firstStudent, secondStudent) =>
        firstStudent.nome.localeCompare(secondStudent.nome, 'pt-BR')
    );
}

function calculateStudentCapacityPerformance(studentName) {
    const studentRecords = ApplicationState.answerRecords.filter(
        (answerRecord) =>
            answerRecord.aluno === studentName &&
            answerRecord.cap &&
            answerRecord.cap !== 'Cundefined' &&
            answerRecord.cap !== 'Cnull'
    );

    const capacityAccumulator = {};

    studentRecords.forEach((answerRecord) => {
        if (!capacityAccumulator[answerRecord.cap]) {
            capacityAccumulator[answerRecord.cap] = {
                acertos: 0,
                total: 0
            };
        }

        capacityAccumulator[answerRecord.cap].total += 1;

        if (answerRecord.acertou) {
            capacityAccumulator[answerRecord.cap].acertos += 1;
        }
    });

    const labels = Object.keys(capacityAccumulator).sort((firstCode, secondCode) =>
        firstCode.localeCompare(secondCode, undefined, { numeric: true })
    );

    const values = labels.map((capacityCode) =>
        Number(
            (
                (capacityAccumulator[capacityCode].acertos /
                    capacityAccumulator[capacityCode].total) *
                100
            ).toFixed(1)
        )
    );

    return {
        labels,
        values
    };
}

function calculateStudentKnowledgePerformance(studentName) {
    const studentRecords = ApplicationState.answerRecords.filter(
        (answerRecord) => answerRecord.aluno === studentName && answerRecord.conhecimento
    );

    const knowledgeAccumulator = {};

    studentRecords.forEach((answerRecord) => {
        const knowledgeName = answerRecord.conhecimento || 'Não identificado';

        if (!knowledgeAccumulator[knowledgeName]) {
            knowledgeAccumulator[knowledgeName] = {
                acertos: 0,
                total: 0
            };
        }

        knowledgeAccumulator[knowledgeName].total += 1;

        if (answerRecord.acertou) {
            knowledgeAccumulator[knowledgeName].acertos += 1;
        }
    });

    const labels = Object.keys(knowledgeAccumulator).sort((firstKnowledge, secondKnowledge) =>
        firstKnowledge.localeCompare(secondKnowledge, 'pt-BR')
    );

    const values = labels.map((knowledgeName) =>
        Number(
            (
                (knowledgeAccumulator[knowledgeName].acertos /
                    knowledgeAccumulator[knowledgeName].total) *
                100
            ).toFixed(1)
        )
    );

    return {
        labels,
        values
    };
}

function getPerformanceExtremes(labels, values) {
    if (!labels.length || !values.length || labels.length !== values.length) {
        return null;
    }

    let bestIndex = 0;
    let worstIndex = 0;

    values.forEach((value, index) => {
        if (value > values[bestIndex]) {
            bestIndex = index;
        }

        if (value < values[worstIndex]) {
            worstIndex = index;
        }
    });

    return {
        best: {
            label: labels[bestIndex],
            value: values[bestIndex]
        },
        worst: {
            label: labels[worstIndex],
            value: values[worstIndex]
        }
    };
}

/* =========================
   EXTENSÕES PARA A VISÃO GERAL
========================= */

function buildCapacityPerformanceEntries(classroomAnalysis) {
    const { performanceByCapacity, sortedCapacityCodes } = classroomAnalysis;

    return sortedCapacityCodes.map((capacityCode) => {
        const capacityMetrics = performanceByCapacity[capacityCode];
        const performance = capacityMetrics.total > 0
            ? Number(((capacityMetrics.acertos / capacityMetrics.total) * 100).toFixed(1))
            : 0;

        const saepLevel = getStudentSaepLevel(performance);

        return {
            code: capacityCode,
            displayName: getCapacityDisplayName(capacityCode),
            acertos: capacityMetrics.acertos,
            total: capacityMetrics.total,
            performance,
            level: saepLevel,
            color: getLevelColor(saepLevel)
        };
    });
}

function buildKnowledgePerformanceEntries(classroomAnalysis) {
    const globalKnowledgeMap = new Map();

    Object.entries(classroomAnalysis.performanceByCapacity).forEach(([capacityCode, capacityMetrics]) => {
        Object.entries(capacityMetrics.conhecimentos).forEach(([knowledgeName, knowledgeMetrics]) => {
            const total = Number(knowledgeMetrics.total) || 0;
            const acertos = Number(knowledgeMetrics.acertos) || 0;

            if (!knowledgeName || knowledgeName === 'Não identificado') {
                return;
            }

            if (!globalKnowledgeMap.has(knowledgeName)) {
                globalKnowledgeMap.set(knowledgeName, {
                    knowledgeName,
                    acertos: 0,
                    total: 0,
                    capacidades: new Set()
                });
            }

            const entry = globalKnowledgeMap.get(knowledgeName);

            entry.acertos += acertos;
            entry.total += total;
            entry.capacidades.add(capacityCode);
        });
    });

    return [...globalKnowledgeMap.values()]
        .map((entry) => {
            const performance = entry.total > 0
                ? Number(((entry.acertos / entry.total) * 100).toFixed(1))
                : 0;

            const saepLevel = getStudentSaepLevel(performance);

            return {
                knowledgeName: entry.knowledgeName,
                acertos: entry.acertos,
                total: entry.total,
                performance,
                level: saepLevel,
                color: getLevelColor(saepLevel),
                capacidades: [...entry.capacidades]
            };
        })
        .sort((firstEntry, secondEntry) => secondEntry.performance - firstEntry.performance);
}

function buildClassroomPedagogicalHighlights(classroomAnalysis) {
    const capacityEntries = buildCapacityPerformanceEntries(classroomAnalysis);

    if (!capacityEntries.length) {
        return {
            strongest: null,
            weakest: null,
            summaryTitle: 'Sem dados suficientes',
            summaryHtml: '<p>Não foi possível gerar análise pedagógica.</p>'
        };
    }

    const sorted = [...capacityEntries].sort((a, b) => a.performance - b.performance);

    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];

    const lowPerformers = capacityEntries.filter(c => c.performance < 50).length;
    const totalCaps = capacityEntries.length;

    const nivelGeral = getStudentSaepLevel(
        capacityEntries.reduce((acc, c) => acc + c.performance, 0) / totalCaps
    );

    // 🔥 interpretação pedagógica
    let alerta = '';
    let estrategia = '';

    if (weakest.performance < 30) {
        alerta = 'Baixo domínio crítico identificado.';
        estrategia = 'Retomar conteúdos básicos com atividades guiadas e exemplos práticos.';
    } else if (weakest.performance < 50) {
        alerta = 'Domínio parcial com lacunas relevantes.';
        estrategia = 'Aplicar exercícios progressivos com foco em consolidação.';
    } else {
        alerta = 'Desempenho dentro do esperado.';
        estrategia = 'Avançar com aprofundamento e desafios.';
    }

    return {
        strongest,
        weakest,
        summaryTitle: 'Leitura pedagógica da turma',
        summaryHtml: `
            <div class="pedagogical-highlight-block">

                <p>
                    📊 <strong>Visão geral:</strong> A turma apresenta nível 
                    <strong>${nivelGeral}</strong>, com ${lowPerformers} de ${totalCaps} capacidades abaixo de 50%.
                </p>

                <p>
                    ⚠️ <strong>Alerta pedagógico:</strong> ${alerta}
                    A maior dificuldade está em 
                    <strong>${weakest.code} — ${weakest.displayName}</strong> 
                    (${weakest.performance}%).
                </p>

                <p>
                    🎯 <strong>Foco de intervenção:</strong> 
                    Trabalhar diretamente a capacidade 
                    <strong>${weakest.displayName}</strong>, 
                    pois impacta significativamente o desempenho global.
                </p>

                <p>
                    🚀 <strong>Estratégia recomendada:</strong> ${estrategia}
                </p>

                <p>
                    💡 <strong>Ponto positivo:</strong> A capacidade 
                    <strong>${strongest.code} — ${strongest.displayName}</strong> 
                    apresenta bom desempenho (${strongest.performance}%), 
                    podendo ser usada como base para atividades integradoras.
                </p>

            </div>
        `
    };
}