# OCR Setup Guide - Google Cloud Vision API

This guide explains how to set up Google Cloud Vision API for OCR (Optical Character Recognition) on scanned PDFs.

## Why OCR?

The app now supports **scanned PDFs** (PDFs that are images) using Google Cloud Vision API. When a PDF has less than 100 characters of extractable text, the system automatically:

1. Converts the PDF to an image
2. Calls Google Cloud Vision API to extract text
3. Parses the extracted text as a normal workout plan

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID**

### 2. Enable Vision API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for **"Cloud Vision API"**
3. Click **Enable**

### 3. Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name it something like `fitness-app-ocr`
4. Click **Create and Continue**
5. Grant role: **Cloud Vision API User**
6. Click **Done**

### 4. Create JSON Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create**
6. A JSON file will be downloaded - this is your credentials file

### 5. Configure Backend

1. **Rename the downloaded JSON file** to `google-cloud-key.json`
2. **Move it to** `backend/google-cloud-key.json` (same directory as package.json)
3. **Update `.env` file** with your project ID:

```env
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_APPLICATION_CREDENTIALS=./google-cloud-key.json
```

### 6. Security Check

**⚠️ IMPORTANT:** The `google-cloud-key.json` file contains sensitive credentials!

- ✅ It's already in `.gitignore` - DO NOT commit it to Git
- ✅ Keep it private and secure
- ✅ Never share it publicly

### 7. Test OCR

1. Restart your backend server:
   ```bash
   npm start
   ```

2. Check logs for:
   ```
   ✅ Google Cloud Vision OCR initialized successfully
   ```

3. Try uploading a scanned PDF (an image saved as PDF)
4. Check logs for OCR activity:
   ```
   🔍 PDF text too short, attempting OCR...
   🖼️ Converting PDF to image for OCR...
   ☁️ Calling Google Vision API...
   ✅ OCR extracted X characters
   ```

## Pricing

Google Cloud Vision API has a **free tier**:
- **First 1,000 requests per month: FREE**
- After that: ~$1.50 per 1,000 images

For typical usage (a few PDFs per day), you'll stay within the free tier.

## Troubleshooting

### "OCR service not configured"
- Check that `.env` has correct `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS`
- Verify `google-cloud-key.json` exists in the backend directory

### "Permission denied"
- Make sure Cloud Vision API is enabled in your project
- Verify the service account has the "Cloud Vision API User" role

### "Quota exceeded"
- You've exceeded the free tier (1,000 requests/month)
- Check your usage in Google Cloud Console > Vision API > Quotas

### "Invalid credentials"
- The JSON key file might be corrupted or invalid
- Create a new key from Google Cloud Console

## Without OCR

If you don't set up Google Cloud Vision:
- The app will still work normally for **text-based PDFs** and **Excel files**
- Scanned PDFs will show an error message asking for text-based PDFs
- You'll see a warning in logs: `⚠️ Google Cloud Vision not configured. OCR will be disabled.`

## Testing

To test OCR functionality:

1. **Create a test scanned PDF:**
   - Open a Word document with a workout plan
   - Take a screenshot or export as image
   - Use an online tool to convert the image to PDF

2. **Upload in the app:**
   - Use the "Importa Piano" feature
   - Select your scanned PDF
   - Check backend logs for OCR activity

3. **Verify:**
   - The workout plan should be parsed successfully
   - You'll see a warning: "⚠️ Questo PDF è stato elaborato tramite OCR. Verifica attentamente i dati."

## Advanced: Multi-Page PDFs

Currently, only the **first page** is processed for OCR to save costs and time. If you need multi-page support:

1. Edit `pdfParser.ts`
2. Change `page: 1` to `page: null` in the conversion options
3. Update the OCR call to use `extractTextFromImages()` instead of `extractTextFromImage()`

Note: This will increase API usage and costs proportionally to page count.
