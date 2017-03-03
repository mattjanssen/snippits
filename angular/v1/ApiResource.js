'use strict';

module.exports = function ($resource) {
    var $apiResource = function(url, paramDefaults, actions) {
        // Explicitly define all actions.
        var apiDefaults = {
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

        // Allow additional actions to be added.
        actions = angular.extend({}, apiDefaults, actions);

        // All actions must set the apiRequest boolean for the ApiHttpInterceptor to pick up on.
        _.forOwn(actions, function(config, name) {
            config.apiRequest = true;
        });

        var options = {
            stripTrailingSlashes: false
        };

        return $resource(url, paramDefaults, actions, options);
    };

    return $apiResource;
};
