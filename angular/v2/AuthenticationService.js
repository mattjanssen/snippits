'use strict';

module.exports = function ($http, $q, $rootScope, API_URL) {
    var AuthenticationService = {};

    var KEY_USERNAME = 'u';
    var KEY_PASSWORD = 'p';

    var storage = localStorage;
    var jwt = null;

    AuthenticationService.reloadingPromise = null;

    AuthenticationService.reloadCredentials = reloadCredentials;
    AuthenticationService.getJwt = getJwt;
    AuthenticationService.isLoggedIn = isLoggedIn;
    AuthenticationService.login = login;
    AuthenticationService.logout = logout;

    reloadCredentials();

    return AuthenticationService;

    /**
     * Get new JWT from Server
     *
     * The promise is rejected if credentials aren't stored in local storage, or they fail server validation.
     *
     * @return Promise
     */
    function reloadCredentials() {
        if (AuthenticationService.reloadingPromise) {
            // A reload is already in progress.
            return AuthenticationService.reloadingPromise;
        }

        var username = storage.getItem(KEY_USERNAME);
        var password = storage.getItem(KEY_PASSWORD);

        if (!username || !password) {
            // Credentials are missing. Enforce a logged-out state.
            logout();

            return $q.reject();
        }

        AuthenticationService.reloadingPromise = login(username, password);

        AuthenticationService.reloadingPromise.finally(function () {
            // Clear the promise cache so the next call re-triggers a new authentication attempt.
            AuthenticationService.reloadingPromise = null;
        });

        return AuthenticationService.reloadingPromise;
    }

    /**
     * Get the JWT
     *
     * @return string
     */
    function getJwt() {
        return jwt;
    }

    /**
     * Check if Logged In
     *
     * @return boolean
     */
    function isLoggedIn() {
        return !!jwt;
    };

    /**
     * POST Credentials to Login URL and Store JWT
     *
     * @param string username
     * @param string password
     *
     * @return Promise
     */
    function login(username, password) {
        // The login endpoint takes HTTP Basic auth. All other endpoints use JWT.
        var postConfig = {
            headers: {
                Authorization: 'Basic ' + window.btoa(username + ':' + password)
            }
        };

        return $q(function (resolve, reject) {
            $http.post(API_URL + '/auth', null, postConfig).then(function (response) {
                var oldJwt = jwt;

                if (response.status === 401) {
                    // Credentials failed. Force a fully-logged-out state.
                    logout();
                    reject();
                    return;
                }

                // Store the JWT in memory for future requests. This will be lost on page reload.
                jwt = response.data.data.token;

                // Store the credentials in local storage to renew the JWT after page reload or token timeout.
                storage.setItem(KEY_USERNAME, username);
                storage.setItem(KEY_PASSWORD, password);

                if (!oldJwt) {
                    // If there wasn't already a token, then this is a new login and not just a reload.
                    console.log('authentication.login');
                    $rootScope.$emit('authentication.login');
                }

                resolve();
            }, function (failure) {
                // Credentials failed. Force a fully-logged-out state.
                logout();
                reject(failure);
            });
        });
    };

    /**
     * Clear Credentials and Trigger Logout if Logged In
     */
    function logout() {
        storage.removeItem(KEY_USERNAME);
        storage.removeItem(KEY_PASSWORD);

        if (!isLoggedIn()) {
            // The user is not currently logged in.
            return;
        }

        // The presence of a token indicates a logged-in state. Trigger logout.
        jwt = null;

        console.log('authentication.logout');
        $rootScope.$emit('authentication.logout');
    };
};
