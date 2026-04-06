/**
 * FRAMEIM STUDIOS — Google Apps Script
 * ======================================
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with these columns (Row 1 headers):
 *    A: שם | B: טלפון | C: מייל | D: דף מקור | E: תאריך ושעה | F: פגישה נקבעה | G: תאריך פגישה
 *
 * 2. In Google Sheets → Extensions → Apps Script → paste this code
 * 3. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL → paste into js/main.js as SCRIPT_URL
 */

const SHEET_NAME = 'Leads';

function doPost(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    const data  = e.parameter;

    if (data.action === 'update_booking') {
      // Update existing row by matching email
      updateBooking(sheet, data.email, data.meeting_booked, data.meeting_date);
    } else {
      // New lead
      sheet.appendRow([
        data.name   || '',
        data.phone  || '',
        data.email  || '',
        data.source || '',
        data.date   || new Date().toLocaleString('he-IL'),
        'לא',  // meeting booked default
        ''     // meeting date empty
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateBooking(sheet, email, booked, meetingDate) {
  const data    = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) { // column C = email
      sheet.getRange(i + 1, 6).setValue(booked);     // column F
      sheet.getRange(i + 1, 7).setValue(meetingDate); // column G
      break;
    }
  }
}

// Handle CORS preflight
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
