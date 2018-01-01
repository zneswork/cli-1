const { sendHttpRequest } = require('./helper');

const getByAuthContext = async (authContext) => {
    const options = {
        url: '/api/user',
        method: 'GET',
    };

    return sendHttpRequest(options, authContext);
};

const loginWithUserPassword = async (userName, password) => {
    const body = {
        password: password,
        userName: userName,
    };
    const options = {
        url: '/api/auth/local',
        body,
        method: 'POST',
    };
    return sendHttpRequest(options);
};


module.exports = {
    getByAuthContext,
    loginWithUserPassword,
};
