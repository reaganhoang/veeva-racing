/**
 * VEEVA RACING – Google Apps Script
 * ===================================
 * HOW TO DEPLOY (one-time setup, ~3 minutes):
 *
 *  1. Open the Google Sheet:
 *     https://docs.google.com/spreadsheets/d/1TM2Q1KlDLV34SY7ANg_gi-97ZrNZLQjvgwF0HVyJFOg
 *
 *  2. Click Extensions → Apps Script
 *
 *  3. Delete any existing code and paste THIS entire file.
 *
 *  4. Click Deploy → New Deployment
 *       Type:          Web app
 *       Execute as:    Me
 *       Who has access: Anyone
 *     → Click Deploy → copy the Web app URL
 *
 *  5. Add the URL to your game's .env file:
 *       VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXX/exec
 *
 *  6. Run setupHeaders() once manually (Functions dropdown → Run) to
 *     create the header row.
 *
 *  NOTE: After any script change, do Deploy → Manage Deployments → Edit →
 *        bump the version so the new code goes live.
 */

const SHEET_NAME = 'Leaderboard'   // Change if your tab has a different name

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  return ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet()
}

function msToTime(ms) {
  if (!ms || ms <= 0) return '--'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis  = ms % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function corsHeaders() {
  // These are applied to GET responses; POST uses no-cors so headers are not read.
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// ── One-time setup ────────────────────────────────────────────────────────────
// Column layout: A=Timestamp  B=Driver Name  C=Total Time  D=Rank  E=_ms (hidden sort key)
// If you previously ran the old setupHeaders(), clear all rows first then run this again.

function setupHeaders() {
  const sheet = getSheet()
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Driver Name', 'Total Time', 'Rank', '_ms'])
    sheet.setFrozenRows(1)
    // Style the four visible headers (A–D); leave E unstyled
    sheet.getRange(1, 1, 1, 4)
      .setBackground('#FF5F00')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
    // Hide the sort-key column so the sheet looks clean
    sheet.hideColumns(5)
  }
}

// ── Shared: write one race result row, then re-sort and re-rank ───────────────

function appendResult(driverName, bestLapMs, totalTimeMs, lapTimes, timestamp) {
  const sheet = getSheet()
  const ms    = Number(totalTimeMs) || 0

  // Append new row — Rank (col D) is blank until we recompute below
  sheet.appendRow([
    timestamp || new Date().toISOString(),
    String(driverName || '').slice(0, 40),
    msToTime(ms),
    '',
    ms,
  ])

  // Sort all data rows by col E (totalTimeMs) fastest → slowest
  const lastRow = sheet.getLastRow()
  if (lastRow > 2) {
    sheet.getRange(2, 1, lastRow - 1, 5).sort({ column: 5, ascending: true })
  }

  // Rewrite col D with sequential rank numbers
  const dataRows = lastRow - 1
  if (dataRows > 0) {
    const ranks = Array.from({ length: dataRows }, function(_, i) { return [i + 1] })
    sheet.getRange(2, 4, dataRows, 1).setValues(ranks)
  }
}

// ── GET: submit result OR return leaderboard ──────────────────────────────────
// The game uses GET?action=submit because a POST to Apps Script triggers a 302
// redirect that drops the request body. GET params reach doGet without redirects.

function doGet(e) {
  const p      = e.parameter || {}
  const action = p.action || 'leaderboard'

  if (action === 'submit') {
    try {
      const laps = JSON.parse(p.lapTimes || '[]')
      appendResult(p.driverName, p.bestLapMs, p.totalTimeMs, laps, p.timestamp)
      return jsonResponse({ ok: true })
    } catch (err) {
      return jsonResponse({ ok: false, error: String(err) })
    }
  }

  if (action === 'leaderboard') {
    const driver  = p.driver || ''
    const sheet   = getSheet()
    const lastRow = sheet.getLastRow()

    if (lastRow <= 1) return jsonResponse([])

    // Columns: A=Timestamp B=Driver Name C=Total Time (formatted) D=Rank E=_ms
    const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues()
    let entries = rows
      .filter(r => r[0] && r[1])
      .map(r => ({
        timestamp:   String(r[0] instanceof Date ? r[0].toISOString() : r[0]),
        driverName:  String(r[1]),
        totalTime:   String(r[2]),
        rank:        Number(r[3]) || 0,
        totalTimeMs: Number(r[4]) || 0,
      }))

    if (driver) {
      const lc = driver.toLowerCase()
      entries = entries.filter(e => e.driverName.toLowerCase().includes(lc))
    }

    // Sheet is already sorted; re-sort here only as a safety net
    entries.sort((a, b) => a.totalTimeMs - b.totalTimeMs)
    return jsonResponse(entries.slice(0, 100))
  }

  return jsonResponse({ ok: false, error: 'unknown action' })
}

// ── POST: fallback (kept in case the URL is called directly) ─────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    if (data.action !== 'submit') return jsonResponse({ ok: false, error: 'unknown action' })
    const laps = (data.lapTimes || [])
    appendResult(data.driverName, data.bestLapMs, data.totalTimeMs, laps, data.timestamp)
    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) })
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function jsonResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
  return output
}
