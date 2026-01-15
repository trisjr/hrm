/**
 * Email Utility Functions
 * Handle email sending, placeholder replacement, and validation
 */

/**
 * Replace placeholders in template with actual values
 * Placeholder format: {fieldName}
 * @param template - Template string with placeholders
 * @param values - Object with placeholder values
 * @returns Template with replaced values
 */
export function replacePlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  let result = template

  // Replace all {key} with corresponding values
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{${key}}`
    result = result.replaceAll(placeholder, value)
  }

  return result
}

/**
 * Validate that all required placeholders have values
 * Extract placeholders from template and check if all are provided
 * @param body - Template body with placeholders
 * @param values - Provided placeholder values
 * @returns True if all placeholders have values
 */
export function validatePlaceholders(
  body: string,
  values: Record<string, string>,
): { valid: boolean; missing: Array<string> } {
  // Extract all placeholders from body using regex {fieldName}
  const placeholderRegex = /\{([^}]+)\}/g
  const matches = body.matchAll(placeholderRegex)
  const placeholders = new Set<string>()

  for (const match of matches) {
    placeholders.add(match[1])
  }

  // Check which placeholders are missing
  const missing: Array<string> = []
  for (const placeholder of placeholders) {
    if (!values[placeholder]) {
      missing.push(placeholder)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Send email (placeholder implementation)
 * TODO: Integrate with actual email service (SMTP, SendGrid, etc.)
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email HTML body
 * @returns Success status and optional error message
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Replace with actual email service integration
    // Example with nodemailer:
    // await transporter.sendMail({ from, to, subject, html: body })

    console.log('📧 Email Send (Mock):')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${body.substring(0, 100)}...`)

    // Simulate success for now
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
