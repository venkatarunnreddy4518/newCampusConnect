import { randomUUID } from "node:crypto";
import { db, nowIso } from "./database.mjs";

// WhatsApp Service Configuration
// Configure these with your WhatsApp service credentials
const WHATSAPP_CONFIG = {
  // Set to true to enable WhatsApp notifications
  enabled: Boolean(process.env.WHATSAPP_ENABLED),
  // API service type: 'twilio' or 'mock'
  serviceType: process.env.WHATSAPP_SERVICE_TYPE || "mock",
  // Twilio Account SID
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  // Twilio Auth Token
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  // Twilio WhatsApp Sender Phone Number (must be registered with Twilio)
  senderNumber: process.env.WHATSAPP_SENDER_NUMBER || "",
};

/**
 * Format phone number to include country code if missing
 */
function formatPhoneNumber(phone) {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // If phone number doesn't start with country code (1-3 digits), assume India (+91)
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length < 10) {
    return null; // Invalid phone number
  }

  // If already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendViaTwilio(toPhoneNumber, messageBody) {
  const { twilioAccountSid, twilioAuthToken, senderNumber } = WHATSAPP_CONFIG;

  if (!twilioAccountSid || !twilioAuthToken || !senderNumber) {
    console.error("[WhatsApp] Twilio credentials not configured");
    return {
      success: false,
      reason: "Twilio credentials not configured",
    };
  }

  try {
    // Twilio WhatsApp API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    // Create Basic Auth header
    const credentials = Buffer.from(
      `${twilioAccountSid}:${twilioAuthToken}`
    ).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${senderNumber}`,
        To: `whatsapp:${toPhoneNumber}`,
        Body: messageBody,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp] Twilio API error:", data);
      return {
        success: false,
        reason: data.message || "Twilio API error",
        errorCode: data.code,
      };
    }

    console.log(`[WhatsApp] Message sent successfully via Twilio. SID: ${data.sid}`);
    return {
      success: true,
      messageId: data.sid,
      phone: toPhoneNumber,
    };
  } catch (error) {
    console.error("[WhatsApp] Twilio request error:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send WhatsApp message via configured service
 * @param {string} toPhoneNumber - Recipient phone number
 * @param {string} messageType - 'registration' or 'reminder'
 * @param {object} eventDetails - Event details object
 * @returns {Promise<object>} - Response from WhatsApp API
 */
async function sendWhatsAppMessage(toPhoneNumber, messageType, eventDetails) {
  if (!WHATSAPP_CONFIG.enabled) {
    console.log(`[WhatsApp] Service disabled. Message type: ${messageType}`);
    return { success: false, reason: "WhatsApp service disabled" };
  }

  const formattedPhone = formatPhoneNumber(toPhoneNumber);
  if (!formattedPhone) {
    return { success: false, reason: "Invalid phone number format" };
  }

  // Build message body
  let messageBody = "";
  if (messageType === "registration") {
    messageBody = buildRegistrationMessage(eventDetails);
  } else if (messageType === "reminder") {
    messageBody = buildReminderMessage(eventDetails);
  }

  // Route to appropriate service
  if (WHATSAPP_CONFIG.serviceType === "twilio") {
    return sendViaTwilio(formattedPhone, messageBody);
  } else {
    // Mock mode for development
    console.log(`[WhatsApp MOCK] ${messageType} message queued for ${formattedPhone}`);
    console.log(`Message: ${messageBody}`);
    return {
      success: true,
      messageId: randomUUID(),
      phone: formattedPhone,
      mode: "mock",
    };
  }
}
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Build registration message
 */
function buildRegistrationMessage(eventDetails) {
  return `🎉 *Event Registration Confirmed!*

Event: ${eventDetails.eventName}
Date: ${eventDetails.eventDate}
Time: ${eventDetails.eventTime || "Check email for details"}
Venue: ${eventDetails.eventVenue}

✅ You're all set! See you there!

For more details, visit CampusConnect.`;
}

/**
 * Build reminder message
 */
function buildReminderMessage(eventDetails) {
  return `⏰ *Event Reminder!*

Event: ${eventDetails.eventName}
Date: ${eventDetails.eventDate}
Time: ${eventDetails.eventTime || "Check email for details"}
Venue: ${eventDetails.eventVenue}

Don't miss out! See you soon! 🚀`;
}

/**
 * Log WhatsApp message to database
 */
export function logWhatsAppMessage(userId, phoneNumber, eventId, messageType, messageBody, status = "pending", whatsappMessageId = null, errorMessage = null) {
  const id = randomUUID();
  const createdAt = nowIso();

  try {
    db.prepare(`
      INSERT INTO whatsapp_messages (
        id, user_id, phone_number, event_id, message_type, message_body,
        status, whatsapp_message_id, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      phoneNumber,
      eventId,
      messageType,
      messageBody,
      status,
      whatsappMessageId,
      errorMessage,
      createdAt
    );

    return { success: true, id };
  } catch (error) {
    console.error("[WhatsApp] Error logging message:", error);
    return { success: false, error };
  }
}

/**
 * Mark WhatsApp message as sent
 */
export function markWhatsAppMessageSent(messageId, whatsappMessageId) {
  const sentAt = nowIso();

  try {
    db.prepare(`
      UPDATE whatsapp_messages
      SET status = 'sent', whatsapp_message_id = ?, sent_at = ?
      WHERE id = ?
    `).run(whatsappMessageId, sentAt, messageId);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp] Error updating message:", error);
    return { success: false, error };
  }
}

/**
 * Send WhatsApp notification on registration
 */
export async function notifyRegistrationViaWhatsApp(userId, phoneNumber, eventId, eventName, eventDate, eventVenue) {
  try {
    const result = await sendWhatsAppMessage(phoneNumber, "registration", {
      eventName,
      eventDate,
      eventVenue,
    });

    if (result.success) {
      logWhatsAppMessage(
        userId,
        phoneNumber,
        eventId,
        "registration",
        `Event: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`,
        "sent",
        result.messageId
      );
      return { success: true, messageId: result.messageId };
    } else {
      logWhatsAppMessage(
        userId,
        phoneNumber,
        eventId,
        "registration",
        `Event: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`,
        "failed",
        null,
        result.reason
      );
      return { success: false, error: result.reason };
    }
  } catch (error) {
    logWhatsAppMessage(
      userId,
      phoneNumber,
      eventId,
      "registration",
      `Event: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`,
      "failed",
      null,
      error instanceof Error ? error.message : "Unknown error"
    );
    return { success: false, error };
  }
}

/**
 * Send WhatsApp notification for reminder
 */
export async function notifyReminderViaWhatsApp(userId, phoneNumber, eventId, eventName, eventDate, eventVenue) {
  try {
    const result = await sendWhatsAppMessage(phoneNumber, "reminder", {
      eventName,
      eventDate,
      eventVenue,
    });

    if (result.success) {
      logWhatsAppMessage(
        userId,
        phoneNumber,
        eventId,
        "reminder",
        `Reminder: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`,
        "sent",
        result.messageId
      );
      return { success: true, messageId: result.messageId };
    } else {
      logWhatsAppMessage(
        userId,
        phoneNumber,
        eventId,
        "reminder",
        `Reminder: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`,
        "failed",
        null,
        result.reason
      );
      return { success: false, error: result.reason };
    }
  } catch (error) {
    logWhatsAppMessage(
      userId,
      phoneNumber,
      eventId,
      "reminder",
      `Reminder: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`,
      "failed",
      null,
      error instanceof Error ? error.message : "Unknown error"
    );
    return { success: false, error };
  }
}

export { WHATSAPP_CONFIG };
