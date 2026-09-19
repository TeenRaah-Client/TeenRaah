import { validationResult } from "express-validator";
import { fail } from "../utils/apiResponse.js";

/** Runs after a route's validation chain — turns express-validator's error
 * list into the app's normal { success:false, message } shape, using the
 * first error as the headline message (clearest for a single-form UI) while
 * still returning the full list for anything that wants to show per-field
 * errors. */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const list = errors.array();
  return fail(res, list[0].msg, 400, { errors: list });
};
