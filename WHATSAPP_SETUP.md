# WhatsApp Integration Setup Guide

## Overview
CampusConnect now supports WhatsApp notifications for event registrations and reminders. Admin can enable/disable WhatsApp per event, and users can opt-in when setting reminders.

## Architecture

### Backend Components
- **`server/whatsapp.mjs`** - WhatsApp service module with Twilio integration
- **`server/index.mjs`** - API endpoints for WhatsApp notifications
- **`database/init.sql`** - Database tables for WhatsApp tracking

### Frontend Components
- **`src/pages/Admin.tsx`** - Admin controls to enable WhatsApp per event
- **`src/pages/Register.tsx`** - User-facing WhatsApp checkbox in reminder modal

### Database Tables
- **`events`** - Added `enable_whatsapp` column (boolean)
- **`whatsapp_messages`** - Logs all WhatsApp notification attempts (sender, recipient, status, error tracking)
- **`whatsapp_settings`** - Admin configuration storage

## Setup Instructions

### 1. Development Mode (Mock Implementation)

Perfect for testing without sending real WhatsApp messages.

```bash
# Create .env file in project root
cp .env.example .env

# Configure for mock mode
WHATSAPP_ENABLED=true
WHATSAPP_SERVICE_TYPE=mock
```

**Result:** Messages logged to console instead of sent

### 2. Production Mode (Twilio Integration)

#### Prerequisites
- Twilio account (https://www.twilio.com/)
- Registered WhatsApp Business Phone Number
- Account SID and Auth Token from Twilio Console

#### Steps

1. **Get Twilio Credentials**
   - Log in to https://www.twilio.com/console
   - Copy "Account SID"
   - Copy "Auth Token"
   - Go to Messaging → Try it out → WhatsApp
   - Register your sender phone number (format: +91XXXXXXXXXX for India)

2. **Update .env file**
   ```env
   WHATSAPP_ENABLED=true
   WHATSAPP_SERVICE_TYPE=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   WHATSAPP_SENDER_NUMBER=+91XXXXXXXXXX
   ```

3. **Restart Server**
   ```bash
   npm run dev
   ```

## Admin Configuration

### Enable WhatsApp for an Event

1. Open Admin Dashboard (`/admin`)
2. Click "Events" tab
3. **Creating new event:**
   - Fill event details
   - Check "Enable WhatsApp Notifications for this event"
   - Click "Add Event"

4. **Editing existing event:**
   - Click Edit button on event card
   - Check/uncheck "Enable WhatsApp Notifications"
   - Click "Save"

### Visual Indicators
- Events with WhatsApp enabled show `📱 WhatsApp Enabled` badge

## User Experience

### Event Registration Flow
1. User registers for event
2. If event has WhatsApp enabled: WhatsApp notification sent immediately (optional)
3. Shows "Remind Me" modal

### Reminder Flow
1. User clicks "Remind Me" button
2. Modal shows checkbox: "Also notify via WhatsApp"
3. If checked & phone number provided:
   - Database reminder created
   - WhatsApp message sent
   - Toast shows confirmation

### Phone Number Handling
- 10-digit Indian numbers automatically formatted: 9876543210 → +919876543210
- Other formats with country code preserved as-is

## API Endpoints

### POST `/api/whatsapp/notify-registration`
Send WhatsApp notification when user registers for event.

**Body:**
```json
{
  "phoneNumber": "9876543210",
  "eventId": "event-uuid",
  "eventName": "Tech Fest 2024",
  "eventDate": "2024-04-15",
  "eventVenue": "Main Auditorium"
}
```

### POST `/api/whatsapp/notify-reminder`
Send WhatsApp notification when user sets reminder.

**Body:**
```json
{
  "phoneNumber": "9876543210",
  "eventId": "event-uuid",
  "eventName": "Tech Fest 2024",
  "eventDate": "2024-04-15",
  "eventVenue": "Main Auditorium"
}
```

## Message Format

### Registration Message
```
🎉 *Event Registration Confirmed!*

Event: Tech Fest 2024
Date: 2024-04-15
Time: Check email for details
Venue: Main Auditorium

✅ You're all set! See you there!

For more details, visit CampusConnect.
```

### Reminder Message
```
⏰ *Event Reminder!*

Event: Tech Fest 2024
Date: 2024-04-15
Time: Check email for details
Venue: Main Auditorium

Don't miss out! See you soon! 🚀
```

## Database Queries

### Check WhatsApp Messages Log
```sql
SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 10;
```

### Find Failed Messages
```sql
SELECT * FROM whatsapp_messages WHERE status = 'failed';
```

### Check WhatsApp-Enabled Events
```sql
SELECT name, enable_whatsapp FROM events WHERE enable_whatsapp = 1;
```

## Troubleshooting

### Messages not sending in Mock mode
✅ Check console logs for `[WhatsApp MOCK]` entries

### Twilio errors
- **Invalid phone number**: Ensure format is +91XXXXXXXXXX
- **Auth failed**: Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
- **Message status "failed"**: Check database `whatsapp_messages.error_message`

### User doesn't see WhatsApp checkbox
- Event must have `enable_whatsapp = 1`
- User must have phone number in form
- Check Admin Dashboard to enable WhatsApp for event

## File Structure

```
server/
├── whatsapp.mjs              # WhatsApp service (Twilio integration)
├── index.mjs                 # API endpoints & routes
└── database.mjs              # Database setup

database/
└── init.sql                  # Schema with whatsapp_messages/settings tables

src/
├── pages/
│   ├── Admin.tsx             # Admin WhatsApp event controls
│   └── Register.tsx          # User reminder modal with WhatsApp option
└── integrations/
    └── database/
        └── client.ts         # Supabase client

.env.example                   # Environment variables template
```

## Monitoring

### Log WhatsApp Activity
```bash
# Check logs for WhatsApp messages
tail -f server.log | grep "WhatsApp"

# Count sent messages
grep "Message sent successfully" server.log | wc -l
```

### Database Monitoring
```sql
-- Total messages sent
SELECT COUNT(*) as total FROM whatsapp_messages WHERE status = 'sent';

-- Failed messages
SELECT COUNT(*) as failed FROM whatsapp_messages WHERE status = 'failed';

-- Messages by type
SELECT message_type, COUNT(*) as count FROM whatsapp_messages GROUP BY message_type;
```

## Future Enhancements

- [ ] WhatsApp message templates with dynamic variables
- [ ] Scheduled reminders (send X hours before event)
- [ ] WhatsApp media support (event posters/media)
- [ ] Message delivery receipts & status tracking in UI
- [ ] Admin bulk message sending to all registered users
- [ ] WhatsApp group chat for events
- [ ] Integration with other messaging services (SMS, Telegram, etc.)
