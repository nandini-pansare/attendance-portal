import * as Joi from 'joi';

export const dateRangeQuerySchema = Joi.object({
    from: Joi.date().iso().required(),
    to: Joi.date().iso().required(),
});

export const monthQuerySchema = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).max(2100).required(),
});

export const getListSchema = Joi.object({
    from: Joi.date().iso().required(),
    to: Joi.date().iso().required(),
})