'use strict';

module.exports = function ($rootScope, $q, UserResource) {
    var Authorization = {};

    Authorization.reloadUser = reloadUser;
    Authorization.getUser = getUser;
    Authorization.getUserPromise = getUserPromise;
    Authorization.isGranted = isGranted;

    // Register this globally to use in templates.
    // Inside components, access it using $root.isGranted().
    $rootScope.isGranted = isGranted;

    var userDeferred = $q.defer(); // Defer resolving until logged in.
    var user = null;
    var flattenedRoles = null; // A cache of user roles. Must be built when user is loaded.

    var roleHierarchy = {
        ROLE_SUPER: ['ROLE_ADMIN', 'ROLE_EDUCATOR'],
        ROLE_ADMIN: ['ROLE_EDUCATOR']
    };

    $rootScope.$on('authentication.login', reloadUser);
    $rootScope.$on('authentication.logout', clearUser);

    return Authorization;

    /**
     * Get the User Object Immediately
     *
     * Note: This may be null while still loading, even if the user is logged in.
     *
     * @return user
     */
    function getUser() {
        return user;
    }

    /**
     * Get the User Object as a Promise
     *
     * @return user
     */
    function getUserPromise() {
        return userDeferred.promise;
    }

    /**
     * Check if Current User Has Role
     *
     * @param string checkRole
     * @return boolean
     */
    function isGranted(checkRole) {
        if (!user) {
            return false;
        }

        return _.includes(flattenedRoles, checkRole);
    }

    /**
     * Trigger Loading of User Promises
     */
    function reloadUser() {
        UserResource.getCurrent().$promise.then(function (success) {
            if (!user) {
                // This is the first time getting the user from the server.
                user = success.data;
            } else {
                // This is a refresh from the server. Just update the user object instead of creating a new one.
                _.merge(user, success.data);
            }
            flattenedRoles = flattenRole(user.role);
            userDeferred.resolve(user);
        }).catch(function (failure) {
            user = null;
            console.log('Loading user failed.');
            userDeferred.reject();
        });
    }

    /**
     * Reset User Data
     */
    function clearUser() {
        userDeferred = $q.defer();
        user = null;
        flattenedRoles = null;
    }

    /**
     * Flatten User's Role Hierarchy
     *
     * @param string role
     * @return string[]
     */
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
};
