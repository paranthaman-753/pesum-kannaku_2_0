// All user-facing error texts in one place. title = what happened, hint = what to do.
export const MESSAGES = {
  speechUnsupported: {
    title: 'Voice input is not supported in this browser.',
    hint: 'Please use Chrome or type the transaction manually.'
  },
  speechFailed: {
    title: "We couldn't understand the speech.",
    hint: 'Please try again or type the transaction.'
  },
  speechNoInput: {
    title: "We didn't hear anything.",
    hint: 'Tap the microphone and try again, or type the transaction.'
  },
  speechBlocked: {
    title: 'Microphone access is blocked.',
    hint: 'Allow the microphone in your browser settings, or type the transaction.'
  },
  speechNetwork: {
    title: 'Voice input needs an internet connection.',
    hint: 'Please check your connection or type the transaction.'
  },
  parseFailed: {
    title: "We couldn't understand this entry.",
    hint: 'Please edit the information manually.'
  },
  aiTimeout: {
    title: 'The AI took too long to answer.',
    hint: 'Tap Continue to try again, or enter the details manually.'
  },
  aiNotConfigured: {
    title: 'The AI parser is not set up on the server.',
    hint: 'You can still enter the transaction manually.'
  },
  serverUnavailable: {
    title: 'Server unavailable.',
    hint: 'Please check your connection or use manual entry.'
  },
  missingAmount: {
    title: 'Amount is missing.',
    hint: 'Please enter the amount before saving.'
  },
  missingCustomer: {
    title: 'Customer is missing.',
    hint: 'Please enter the customer before saving.'
  },
  missingType: {
    title: 'Type is missing.',
    hint: 'Please choose Credit or Payment before saving.'
  },
  saveFailed: {
    title: "We couldn't save this entry.",
    hint: 'Please check the details and try again.'
  }
};

// Turns an error from services/api.js into something we can show.
export function noticeFromError(error) {
  if (!error || error.code === 'NETWORK' || !error.message) return MESSAGES.serverUnavailable;
  return { title: error.message };
}
