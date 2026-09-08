const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const store = require('../models/store');

const CSV_PATH = path.join(__dirname, '../seed/raw_mplads_data.csv');

function parseNumeric(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const num = parseFloat(String(val).replace(/,/g, '').trim());
  return isNaN(num) ? fallback : num;
}

function ingestMPLADSCSV(customPath = CSV_PATH) {
  try {
    if (!fs.existsSync(customPath)) {
      console.warn(`[Ingest] Warning: CSV file not found at ${customPath}`);
      return { success: false, count: 0, message: 'CSV file not found' };
    }

    const csvContent = fs.readFileSync(customPath, 'utf8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });

    if (parsed.errors && parsed.errors.length > 0) {
      console.warn('[Ingest] CSV parsing produced warnings:', parsed.errors[0].message);
    }

    const rows = parsed.data || [];
    const requiredHeaders = [
      'MP Name', 'Constituency', 'Entitlement', 'FundReceivedGOI',
      'AmountAvailable', 'WorksRecommCost', 'WSCost',
      'ActualExpenditureIncurred', 'UtilizationOverRelease', 'UnspentBalance'
    ];

    if (rows.length > 0) {
      const sampleRow = rows[0];
      const missingHeaders = requiredHeaders.filter(h => !(h in sampleRow));
      if (missingHeaders.length > 0) {
        throw new Error(`Invalid CSV headers. Missing required fields: ${missingHeaders.join(', ')}`);
      }
    }

    const normalizedRecords = rows.map((row, idx) => {
      const entitlement = parseNumeric(row['Entitlement']);
      const fundReceivedGOI = parseNumeric(row['FundReceivedGOI']);
      const amountAvailable = parseNumeric(row['AmountAvailable']);
      const worksRecommCost = parseNumeric(row['WorksRecommCost']);
      const wsCost = parseNumeric(row['WSCost']);
      const actualExpenditure = parseNumeric(row['ActualExpenditureIncurred']);
      const utilizationOverRelease = parseNumeric(row['UtilizationOverRelease']);
      const unspentBalance = parseNumeric(row['UnspentBalance']);

      const utilizationRate = fundReceivedGOI > 0 ? actualExpenditure / fundReceivedGOI : 0;
      const unspentBalanceRatio = amountAvailable > 0 ? unspentBalance / amountAvailable : 0;
      const sanctionRatio = worksRecommCost > 0 ? wsCost / worksRecommCost : 0;
      const fundReleaseRatio = entitlement > 0 ? amountAvailable / entitlement : 0;
      const expenditureEfficiency = amountAvailable > 0 ? actualExpenditure / amountAvailable : 0;

      return {
        constituency_id: `CONST-${String(row['Sl No'] || idx + 1).padStart(3, '0')}`,
        sl_no: parseNumeric(row['Sl No'], idx + 1),
        mp_name: (row['MP Name'] || 'Unknown MP').trim(),
        constituency: (row['Constituency'] || 'Unknown Constituency').trim(),
        entitlement_cr: entitlement,
        fund_received_goi_cr: fundReceivedGOI,
        amount_available_cr: amountAvailable,
        works_recomm_cost_cr: worksRecommCost,
        ws_cost_cr: wsCost,
        actual_expenditure_cr: actualExpenditure,
        utilization_over_release_pct: utilizationOverRelease,
        unspent_balance_cr: unspentBalance,
        metrics: {
          utilization_rate: Math.min(Math.max(utilizationRate, 0), 2.0),
          unspent_balance_ratio: Math.min(Math.max(unspentBalanceRatio, 0), 1.0),
          sanction_ratio: Math.min(Math.max(sanctionRatio, 0), 1.0),
          fund_release_ratio: Math.min(Math.max(fundReleaseRatio, 0), 2.0),
          expenditure_efficiency: Math.min(Math.max(expenditureEfficiency, 0), 1.0)
        },
        source_type: 'CONSTITUENCY_AGGREGATE',
        data_level: 'CONSTITUENCY_LEVEL_FINANCIAL_DATA',
        ingested_at: new Date().toISOString()
      };
    });

    store.saveConstituencyData(normalizedRecords);
    console.log(`[Ingest] Successfully parsed and stored ${normalizedRecords.length} constituency records.`);

    return {
      success: true,
      count: normalizedRecords.length,
      sample: normalizedRecords[0] || null
    };
  } catch (err) {
    console.error('[Ingest] CSV Ingestion error:', err.message);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Imports Work-Level project items from CSV string or buffer
 */
function importWorksCSV(csvContent) {
  try {
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });

    const rows = parsed.data || [];
    if (rows.length === 0) {
      return { success: false, imported: 0, rejected: 0, errors: ['CSV file is empty or unreadable'] };
    }

    const existingWorks = store.getWorks();
    const importedWorks = [];
    const rejectedRows = [];

    rows.forEach((row, idx) => {
      const title = row.title || row.description || row['Work Name'] || row['Title'];
      if (!title || title.trim() === '') {
        rejectedRows.push({ row: idx + 1, reason: 'Missing work title or description' });
        return;
      }

      const cost = parseNumeric(row.sanctioned_amount || row.proposed_cost || row.cost || row['Sanctioned Amount']);
      const workId = (row.work_id || row['Work ID'] || `W-IMP-${Date.now()}-${idx + 1}`).trim();

      const workObj = {
        work_id: workId,
        mp_id: (row.mp_id || row.MP || row['MP ID'] || 'MP-GENERIC').trim(),
        title: title.trim(),
        description: title.trim(),
        constituency: (row.constituency || row['Constituency'] || 'General').trim(),
        state: (row.state || row['State'] || 'General').trim(),
        category: (row.category || row['Category'] || 'Community Infrastructure').trim(),
        proposed_cost: cost,
        sanctioned_amount: cost,
        expenditure: parseNumeric(row.expenditure || cost),
        implementing_agency: (row.implementing_agency || row.ia_id || row['Implementing Agency'] || 'District Executing Division').trim(),
        ia_id: (row.implementing_agency || row.ia_id || row['Implementing Agency'] || 'District Executing Division').trim(),
        recommendation_date: row.recommendation_date || row['Recommendation Date'] || '2024-01-10',
        sanction_date: row.sanction_date || row['Sanction Date'] || '2024-01-15',
        completion_date: row.completion_date || row['Completion Date'] || null,
        uc_date: row.uc_date || row.uc_filed_date || row['UC Date'] || null,
        uc_filed_date: row.uc_date || row.uc_filed_date || row['UC Date'] || null,
        location: row.location || row['Location'] || null,
        source: 'WORK_IMPORT',
        source_label: 'WORK CSV IMPORT',
        ingested_at: new Date().toISOString()
      };

      const existingIdx = existingWorks.findIndex(w => w.work_id === workId);
      if (existingIdx >= 0) {
        existingWorks[existingIdx] = workObj;
      } else {
        existingWorks.push(workObj);
      }
      importedWorks.push(workObj);
    });

    store.saveWorks(existingWorks);
    console.log(`[IngestWorks] Imported ${importedWorks.length} work items, ${rejectedRows.length} rejected.`);

    return {
      success: true,
      imported: importedWorks.length,
      rejected: rejectedRows.length,
      rejected_details: rejectedRows,
      total_works_now: existingWorks.length
    };
  } catch (err) {
    console.error('[IngestWorks] Error importing works CSV:', err.message);
    return { success: false, imported: 0, rejected: 0, errors: [err.message] };
  }
}

module.exports = {
  ingestMPLADSCSV,
  importWorksCSV
};
