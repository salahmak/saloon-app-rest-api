const Joi = require('joi');

const validateRegister = (data) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().max(40).required(),
        password: Joi.string().min(6).max(26).required(),
        mobile: Joi.string().required(),
        address: Joi.string().required(),
        gender: Joi.string().required(),
        profilePic: Joi.string()
    })
    return Joi.validate(data, userSchema)
}

const validateLogin = (data) => {
    const userSchema = Joi.object({
        email: Joi.string().email().max(40).required(),
        password: Joi.string().min(6).max(26).required()
    })
    return Joi.validate(data, userSchema)
}

const validateUser = (data) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().max(40).required(),
        mobile: Joi.string().required(),
        address: Joi.string().required(),
        gender: Joi.string().required(),
        profilePic: Joi.string()
    })
    return Joi.validate(data, userSchema)
}

const validateSaloon = (data) => {
    const saloonSchema = Joi.object({
        ownerId: Joi.string().required(),
        name: Joi.string().required(),
        address: Joi.object().keys({
            lat: Joi.number().required(),
            lng: Joi.number().required()
        }),
        services: Joi.array().items(Joi.string()).min(1).required(),
        pictures: Joi.array().items(Joi.string()).min(1).required()
    })
    return Joi.validate(data, saloonSchema)
}

exports.validateLogin = validateLogin;
exports.validateRegister = validateRegister;
exports.validateUser = validateUser;
exports.validateSaloon = validateSaloon;

module.exports = {
    validateLogin,
    validateRegister,
    validateSaloon,
    validateUser
}