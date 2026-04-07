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
 *
 * IMPORTANT: The Drive folder must be shared as "Anyone with the link can view"
 */

const SHEET_NAME = 'Leads';
const DRIVE_FOLDER_ID = '1SrvRymRHSz3cI-I_-JDw6joX7rlW-3Cf';

/* ── GET: serves video list from Drive ── */
function doGet(e) {
  if (e?.parameter?.action === 'get_works') {
    return getWorksFromDrive();
  }
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getWorksFromDrive() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const files  = folder.getFiles();
    const videos = [];

    while (files.hasNext()) {
      const file = files.next();
      const mime = file.getMimeType();
      if (mime.startsWith('video/')) {
        const id = file.getId();
        videos.push({
          id:    id,
          name:  file.getName().replace(/\.[^/.]+$/, ''), // strip extension
          embed: 'https://drive.google.com/file/d/' + id + '/preview',
          thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w800'
        });
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', videos: videos }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── POST: handles lead form + booking update ── */
function doPost(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    const data  = e.parameter;

    if (data.action === 'update_booking') {
      updateBooking(sheet, data.email, data.meeting_booked, data.meeting_date);
    } else {
      sheet.appendRow([
        data.name   || '',
        data.phone  || '',
        data.email  || '',
        data.source || '',
        data.date   || new Date().toLocaleString('he-IL'),
        'לא',
        ''
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
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) {
      sheet.getRange(i + 1, 6).setValue(booked);
      sheet.getRange(i + 1, 7).setValue(meetingDate);
      break;
    }
  }
}
