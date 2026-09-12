# Connecting the Artifix Waitlist Form to Google Sheets

Follow these quick steps (takes ~2 minutes) to have all waitlist submissions automatically saved into a Google Spreadsheet in real time.

---

### Step 1: Create a Google Spreadsheet

1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named **"Artifix Waitlist"**.
2. In Row 1, add these exact column headers:
   - **Column A**: `Timestamp`
   - **Column B**: `Name`
   - **Column C**: `Email`
   - **Column D**: `Role`
   - **Column E**: `Craft or Skill`

---

### Step 2: Add the Google Apps Script

1. In your spreadsheet menu, click **Extensions** > **Apps Script**.
2. Delete any existing code in the editor and paste the following script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      new Date(),
      data.name || '',
      data.email || '',
      data.role || '',
      data.craftOrSkill || 'N/A'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click the **Save** icon (floppy disk) or press `Ctrl + S` / `Cmd + S`.

---

### Step 3: Deploy as a Web App

1. Click the blue **Deploy** button (top right) > **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and select **Web app**.
3. Fill in the deployment details:
   - **Description**: `Artifix Waitlist Webhook`
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(Crucial: allows the landing page to post submissions)*
4. Click **Deploy**.
5. If prompted, click **Authorize access**, select your Google account, click **Advanced**, and then click **Go to Untitled project (unsafe)** to grant permissions.
6. Copy the **Web app URL** (it will look like `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Step 4: Add the URL to Your Frontend Environment

In your frontend project directory (`/Users/mac/Artisan/frontend`), add this line to your `.env` file (create `frontend/.env` if it doesn't exist):

```env
VITE_WAITLIST_SHEET_URL="https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec"
```

*Note: If `VITE_WAITLIST_SHEET_URL` is empty, the form continues to work seamlessly in demo mode, saving submissions to the browser's `localStorage`.*
