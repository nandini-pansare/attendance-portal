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

export const editAttendanceSchema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    checkIn: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    checkOut: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
}).or('checkIn', 'checkOut');