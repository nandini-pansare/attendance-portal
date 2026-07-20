import * as Joi from 'joi';

export const postLeaveSchema = Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().min(Joi.ref('start')).required(),
    leaveType: Joi.string().valid('sick', 'casual', 'earned', 'mandatory').required(),
    reason: Joi.string().max(1000).required(),
});