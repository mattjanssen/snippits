'use strict';

module.exports = function (ApiResourceFactory) {
    var UserResource = ApiResourceFactory('/user/:id', { id: '@id' }, {
        forgotPassword: {
            method: 'POST',
            url: '/user/forgot-password/',
            allowAnonymous: true
        },
        getCurrent: {
            url: '/user/me/',
            method: 'GET'
        },
        patchPassword: {
            url: '/user/password/',
            method: 'PATCH'
        },
        post: {
            method: 'POST',
            allowAnonymous: true

        },
        resetPassword: {
            method: 'POST',
            url: '/user/reset-password',
            allowAnonymous: true
        },
    });

    return UserResource;
};
