'use strict';

module.exports = function ($resource) {
    return ApiResourceFactory;

    /**
     * API Resource Wrapper
     *
     * These are the same arguments as $resource.
     *
     * @param url
     * @param paramDefaults
     * @param actions
     * @return $resource
     */
    function ApiResourceFactory(url, paramDefaults, actions) {
        // Explicitly define all actions for transparency. These include all of the defaults from $resource.
        var defaultActions = {
            get: { method: 'GET' },
            save: { method: 'POST' }, // POST
            post: { method: 'POST' },
            put: { method: 'PUT' },
            query: {
                method: 'GET',
                cancellable: true
            },
            remove: { method: 'DELETE' }, // DELETE
            delete: { method: 'DELETE' },
            patch: { method: 'PATCH' }
        };

        // Allow additional actions to be added by extending classes.
        actions = angular.extend({}, defaultActions, actions);

        // All actions must set the apiRequest boolean for the ApiHttpInterceptor to pick up on.
        _.forOwn(actions, function(config, name) {
            config.apiRequest = true;
        });

        return $resource(url, paramDefaults, actions);
    };
};
