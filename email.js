/**
 * Mock email sender used for comment notification.
 * This function does not send real emails; instead, it logs
 * the email contents to the console to simulate an email system.
 *
 * @function
 * @param {string} to - Recipient email address.
 * @param {string} subject - Subject line of the email.
 * @param {string} body - Body text of the email.
 */
function sendMail(to, subject, body) {
  console.log("== EMAIL SENT ==")
  console.log("To:     ", to)
  console.log("Subject:", subject)
  console.log("Body:   ", body)
  console.log("==================")
}

module.exports = {sendMail}
