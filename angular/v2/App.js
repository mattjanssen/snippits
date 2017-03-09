'use strict';

var cacheBust = 1;

require('angular').module('app', [
    'ngResource',
    'ui.router',
    'ngSanitize'
])
    .config(function (
        $httpProvider,
        $locationProvider,
        $provide,
        $stateProvider,
        $urlRouterProvider
    ) {
        // Do not put # in front of URL paths and parameters.
        $locationProvider.html5Mode(true);

        // Intercept all $http communications to handle API authorization and responses.
        $httpProvider.interceptors.push('ApiHttpInterceptor');

        // Define routes.
        $stateProvider
            .state('home', {
                url: '/',
                component: 'home',
                anonymousOnly: true
            })
            .state('password/reset', {
                url: '/reset-password?token',
                component: 'resetPassword',
                anonymous: true,
                resolve: {
                    token: function ($stateParams) {
                        return $stateParams.token
                    }
                }
            })

        // Redirect to 404 if route is not found.
        $urlRouterProvider.otherwise('404');

        // Add cache-busting increment to template URLs.
        $provide.decorator('$http', function ($delegate) {
            var get = $delegate.get;

            $delegate.get = function (url, config) {
                // All of our templates live in the /view/ directory and end in .html.
                if (/^view\/.*\.html/.test(url)) {
                    url += (url.indexOf('?') === -1 ? '?' : '&');
                    url += 'v=' + cacheBust;
                }

                return get(url, config);
            };

            return $delegate;
        });
    })
    .run(function (
        $http,
        $rootScope,
        $state,
        $timeout,
        $transitions,
        $uibModalStack,
        AuthenticationService,
        Authorization // Needs to get instantiated even if not being used.
    ) {
        $rootScope.$on('authentication.logout', handleLogout);

        $rootScope.$on('authentication.login', handleLogin);

        // Listen for state transitions to anonymous-only routes.
        $transitions.onStart(
            { to: function (route) { return !!route.anonymousOnly; } },
            handleToAnonymousOnlyRoute
        );

        // Listen for state transitions to authenticated-only routes.
        $transitions.onStart(
            { to: function (route) { return !route.anonymous && !route.anonymousOnly; } },
            handleToAuthenticatedRoute
        );

        $transitions.onStart({}, handleLocationChange);

        // Don't allow authenticated users to access anonymous-only routes.
        function handleToAnonymousOnlyRoute($state) {
            if (AuthenticationService.isLoggedIn()) {
                return $state.target('portal');
            }

            return;
        }

        // Allow anonymous users to only access anonymous routes.
        // Ensure that the user object is loaded before navigating to an authenticated route.
        function handleToAuthenticatedRoute($state) {
            if (AuthenticationService.reloadingPromise) {
                // Authentication is in progress. Defer this navigation and wait for resolution.
                // If the authentication promise is successful, the router will continue normally.
                return AuthenticationService.reloadingPromise.then(function (success) {
                    // Authentication was successful. Now wait for the user object to load.
                    return Authorization.getUserPromise();
                }).catch(function (failure) {
                    // A failed authentication promise causes a redirect back home.
                    return $state.target('home');
                });
            }

            if (!AuthenticationService.isLoggedIn()) {
                return $state.target('home');
            }

            // Wait until the user object is loaded, if it hasn't already.
            return Authorization.getUserPromise();
        }

        // Redirect upon login.
        function handleLogin() {
            if ($state.current.anonymousOnly) {
                $state.go('portal');
            }
        }

        // Redirect to default route upon logout event while on a non-anonymous route.
        function handleLogout() {
            if (!$state.current.anonymous && !$state.current.anonymousOnly) {
                $state.go('home');
            }
        }

        function handleLocationChange() {
            $uibModalStack.dismissAll();
        }

    })
;

global.jQuery = require('jquery');

require('angular-resource');
require('angular-ui-router');
require('lodash');
require('./web/assets/vendor/angular-sanitize');

require('./Environment');

require('./component');
require('./directive');
require('./filter');
require('./repository');
require('./resource');
require('./service');
