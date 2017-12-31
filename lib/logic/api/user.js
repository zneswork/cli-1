const { sendHttpRequest } = require('./helper');

const getByAuthContext = async (authContext) => {
    const options = {
        url: '/api/user',
        method: 'GET',
    };

    return sendHttpRequest(options, authContext);
};

const loginWithUserPassword = async (userName, password) => {
    const qs = {
        password: password,
        userName: userName,
    };
    const options = {
        url: '/api/user/local',
        qs,
        method: 'POST',
    };
    return sendHttpRequest(options);
};


module.exports = {
    getByAuthContext,
    loginWithUserPassword,
};
