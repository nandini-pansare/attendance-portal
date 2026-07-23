import * as Joi from 'joi';

const isoDateString = Joi.string().isoDate().required().custom((value: string) => {
    if (!value) {
        return value;
    }

    return value.includes('T') ? value.split('T')[0] : value;
});

export const dateRangeQuerySchema = Joi.object({
    from: isoDateString,
    to: isoDateString,
});

export const monthQuerySchema = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).max(2100).required(),
});

export const getListSchema = Joi.object({
    from: isoDateString,
    to: isoDateString,
});