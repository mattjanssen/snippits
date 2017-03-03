'use strict';

module.exports = function ($rootScope, $q, UserResource) {
    var Authorization = {};

    Authorization.isGranted = isGranted;
    Authorization.reloadUser = reloadUser;
    Authorization.getUserPromise = getUserPromise;

    // Register this globally to use in directives.
    // Inside components, access it using $root.isGranted().
    $rootScope.isGranted = isGranted;
    $rootScope.user;

    var user = null;
    var loadingPromise = null;
    var flattenedRoles = null; // A cache of user roles. Must be built as user is loaded.

    var roleHierarchy = {
        ROLE_SYSTEM_ADMIN: ['ROLE_SYSTEM_ADVOCATE', 'ROLE_AGENCY_ADMIN'],
        ROLE_SYSTEM_ADVOCATE: [],
        ROLE_AGENCY_ADMIN: ['ROLE_AGENCY_ADVOCATE'],
        ROLE_AGENCY_ADVOCATE: []
    };

    $rootScope.$on('authentication.logout', function () {
        user = null;
        flattenedRoles = null;
        loadingPromise = null;
    });

    return Authorization;

    function getUserPromise() {
        if (loadingPromise) {
            return loadingPromise;
        }

        return reloadUser();
    }

    function reloadUser() {
        loadingPromise = $q(function (resolve, reject) {
            // The AuthHttpResponseInterceptor will set login status based on the response.
            UserResource.getCurrent().$promise.then(function (success) {
                user = success.data;
                $rootScope.user = user;
                flattenedRoles = flattenRole(user.role);
                resolve(user);
            }, function (failure) {
                reject();
            });
        });

        return loadingPromise;
    }

    function flattenRole(role) {
        // All users get ROLE_USER.
        var roles = ['ROLE_USER'];

        if (role) {
            roles.push(role);
        }
        _.forEach(roles, function (role) {
            // This will only go one level deep. It is not recursive.
            _.forEach(roleHierarchy[role], function (role) {
                roles.push(role);
            });
        });

        return _.uniq(roles);
    }

    function isGranted(checkRole) {
        if (!user) {
            return false;
        }

        return _.includes(flattenedRoles, checkRole);
    }
};
