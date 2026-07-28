import * as Joi from 'joi';

export const postLeaveSchema = Joi.object({
  start: Joi.string().isoDate().required(),
  end: Joi.string().isoDate().required(),
  leaveType: Joi.string().valid('sick', 'casual', 'earned', 'mandatory').required(),
  reason: Joi.string().max(1000).required(),
});