const splitCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
};

export const parseCertificateCsv = async (file) => {
  const text = await file.text();
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    throw new Error('CSV must include a header row and at least one certificate');
  }

  const headers = splitCsvLine(rows[0]).map((header) => header.toLowerCase());
  const requiredHeaders = ['certificateid', 'studentname', 'registernumber', 'course'];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}`);
  }

  return rows.slice(1).map((line, rowIndex) => {
    const values = splitCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));

    return {
      rowNumber: rowIndex + 2,
      certificateId: record.certificateid,
      studentName: record.studentname,
      registerNumber: record.registernumber,
      course: record.course,
    };
  });
};

export const batchTemplateCsv = [
  'certificateId,studentName,registerNumber,course',
  'CERT-2026-001,Ada Lovelace,REG-2026-001,Computer Science',
  'CERT-2026-002,Grace Hopper,REG-2026-002,Information Systems',
].join('\n');
