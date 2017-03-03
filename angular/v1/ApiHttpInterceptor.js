'use strict';

module.exports = function ($q, $rootScope, AuthenticationService, API_URL, API_XDEBUG) {
    var service = {};

    service.response = response;
    service.responseError = responseError;
    service.request = request;

    function request(config) {
        if (!config.apiRequest) {
            // Non-API request. Do not alter.
            return config;
        }

        // For API requests insert the API URL.
        config.url = API_URL + config.url;

        if (API_XDEBUG) {
            if (config.url.indexOf('?') === -1) {
                config.url += '?XDEBUG_SESSION_START=1';
            } else {
                config.url += '&XDEBUG_SESSION_START=1';
            }
        }

        // For API requests check to see we have credentials..
        var currentUser = AuthenticationService.getCredentials();
        if (null === currentUser) {
            // If there are no user credentials then stop the request.
            AuthenticationService.clearCredentials();

            return $q.reject({});
        }

        // Add a HTTP Basic authentication header to the API call.
        config.headers['Authorization'] =
            'Basic ' + window.btoa(currentUser.username + ':' + currentUser.password);

        return config;
    };

    function response(response) {
        if (response.config.apiRequest) {
            AuthenticationService.confirmCredentials();
        }

        return response || $q.when(response);
    };

    function responseError(rejection) {
        if (rejection.config && rejection.config.apiRequest) {
            if (rejection.status === 401) {
                AuthenticationService.clearCredentials();
            } else if (rejection.status === 500) {
                var error = _.get(rejection, 'data.error');

                if (error) {
                    alert('Server API error: ' + error.title);
                } else {
                    alert('Server 500 error: ' + rejection.statusText);
                }
            }
        }


        return $q.reject(rejection);
    }

    return service;
};
