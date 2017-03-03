'use strict';

module.exports = function ($injector, $q, $rootScope, API_URL, API_XDEBUG) {
    /**
     * Use with $httpProvider.interceptors.push() to intercept all AJAX requests and responses
     * in order to add authentication headers and detect authentication issues.
     *
     * @link https://docs.angularjs.org/api/ng/service/$http
     */
    var service = {};

    service.request = request;
    service.responseError = responseError;

    return service;

    /**
     * Intercept Requests
     *
     * @param config HttpConfig
     * @return Promise<HttpConfig>
     */
    function request(config) {
        if (!config.apiRequest) {
            // Not an API request. Do not alter. This flag is set by the ApiResourceFactory.
            return config;
        }

        // For API requests append the API URL.
        config.url = API_URL + config.url;

        if (API_XDEBUG) {
            if (config.url.indexOf('?') === -1) {
                config.url += '?XDEBUG_SESSION_START=1';
            } else {
                config.url += '&XDEBUG_SESSION_START=1';
            }
        }

        // Avoid the circular dependency by run-time injection.
        var authenticationService = $injector.get('AuthenticationService');

        // If logged in, attach the JWT header.
        if (authenticationService.isLoggedIn()) {
            // For API requests check to see we have credentials.
            var jwt = authenticationService.getJwt();

            // Authentication is already present. Continue with request.
            addJwtHeaderToConfig(config, jwt);

            return config;
        }

        // Allow anonymous use without JWT.
        if (config.allowAnonymous) {
            return config;
        }

        // We're requesting an API endpoint without first being logged in. Either we can authenticate using
        // stored credentials, or we'll have to fail this request.
        return authenticationService.reloadCredentials().then(function () {
            return config;
        }).catch(function () {
            // The stored credentials were not valid. Fail the request.
            return $q.reject('Credentials not present for non-anonymous API request.');
        });
    }

    /**
     * Handle API HTTP Errors
     *
     * @param rejection HttpRejection
     * @return Promise<HttpRejection|Request>
     */
    function responseError(rejection) {
        if (!rejection.config || !rejection.config.apiRequest) {
            // Not an API request. Do not process. This flag is set by the ApiResourceFactory.
            console.log('Non-API response error', rejection);

            return $q.reject(rejection);
        }

        if (rejection.status === 401) {
            // The credentials used on the request were not valid. The JWT may have expired.
            // Attempt to reload credentials.
            // Avoid the circular dependency by run-time injection.
            var authenticationService = $injector.get('AuthenticationService');

            return authenticationService.reloadCredentials().then(function (loginSuccess) {
                // Credentials reload was successful. Retry the request.
                console.log('API inline login success', rejection);

            }).catch(function (loginFailure) {
                // Stored credentials were not valid. Fail the request.
                console.log('API inline login failed', rejection, loginFailure);

                return $q.reject(rejection);
            });
        }

        if (rejection.status === 500) {

            $injector.get('$uibModal').open({
                template: '<error-catch dismiss="$dismiss()"></error-catch>'
            });

        }

        if (rejection.status === -1) {
            console.log('Unknown AJAX error. Request may have been canceled. Possible CORS failure.', rejection);
        }

        console.log('API response error', rejection);

        return $q.reject(rejection);
    }

    /**
     * Attache Current JWT to Request Config
     *
     * Do NOT cache this JWT header or token as it may change during an asynchronous authentication request.
     *
     * @param config object
     * @param jwt string
     */
    function addJwtHeaderToConfig(config, jwt) {

        // Add the JWT to a modified HTTP Basic authentication header.
        // https://github.com/lexik/LexikJWTAuthenticationBundle/blob/master/Resources/doc/index.md#2-use-the-token
        config.headers['Authorization'] = 'Bearer ' + jwt;
    }
    
};
