# WhatsApp Integration End-to-End Test Plan

## Environment
- **Frontend:** http://localhost:8080
- **Backend:** http://localhost:3001
- **Mode:** Mock (console logging)
- **Database:** SQLite (local)

## Test Scenarios

### ✅ Scenario 1: Admin Creates Event with WhatsApp Enabled

**Steps:**
1. Navigate to http://localhost:8080/admin
2. Go to "Events" tab
3. Fill event form:
   - Event Name: "Tech Fest 2024"
   - Date: Pick any future date
   - Venue: "Main Auditorium"
   - Description: "Annual tech event"
   - Category: "Technical"
4. **Check the "Enable WhatsApp Notifications for this event" checkbox**
5. Click "Add Event"

**Expected Result:**
- Event created successfully
- Event appears in list with `📱 WhatsApp Enabled` badge

---

### ✅ Scenario 2: User Registers for WhatsApp-Enabled Event

**Steps:**
1. Login/Register at http://localhost:8080/register
2. Select the event created in Scenario 1 ("Tech Fest 2024")
3. Fill registration form:
   - Name: "John Doe"
   - Roll Number: "CSE2024001"
   - Department: "CSE"
   - Phone: "9876543210" (10 digits)
4. Click "Register"

**Expected Result:**
- Registration successful
- "Remind Me" modal appears
- **Console log:** `[WhatsApp MOCK] registration message queued for +919876543210`

---

### ✅ Scenario 3: WhatsApp Checkbox Appears in Reminder Modal

**Steps:**
1. From Scenario 2, in the "Remind Me" modal:
   - Check event details are displayed
   - **Look for WhatsApp checkbox** with text "📱 Also notify via WhatsApp"
   - Green-themed box showing phone number

**Expected Result:**
- WhatsApp checkbox visible (only if phone number was entered)
- Phone number displayed: "Send reminder to 9876543210"
- Checkbox is unchecked by default

---

### ✅ Scenario 4: User Sets Reminder with WhatsApp Enabled

**Steps:**
1. In the "Remind Me" modal:
2. **Check the WhatsApp checkbox** "📱 Also notify via WhatsApp"
3. Click "Set Reminder" button

**Expected Result:**
- Toast: "Reminder set for Tech Fest 2024! You'll get an email notification."
- Toast: "WhatsApp reminder enabled! You'll also receive a WhatsApp message." (green toast)
- Modal closes
- **Console logs show:**
  ```
  [WhatsApp] Sending reminder to +919876543210
  [WhatsApp MOCK] reminder message queued for +919876543210
  ```

---

### ✅ Scenario 5: Skip WhatsApp Notification

**Steps:**
1. Register again with a **new event** (or same event from different account)
2. In "Remind Me" modal:
3. **Leave WhatsApp checkbox unchecked**
4. Click "Set Reminder"

**Expected Result:**
- Toast: "Reminder set for [Event]! You'll get an email notification."
- **No WhatsApp-related toast**
- Console log shows reminder registered but **no WhatsApp message**

---

### ✅ Scenario 6: Admin Disables WhatsApp for Event

**Steps:**
1. Go to Admin Dashboard → Events
2. Find event from Scenario 1
3. Click Edit button on that event
4. **Uncheck "Enable WhatsApp Notifications"**
5. Click Save

**Expected Result:**
- Event updated
- `📱 WhatsApp Enabled` badge **removed** from event card
- User should no longer see WhatsApp checkbox in reminder modal

---

### ✅ Scenario 7: Phone Number Validation

**Steps:**
1. Register with phone number: "1234567" (too short)

**Expected Result:**
- Form validation error: "Enter a valid 10-digit phone number"
- Cannot submit registration

**Steps 2:**
1. Register with valid phone: "9876543210"
2. In reminder modal, check WhatsApp option is available

**Expected Result:**
- WhatsApp checkbox visible
- Phone formatted automatically to +919876543210

---

## Database Verification

### Check WhatsApp Messages Logged

```bash
# Connect to SQLite
sqlite3 database.db

# Query registered messages
SELECT 
  id, 
  user_id, 
  phone_number, 
  event_id, 
  message_type, 
  status, 
  created_at 
FROM whatsapp_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected columns:**
- `id` - UUID of message log
- `user_id` - User who triggered notification
- `phone_number` - Formatted phone (+91XXXXXXXXXX)
- `event_id` - Event the message is about
- `message_type` - "registration" or "reminder"
- `status` - "pending", "sent", or "failed" (in mock: should be "sent")
- `created_at` - Timestamp

---

## Console Log Expectations

### When Admin Creates Event with WhatsApp:
```
No console output (only event created in database)
```

### When User Registers for WhatsApp-Enabled Event:
```
[WhatsApp MOCK] registration message queued for +919876543210
Message: 🎉 *Event Registration Confirmed!*
...
```

### When User Sets Reminder with WhatsApp:
```
[WhatsApp] Sending reminder to +919876543210
[WhatsApp MOCK] reminder message queued for +919876543210
Message: ⏰ *Event Reminder!*
...
```

### When Event Has WhatsApp Disabled:
```
No WhatsApp console logs (even if user checks box)
```

---

## Frontend UI Checklist

- [ ] Admin can see "Enable WhatsApp Notifications for this event" checkbox in event creation form
- [ ] Admin can see "Enable WhatsApp Notifications" checkbox in event edit form
- [ ] Event cards show `📱 WhatsApp Enabled` badge when enabled
- [ ] User sees WhatsApp option in reminder modal for enabled events
- [ ] WhatsApp checkbox has green styling with emoji icon
- [ ] Phone number preview shown in WhatsApp option
- [ ] Toast notifications appear for WhatsApp confirmation
- [ ] Form validation for phone numbers (10 digits required)

---

## API Endpoint Testing

### Test Registration Notification (Manual)

```bash
curl -X POST http://localhost:3001/api/whatsapp/notify-registration \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "eventId": "event-id-here",
    "eventName": "Tech Fest",
    "eventDate": "2024-04-15",
    "eventVenue": "Main Hall"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Notification queued",
  "messageId": "message-id-uuid"
}
```

### Test Reminder Notification (Manual)

```bash
curl -X POST http://localhost:3001/api/whatsapp/notify-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "eventId": "event-id-here",
    "eventName": "Tech Fest",
    "eventDate": "2024-04-15",
    "eventVenue": "Main Hall"
  }'
```

---

## Troubleshooting

### WhatsApp checkbox not showing in modal
- ✅ Check event has `enable_whatsapp = 1` in database
- ✅ Verify user entered phone number in registration form
- ✅ Check browser console for React errors
- ✅ Verify `enableWhatsApp` state in Register.tsx component

### Messages not logged to database
- ✅ Check backend logs for errors
- ✅ Verify `whatsapp_messages` table exists: `sqlite3 database.db ".schema whatsapp_messages"`
- ✅ Check user authentication (API endpoints require auth)
- ✅ Verify database path in .env matches actual location

### No console output for WhatsApp
- ✅ Check `WHATSAPP_ENABLED=true` in .env (or process.env)
- ✅ Check `WHATSAPP_SERVICE_TYPE=mock` in .env
- ✅ Verify backend logs are being captured
- ✅ Check for errors in server output

### Phone number validation fails
- ✅ Must be exactly 10 digits: 9876543210
- ✅ System adds +91 prefix automatically
- ✅ Other country codes: provide with country code (e.g., 12015551234 for US)

---

## Success Criteria

**All tests pass when:**

✅ Admin can create/edit events with WhatsApp toggle
✅ Events show WhatsApp enabled badge
✅ Users see WhatsApp checkbox only for enabled events
✅ WhatsApp notifications recorded in database
✅ Console logs show mock messages
✅ Phone numbers formatted with +91 country code
✅ Form validation prevents invalid phone numbers
✅ Toasts appear for user feedback
✅ No errors in browser or server console

---

## Next Steps After Testing

1. **Deploy to staging:** Move to production-like environment
2. **Integrate real Twilio:** Update .env with TWILIO_ACCOUNT_SID and TOKEN
3. **Load testing:** Verify performance with high message volume
4. **User acceptance testing:** Have real users test the flow
5. **Monitor:** Set up logging and alerting for WhatsApp failures
