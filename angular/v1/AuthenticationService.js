'use strict';

module.exports = function($rootScope, $timeout) {
    var AuthenticationService = {};

    var storage = localStorage;
    var loginState = false;

    var KEY_USERNAME = 'u';
    var KEY_PASSWORD = 'p';
    var KEY_LOGIN_TIMESTAMP = 't';

    // Seconds after tab close that credentials are invalidated.
    var POLLING_TIMEOUT = 30;

    AuthenticationService.setCredentials = setCredentials;
    AuthenticationService.setPassword = setPassword;
    AuthenticationService.confirmCredentials = confirmCredentials;
    AuthenticationService.resetTimeoutTimer = resetTimeoutTimer;
    AuthenticationService.clearCredentials = clearCredentials;
    AuthenticationService.getCredentials = getCredentials;
    AuthenticationService.isLoggedIn = isLoggedIn;

    pollForLogin();

    return AuthenticationService;

    function pollForLogin() {
        setTimeout(pollForLogin, 1000);

        // If the user has the application loaded in multiple tabs, we need to know when any of those other tabs
        // log out or in and do likewise on this instance. We keep this instance's login state locally, and keep
        // the global login state in local storage. Polling this local storage data tells us if we need to:
        // 1) Switch this instance to a logged out state.
        // 2) Switch this instance to a logged in state.

        // The APP must also force a log out if all tabs have been closed for more than X number of seconds.
        // This prevents a user from closing the tabs, then reopening one later and still being logged in.

        doLoginChecks();
    }

    function doLoginChecks() {
        if (null === getCredentials()) {
            // There are no user credentials.
            if (loginState) {
                // If this instance is logged in, trigger a logout.
                console.log('Auth Timer: Credentials empty but user logged in. Clearing credentials.');
                clearCredentials();
            }

            return;
        }

        var confirmationTimestamp = storage.getItem(KEY_LOGIN_TIMESTAMP);
        if (!confirmationTimestamp) {
            // There are user credentials, but there is no confirmed login timestamp.
            // This happens when the login has been started but has not been confirmed by the response.
            console.log('Auth Timer: Timestamp not present. Doing nothing.');

            return;
        }

        if (confirmationTimestamp < getTime() - POLLING_TIMEOUT) {
            // The user is logged in but their tabs have been closed for too long.
            console.log('Auth Timer: Timestamp old. Clearing credentials. (Timestamp: ' + confirmationTimestamp + ') (Time: ' + getTime() + ')');

            clearCredentials();

            return;
        };

        if (!loginState) {
            // The user is logged in globally, but this instance is logged out.
            // Tell this instance that a login has happened.
            console.log('Auth Timer: Timestamp valid but user not logged in. Confirming credentials.');
            confirmCredentials();
        }

        // Refresh the dead man's timer.
        resetTimeoutTimer();
    }

    function setCredentials(username, password) {
        storage.setItem(KEY_USERNAME, username);
        storage.setItem(KEY_PASSWORD, password);
    };

    function setPassword(password) {
        storage.setItem(KEY_PASSWORD, password);
    };

    function confirmCredentials() {
        if (loginState) {
            return;
        }

        loginState = true;
        resetTimeoutTimer();
        $rootScope.$emit('authentication.login');
    }

    function resetTimeoutTimer() {
        storage.setItem(KEY_LOGIN_TIMESTAMP, getTime());
    }

    function clearCredentials() {
        storage.removeItem(KEY_USERNAME);
        storage.removeItem(KEY_PASSWORD);
        storage.removeItem(KEY_LOGIN_TIMESTAMP);
        loginState = false;
        $rootScope.$emit('authentication.logout');
    };

    function getCredentials() {
        var username = storage.getItem(KEY_USERNAME);
        var password = storage.getItem(KEY_PASSWORD);

        if (!username || !password) {
            return null;
        }

        return {
            'username': username,
            'password': password
        };
    };

    function isLoggedIn() {
        return loginState;
    };

    function getTime() {
        return Math.floor(Date.now() / 1000);
    }
};
