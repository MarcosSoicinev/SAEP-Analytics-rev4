function findWorksheetByPossibleNames(workbook, possibleNames) {
    const worksheetNames = workbook.SheetNames || [];
    const normalizedNameMap = new Map(
        worksheetNames.map((worksheetName) => [
            normalizeHeaderName(worksheetName),
            worksheetName
        ])
    );

    for (const possibleName of possibleNames) {
        const foundWorksheetName = normalizedNameMap.get(normalizeHeaderName(possibleName));

        if (foundWorksheetName) {
            return workbook.Sheets[foundWorksheetName];
        }
    }

    return null;
}

function getColumnValue(rowData, possibleColumnNames) {
    const normalizedColumnMap = new Map(
        Object.entries(rowData).map(([columnName, columnValue]) => [
            normalizeHeaderName(columnName),
            columnValue
        ])
    );

    for (const possibleColumnName of possibleColumnNames) {
        const foundValue = normalizedColumnMap.get(normalizeHeaderName(possibleColumnName));

        if (foundValue !== undefined) {
            return foundValue;
        }
    }

    return undefined;
}

function buildStudentSummary(summaryRow) {
    const studentSummary = {
        nome: normalizeText(getColumnValue(summaryRow, SummaryColumnAliases.studentName)),
        matricula: normalizeText(getColumnValue(summaryRow, SummaryColumnAliases.registration)),
        desempenho: parseNumber(getColumnValue(summaryRow, SummaryColumnAliases.performance)),
        acertos: Number(getColumnValue(summaryRow, SummaryColumnAliases.correctAnswers)) || 0,
        erros: Number(getColumnValue(summaryRow, SummaryColumnAliases.wrongAnswers)) || 0,
        tempo: normalizeText(getColumnValue(summaryRow, SummaryColumnAliases.executionTime)),
        proficiencia: parseNumber(getColumnValue(summaryRow, SummaryColumnAliases.proficiency))
    };

    return {
        ...studentSummary,
        nivelSAEP: getStudentSaepLevel(studentSummary)
    };
}

function getCourseColumnAliases() {
    return ['Curso', 'CURSO', 'curso'];
}

function buildAnswerRecord(recordRow) {
    const givenAnswer = normalizeText(getColumnValue(recordRow, RecordColumnAliases.answer));
    const correctAnswer = normalizeText(getColumnValue(recordRow, RecordColumnAliases.answerKey));

    return {
        aluno: normalizeText(getColumnValue(recordRow, RecordColumnAliases.studentName)),
        matricula: normalizeText(getColumnValue(recordRow, RecordColumnAliases.registration)),
        cap: parseCapacityCode(getColumnValue(recordRow, RecordColumnAliases.capacity)),
        conhecimento: normalizeText(getColumnValue(recordRow, RecordColumnAliases.knowledge)),
        curso: normalizeText(getColumnValue(recordRow, getCourseColumnAliases())),
        acertou: givenAnswer === correctAnswer
    };
}

function validateImportedSpreadsheetData(studentSummaries, answerRecords) {
    if (!Array.isArray(studentSummaries) || !studentSummaries.length) {
        throw new Error('Nenhum aluno válido foi encontrado na aba de resumo.');
    }

    if (!Array.isArray(answerRecords) || !answerRecords.length) {
        throw new Error('Nenhum registro válido foi encontrado na aba por registro.');
    }
}

function getFirstNonEmptyCourseFromRows(rowList) {
    for (const rowData of rowList) {
        const courseValue = normalizeText(getColumnValue(rowData, getCourseColumnAliases()));

        if (courseValue) {
            return courseValue;
        }
    }

    return '';
}

function getCompetencyItemsWorksheetAliases() {
    return [
        'D. por Competência - Itens',
        'D por Competencia - Itens',
        'D. por Competencia - Itens',
        'Desempenho por Competência - Itens',
        'Desempenho por Competencia - Itens'
    ];
}

function extractCourseNameFromWorksheetMatrix(worksheet) {
    if (!worksheet) {
        return '';
    }

    const matrixRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
    });

    const limitedRows = matrixRows.slice(0, 20);

    for (const rowValues of limitedRows) {
        for (let columnIndex = 0; columnIndex < rowValues.length; columnIndex += 1) {
            const currentCellValue = normalizeText(rowValues[columnIndex]);
            const normalizedCellValue = normalizeHeaderName(currentCellValue);

            if (!currentCellValue) {
                continue;
            }

            if (normalizedCellValue === 'curso') {
                const nextCellValue = normalizeText(rowValues[columnIndex + 1]);

                if (nextCellValue) {
                    return nextCellValue;
                }
            }

            if (normalizedCellValue.startsWith('curso:')) {
                return normalizeText(currentCellValue.split(':').slice(1).join(':'));
            }
        }
    }

    return '';
}

function resolveDetectedCourseKey(courseName) {
    const normalizedCourseName = normalizeHeaderName(courseName);

    if (!normalizedCourseName) {
        return '';
    }

    for (const [courseKey, courseConfig] of Object.entries(COURSE_CONFIG)) {
        const normalizedKey = normalizeHeaderName(courseKey);
        const normalizedDisplayName = normalizeHeaderName(courseConfig?.nome || '');

        if (
            normalizedCourseName === normalizedKey ||
            normalizedCourseName === normalizedDisplayName ||
            normalizedCourseName.includes(normalizedKey) ||
            normalizedKey.includes(normalizedCourseName) ||
            normalizedCourseName.includes(normalizedDisplayName) ||
            normalizedDisplayName.includes(normalizedCourseName)
        ) {
            return courseKey;
        }
    }

    return '';
}

function detectCourseInformation(workbook, rawRecordRows) {
    const detectedCourseNameFromRecords = getFirstNonEmptyCourseFromRows(rawRecordRows);

    if (detectedCourseNameFromRecords) {
        return {
            detectedCourseName: detectedCourseNameFromRecords,
            detectedCourseKey: resolveDetectedCourseKey(detectedCourseNameFromRecords)
        };
    }

    const competencyItemsWorksheet = findWorksheetByPossibleNames(
        workbook,
        getCompetencyItemsWorksheetAliases()
    );

    const detectedCourseNameFromCompetencyItems =
        extractCourseNameFromWorksheetMatrix(competencyItemsWorksheet);

    if (detectedCourseNameFromCompetencyItems) {
        return {
            detectedCourseName: detectedCourseNameFromCompetencyItems,
            detectedCourseKey: resolveDetectedCourseKey(detectedCourseNameFromCompetencyItems)
        };
    }

    return {
        detectedCourseName: '',
        detectedCourseKey: ''
    };
}

function readSpreadsheetData(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });

    const summaryWorksheet = findWorksheetByPossibleNames(workbook, WorkbookSheetAliases.summary);
    const recordsWorksheet = findWorksheetByPossibleNames(workbook, WorkbookSheetAliases.records);

    if (!summaryWorksheet || !recordsWorksheet) {
        throw new Error('As abas esperadas não foram encontradas.');
    }

    const rawSummaryRows = XLSX.utils.sheet_to_json(summaryWorksheet, {
        range: 8,
        defval: ''
    });

    const rawRecordRows = XLSX.utils.sheet_to_json(recordsWorksheet, {
        range: 4,
        defval: ''
    });

    const studentSummaries = rawSummaryRows
        .map(buildStudentSummary)
        .filter((studentSummary) =>
            studentSummary.nome &&
            ((studentSummary.acertos > 0) || (studentSummary.erros > 0))
        );

    const answerRecords = rawRecordRows
        .map(buildAnswerRecord)
        .filter(
            (answerRecord) =>
                answerRecord.aluno &&
                answerRecord.cap &&
                answerRecord.cap !== 'Cundefined' &&
                answerRecord.cap !== 'Cnull'
        );

    validateImportedSpreadsheetData(studentSummaries, answerRecords);

    const { detectedCourseName, detectedCourseKey } = detectCourseInformation(
        workbook,
        rawRecordRows
    );

    return {
        studentSummaries,
        answerRecords,
        detectedCourseName,
        detectedCourseKey
    };
}