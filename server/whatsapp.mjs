import { randomUUID } from "node:crypto";
import { db, nowIso } from "./database.mjs";

function isEnabled(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

const WHATSAPP_CONFIG = {
  enabled: isEnabled(process.env.WHATSAPP_ENABLED),
  serviceType: process.env.WHATSAPP_SERVICE_TYPE || "mock",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  senderNumber: process.env.WHATSAPP_SENDER_NUMBER || "",
};

function formatPhoneNumber(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  return null;
}

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
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");

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

function buildRegistrationMessage(eventDetails) {
  return `*Event Registration Confirmed!*

Event: ${eventDetails.eventName}
Date: ${eventDetails.eventDate}
Time: ${eventDetails.eventTime || "Check email for details"}
Venue: ${eventDetails.eventVenue}

You are all set. See you there!

For more details, visit CampusConnect.`;
}

function buildReminderMessage(eventDetails) {
  return `*Event Reminder!*

Event: ${eventDetails.eventName}
Date: ${eventDetails.eventDate}
Time: ${eventDetails.eventTime || "Check email for details"}
Venue: ${eventDetails.eventVenue}

Do not miss it. See you soon!`;
}

async function sendWhatsAppMessage(toPhoneNumber, messageType, eventDetails) {
  if (!WHATSAPP_CONFIG.enabled) {
    console.log(`[WhatsApp] Service disabled. Message type: ${messageType}`);
    return { success: false, reason: "WhatsApp service disabled" };
  }

  const formattedPhone = formatPhoneNumber(toPhoneNumber);
  if (!formattedPhone) {
    return { success: false, reason: "Invalid phone number format" };
  }

  const messageBody = messageType === "registration"
    ? buildRegistrationMessage(eventDetails)
    : buildReminderMessage(eventDetails);

  if (WHATSAPP_CONFIG.serviceType === "twilio") {
    return sendViaTwilio(formattedPhone, messageBody);
  }

  console.log(`[WhatsApp MOCK] ${messageType} message queued for ${formattedPhone}`);
  console.log(`Message: ${messageBody}`);
  return {
    success: true,
    messageId: randomUUID(),
    phone: formattedPhone,
    mode: "mock",
  };
}

export async function logWhatsAppMessage(
  userId,
  phoneNumber,
  eventId,
  messageType,
  messageBody,
  status = "pending",
  whatsappMessageId = null,
  errorMessage = null,
) {
  const id = randomUUID();
  const createdAt = nowIso();

  try {
    await db.prepare(`
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
      createdAt,
    );

    return { success: true, id };
  } catch (error) {
    console.error("[WhatsApp] Error logging message:", error);
    return { success: false, error };
  }
}

export async function markWhatsAppMessageSent(messageId, whatsappMessageId) {
  const sentAt = nowIso();

  try {
    await db.prepare(`
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

export async function notifyRegistrationViaWhatsApp(userId, phoneNumber, eventId, eventName, eventDate, eventVenue) {
  const messageBody = `Event: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`;

  try {
    const result = await sendWhatsAppMessage(phoneNumber, "registration", {
      eventName,
      eventDate,
      eventVenue,
    });

    if (result.success) {
      await logWhatsAppMessage(
        userId,
        phoneNumber,
        eventId,
        "registration",
        messageBody,
        "sent",
        result.messageId,
      );
      return { success: true, messageId: result.messageId };
    }

    await logWhatsAppMessage(
      userId,
      phoneNumber,
      eventId,
      "registration",
      messageBody,
      "failed",
      null,
      result.reason,
    );
    return { success: false, error: result.reason };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logWhatsAppMessage(
      userId,
      phoneNumber,
      eventId,
      "registration",
      messageBody,
      "failed",
      null,
      message,
    );
    return { success: false, error: message };
  }
}

export async function notifyReminderViaWhatsApp(userId, phoneNumber, eventId, eventName, eventDate, eventVenue) {
  const messageBody = `Reminder: ${eventName}, Date: ${eventDate}, Venue: ${eventVenue}`;

  try {
    const result = await sendWhatsAppMessage(phoneNumber, "reminder", {
      eventName,
      eventDate,
      eventVenue,
    });

    if (result.success) {
      await logWhatsAppMessage(
        userId,
        phoneNumber,
        eventId,
        "reminder",
        messageBody,
        "sent",
        result.messageId,
      );
      return { success: true, messageId: result.messageId };
    }

    await logWhatsAppMessage(
      userId,
      phoneNumber,
      eventId,
      "reminder",
      messageBody,
      "failed",
      null,
      result.reason,
    );
    return { success: false, error: result.reason };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logWhatsAppMessage(
      userId,
      phoneNumber,
      eventId,
      "reminder",
      messageBody,
      "failed",
      null,
      message,
    );
    return { success: false, error: message };
  }
}

export { WHATSAPP_CONFIG };
