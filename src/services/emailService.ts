import emailjs from "@emailjs/browser";

// EmailJS credentials from environment variables
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

/**
 * Check if EmailJS is properly configured with all required credentials.
 */
export function isEmailServiceConfigured(): boolean {
  return Boolean(
    SERVICE_ID &&
    TEMPLATE_ID &&
    PUBLIC_KEY &&
    SERVICE_ID !== "your_service_id_here" &&
    TEMPLATE_ID !== "your_template_id_here" &&
    PUBLIC_KEY !== "your_public_key_here"
  );
}

/**
 * Send a real OTP verification email using EmailJS.
 *
 * @param toEmail - Recipient email address
 * @param toName  - Recipient display name
 * @param otpCode - 6-digit OTP code string
 * @returns A promise resolving to { success, message }
 */
export async function sendOtpEmail(
  toEmail: string,
  toName: string,
  otpCode: string
): Promise<{ success: boolean; message: string }> {
  if (!isEmailServiceConfigured()) {
    console.warn(
      "[EmailService] EmailJS is not configured. Update .env with your EmailJS credentials."
    );
    return {
      success: false,
      message:
        "Email service is not configured. Please set up EmailJS credentials in your .env file.",
    };
  }

  try {
    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      otp_code: otpCode,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    if (response.status === 200) {
      return {
        success: true,
        message: `Verification code sent to ${toEmail}`,
      };
    } else {
      return {
        success: false,
        message: `Email service returned status ${response.status}. Please try again.`,
      };
    }
  } catch (error: unknown) {
    console.error("[EmailService] Failed to send OTP email:", error);

    let errorMessage = "Unknown error";
    if (error && typeof error === "object") {
      if ("text" in error && typeof (error as any).text === "string") {
        errorMessage = (error as any).text;
      } else if ("message" in error && typeof (error as any).message === "string") {
        errorMessage = (error as any).message;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      }
    } else {
      errorMessage = String(error);
    }

    return {
      success: false,
      message: `Failed to send verification email: ${errorMessage}`,
    };
  }
}
