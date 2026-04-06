# WhatsApp Integration - Quick Start Testing

## 🚀 Get Started in 2 Minutes

### Step 1: Verify Server is Running
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Check frontend is running
curl http://localhost:8080
```

**Backend should be on:** http://localhost:3001
**Frontend should be on:** http://localhost:8080

---

## 📱 Test Flow (Guided Step-by-Step)

### Part A: Admin Setup (Create WhatsApp-Enabled Event)

```
1. Open: http://localhost:8080/admin
   └─ Login with admin account
   
2. Click "Events" tab
   
3. Find "Add New Event" form, fill:
   ✓ Event Name: "WhatsApp Test Event"
   ✓ Date: Pick any future date  
   ✓ Venue: "Test Hall"
   ✓ Description: "Testing WhatsApp integration"
   ✓ Category: "Technical"
   ✓ Capacity: Leave empty (unlimited)

4. **IMPORTANT:** Check box: "Enable WhatsApp Notifications for this event"
   
5. Click "Add Event" button
   
6. Verify: Event appears in list with 📱 WhatsApp Enabled badge
```

**Console Output Expected:**
```
None yet - just database insert
```

---

### Part B: User Registration (With WhatsApp Enabled)

```
1. Open: http://localhost:8080/register
   └─ Login/Register as user (not admin)
   
2. Select event: "WhatsApp Test Event" from dropdown
   
3. Fill registration form:
   ✓ Name: "Test User"
   ✓ Roll Number: "2024001"
   ✓ Department: "CSE"
   ✓ Phone: "9876543210" (exactly 10 digits)
   
4. Click "Register" button

5. **Success Modal appears:**
   ✓ Shows "Remind Me" modal
   ✓ Event details displayed
   ✓ **Green WhatsApp box visible** with checkbox
   ✓ Text shows: "📱 Also notify via WhatsApp"
   ✓ Phone preview: "Send reminder to 9876543210"
```

**Console Output Expected:**
```
[WhatsApp MOCK] registration message queued for +919876543210
Message: 🎉 *Event Registration Confirmed!*
  Event: WhatsApp Test Event
  Date: 2024-04-15
  ...
```

---

### Part C: Set Reminder WITH WhatsApp

```
1. In "Remind Me" modal from Part B:

2. **Check the WhatsApp checkbox:**
   ✓ Green checkbox gets checked
   ✓ Phone number remains visible

3. Click "Set Reminder" button

4. **Two success toasts appear:**
   ✓ Toast 1: "Reminder set for WhatsApp Test Event!"
   ✓ Toast 2: "WhatsApp reminder enabled! You'll also receive a WhatsApp message." (green)

5. Modal closes and you're back on Register page
```

**Console Output Expected:**
```
[WhatsApp] Sending reminder to +919876543210
[WhatsApp MOCK] reminder message queued for +919876543210
Message: ⏰ *Event Reminder!*
  Event: WhatsApp Test Event
  Date: 2024-04-15
  ...
```

---

### Part D: Test WITHOUT WhatsApp (Skip Option)

```
1. Register again for a different event (or same, different user)
   
2. In "Remind Me" modal:
   ✓ Leave WhatsApp checkbox **UNCHECKED**
   
3. Click "Set Reminder"

4. **One success toast:**
   ✓ "Reminder set for [Event]!"
   ✓ **No WhatsApp confirmation toast**
   
5. Modal closes
```

**Console Output Expected:**
```
No [WhatsApp MOCK] or [WhatsApp] messages
Only database reminder insert
```

---

### Part E: Admin Disables WhatsApp for Event

```
1. Go back to Admin Dashboard → Events

2. Find "WhatsApp Test Event" 

3. Click Edit button (pencil icon)
   
4. In edit form:
   ✓ **Uncheck:** "Enable WhatsApp Notifications"
   
5. Click "Save"

6. Event card updates:
   ✓ 📱 WhatsApp Enabled badge **DISAPPEARS**
```

**Result:** Users registering now won't see WhatsApp checkbox!

---

## 🔍 Database Verification

Open a terminal and check messages were logged:

```bash
# Navigate to project
cd "c:\Users\Venkat Arunn Reddy\OneDrive\Desktop\campusconnect\newCampusConnect"

# Connect to SQLite
sqlite3 database.db

# Inside sqlite3:
SELECT id, user_id, phone_number, message_type, status, created_at 
FROM whatsapp_messages 
ORDER BY created_at DESC LIMIT 5;

# Exit
.quit
```

**Expected output (3 rows from test flow):**
```
| id                                   | user_id | phone_number | message_type | status | created_at        |
|--------------------------------------|---------|--------------|--------------|--------|-------------------|
| uuid-3                               | user-id | +919876..    | reminder     | pending| 2024-04-07 ...    |
| uuid-2                               | user-id | +919876..    | registration | pending| 2024-04-07 ...    |
| uuid-1                               | user-id | +919876..    | reminder     | pending| 2024-04-07 ...    |
```

---

## ✅ Success Checklist

After running through all parts above, verify:

- [ ] Admin can create events with WhatsApp toggle (Part A)
- [ ] Events show 📱 WhatsApp Enabled badge (Part A)
- [ ] User sees WhatsApp checkbox in reminder modal (Part B)
- [ ] WhatsApp checkbox is checked by default? **Should be unchecked**
- [ ] Registration notification sent to console (Part B)
- [ ] Two toasts appear when WhatsApp enabled (Part C)
- [ ] Reminder notification sent to console (Part C)
- [ ] Single toast when WhatsApp disabled (Part D)
- [ ] No WhatsApp messages when unchecked (Part D)
- [ ] Admin can disable WhatsApp per event (Part E)
- [ ] Messages logged in database (Verification)
- [ ] All messages have +91 country code (Verification)
- [ ] No browser console errors
- [ ] No server errors

---

## 🐛 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| WhatsApp checkbox not showing | Event must have `enable_whatsapp = 1`. Check Admin enabled it. |
| Phone validation fails | Must be exactly 10 digits `9876543210`. No formatting. |
| No console logs | Check backend terminal. Logs appear where `npm run dev` runs. |
| Toasts don't appear | Check React dev tools. Look for errors in Console tab. |
| Database not updated | Check user is logged in. API needs auth credentials. |
| Event not showing WhatsApp badge | Refresh page or check `enable_whatsapp` value in database. |

---

## 📊 Live Testing Checklist

```
[ ] Open http://localhost:8080/admin
[ ] Open backend console in separate terminal
[ ] Create event with WhatsApp enabled
[ ] Register for event with phone 9876543210
[ ] See WhatsApp box in reminder modal
[ ] Check WhatsApp checkbox
[ ] Click "Set Reminder"
[ ] Verify toasts appear
[ ] Check backend console for [WhatsApp MOCK] logs
[ ] Open sqlite3 and verify database entries
[ ] Uncheck and register again (no WhatsApp)
[ ] Verify single toast only (Part D)
[ ] Edit event to disable WhatsApp
[ ] Register again - WhatsApp box should NOT appear
[ ] All checks passed? ✅ Integration Complete!
```

---

## 💡 Pro Tips

1. **Check console for logs:**
   ```bash
   # In the terminal where you ran "npm run dev"
   # Look for lines starting with "[WhatsApp"
   ```

2. **Reset database for clean test:**
   ```bash
   rm database.db
   npm run dev  # Will recreate database
   ```

3. **Monitor both terminals:**
   - Terminal 1: Frontend & Backend (npm run dev)
   - Terminal 2: SQLite queries & verification

4. **Use same browser tab:**
   - Admin creates event
   - User registers in different browser tab
   - Check both see correct behavior

5. **Test with different phone numbers:**
   - Valid: 9876543210, 8765432109
   - Invalid: 123 (too short), 12345678901 (too long), abc (letters)

---

## 🎯 Expected Test Duration

- Setup & Admin (Part A): 2-3 minutes
- Registration & WhatsApp (Parts B-C): 2-3 minutes  
- Verification & Edge Cases (Parts D-E): 3-5 minutes

**Total: ~10 minutes for complete end-to-end test**

---

## 📝 Notes

- System currently runs in **MOCK mode** - no real WhatsApp sent
- All messages logged to console and database
- To enable real WhatsApp: Update .env with Twilio credentials
- Phone numbers auto-formatted: 9876543210 → +919876543210
