# Test Digital Signature Verification

## Quick Test Steps

### 1. Check Browser Console

1. Open registration page: `http://localhost:3000/register`
2. Open browser console: Press `F12` → Click "Console" tab
3. Select a non-customer role (e.g., Manufacturer)
4. Fill in basic info
5. Upload ANY PDF file as certificate
6. **Look for these logs in console:**

```
🔍 [Frontend] Starting verification for: your-file.pdf
📄 [Frontend] File size: XXXXX bytes
📄 [Frontend] File type: application/pdf
🌐 [Frontend] Calling API: http://localhost:5000/api/signature/verify
```

### If you DON'T see these logs:
The `verifyCertificateSignature` function is not being called. This means:
- Frontend server needs restart
- Or the file upload handler isn't triggering verification

### If you see logs but get an error:
Share the error message from console

---

## 2. Test Backend API Directly

Open a new PowerShell terminal and run:

```powershell
# Create a test request (use any PDF file you have)
$file = "C:\path\to\any\file.pdf"
curl.exe -X POST http://localhost:5000/api/signature/verify -F "certificate=@$file"
```

**Expected**: You should see JSON response AND Cloudmersive dashboard should show 1 call

---

## 3. Check Backend .env File

Run this command:

```powershell
cd backend
Get-Content .env | Select-String "CLOUDMERSIVE"
```

**Expected output:**
```
CLOUDMERSIVE_API_KEY=16d1a581-29e2-441c-80b6-85a09cec61e5
```

If you don't see this, add it to `backend/.env`:
```
CLOUDMERSIVE_API_KEY=16d1a581-29e2-441c-80b6-85a09cec61e5
```

Then restart backend server.

---

## 4. Verify Backend Logs

When you upload a file, backend console should show:

```
🔍 Starting digital signature verification for: uploads/temp/verify-xxxxx.pdf
📄 File read successfully, size: XXXXX bytes
📊 Cloudmersive API Response: { ... }
```

**If you don't see these logs:**
- The request isn't reaching the backend
- Check CORS or network issues

---

## Most Likely Issues

### Issue A: Frontend not calling verification
**Fix**: Restart frontend server
```bash
cd frontend
npm start
```

### Issue B: API key not in .env
**Fix**: Add to `backend/.env`:
```
CLOUDMERSIVE_API_KEY=16d1a581-29e2-441c-80b6-85a09cec61e5
```
Then restart backend.

### Issue C: Backend route not working
**Test**: Use curl command above to test directly

---

## What to Share

Please share:
1. **Browser console output** (everything you see after uploading)
2. **Backend console output** (what backend prints)
3. **Result of curl test** (if you try it)

This will help me identify exactly where it's failing.
