import { parseTransactionText } from '../services/parserService.js';
import { validateParseInput } from '../utils/validation.js';
import { ParserError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/parse
// 200 { success: true,  data, missingFields: [] }                 -> ready to confirm
// 200 { success: false, data, missingFields: ["amount", ...] }    -> partly understood, person must fill the gaps
// 502/503 { success: false, code, error }                         -> AI could not be used
export const parseText = asyncHandler(async (req, res) => {
  const { text, knownCustomers } = validateParseInput(req.body);

  try {
    const result = await parseTransactionText(text, { knownCustomers });
    return res.status(200).json(result);
  } catch (error) {
    if (!(error instanceof ParserError)) throw error;

    if (error.code === 'AI_NOT_CONFIGURED') {
      console.error(error.message);
      return res.status(503).json({
        success: false,
        code: error.code,
        error: 'The AI parser is not set up on the server.'
      });
    }

    if (error.code === 'AI_TIMEOUT') {
      return res.status(504).json({
        success: false,
        code: error.code,
        error: 'The AI took too long to answer.'
      });
    }

    return res.status(502).json({
      success: false,
      code: error.code,
      error: "We couldn't understand this entry."
    });
  }
});
