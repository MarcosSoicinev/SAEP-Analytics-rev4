function isDashboardPage() {
    return Boolean(getElementByIdOrNull('kpi-media'));
}

function isStudentPage() {
    return Boolean(getElementByIdOrNull('studentSelector'));
}

function isAnalysePage() {
    return Boolean(getElementByIdOrNull('analyseContent'));
}

function updateCourseIndicator() {
    const indicator = document.getElementById('courseIndicator');
    const nameEl    = document.getElementById('courseIndicatorName');
    if (!indicator || !nameEl) return;

    const courseConfig = getSelectedCourseConfig();
    if (courseConfig && courseConfig.nome) {
        nameEl.textContent = courseConfig.nome;
        indicator.style.display = 'flex';
    } else {
        indicator.style.display = 'none';
    }
}

function initializeApplication() {
    loadSpreadsheetDataFromStorage();
    populateCourseSelector();
    configureCourseConfigUpload();
    configureSpreadsheetUpload();
    updateCourseIndicator();

    if (isDashboardPage()) {
        initializeDashboardPage();
    }

    if (isStudentPage()) {
        initializeStudentPage();
    }

    if (isAnalysePage()) {
        initializeAnalysePage();
    }
}

window.onload = initializeApplication;
