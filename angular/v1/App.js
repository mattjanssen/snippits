'use strict';

var cacheBust = 100;

require('angular').module('app', ['ngResource', 'ngCookies', 'ui.router', 'ngSanitize'])
    .config(function ($urlRouterProvider, $locationProvider, $httpProvider, $stateProvider, $provide) {
        $locationProvider.html5Mode(true);

        $httpProvider.interceptors.push('ApiHttpInterceptor');

        $stateProvider
            .state('portal', {
                url: '/',
                templateUrl: 'view/portal.html',
                template: '<portal></portal>'
            })
            .state('login', {
                url: '/login',
                template: '<login></login>'
            })
            .state('404', {
                templateUrl: 'view/404.html'
            });

        $urlRouterProvider.otherwise('404');

        // Template cache busting.
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
        $rootScope,
        $state,
        $http,
        AuthenticationService,
        Authorization,
        SpeciesRepository
    ) {
        $rootScope.$on('authentication.logout', function () {
            if ($state.current.name !== 'login') {
                $state.go('login');
            }
        });

        $rootScope.$on('authentication.login', function () {
            if ($state.current.name !== 'portal') {
                $state.go('portal');
            }
        });

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            if (!AuthenticationService.isLoggedIn() && toState.name !== 'login') {
                // No credentials and not going to the login page. Intercept and send the user to the login.
                event.preventDefault();
                $state.go('login');
            }
        });

        Authorization.reloadUser();
    })
;

// Non npm dependencies.
require('./vendor');

global.jQuery = require('jquery');

require('angular-resource');
require('angular-cookies');
require('angular-sanitize');
require('angular-ui-router');
require('lodash');

require('./Environment');

require('./component');
require('./directive');
require('./filter');
require('./repository');
require('./resource');
require('./service');
