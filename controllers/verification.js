
const registerFieldsValidator = async (req, res) => {
    const {firstName, lastName, phone, serviceCenter, password} = req.body;
        //Fields validation
        if(!firstName || !lastName || !phone || !serviceCenter || !password){
            const missingField = !firstName ? "firstName" : !lastName ? "lastName" : !phone ? "phone" : !serviceCenter ? "serviceCenter" : "password";
            return res.status(400).json({message: `${missingField} is required`});
        }
        next();
};

const loginFieldsValidator = async (req, res) => {
    const {password, phone} = req.body;
    //handle missing info
    if(!phone || !password){
        const missingField = !phone ? "phone" : "password";
        return res.status(400).json({message: `${missingField} is required`});
    }
    next();
};

const planningCreationValidator = async (req, res) => {
    const {startDate, numUsers, weeks} = req.body; // Start weeks must be a multiple of users
    if(!startDate || !numUsers || !weeks){
        const missingField = !startDate ? "startDate" : !numUsers ? "numUsers" : "weeks";
        return res.status(400).json({message: `${missingField} is required`});
    }
    if(weeks % numUsers !== 0) return res.status(400).json({message: "Weeks must be a multiple of users"});
    next();
}

const requestCreationValidator = async (req, res) => {
    const {serviceCenter, userPhone,  days, reason} = req.body;
    if(!serviceCenter || !userPhone || !days || !reason){
        const missingField = !serviceCenter ? "serviceCenter" : !userPhone ? "userPhone" : !days ? "days" : "reason";
        return res.status(400).json({message: `${missingField} is required`});
    }
    next();
}

module.exports = {
    registerFieldsValidator,
    loginFieldsValidator,
    planningCreationValidator,
    requestCreationValidator
}