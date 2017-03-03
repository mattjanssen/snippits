'use strict';

module.exports = function ($q, $timeout, ApiResourceFactory) {
    // A Repository is a caching wrapper for a Resource.
    // Because it keeps a cache, it needs to be able to invalidate that cache as entities are added and removed.
    // So if a Repository is being used for an entity ANYWHERE in the application, it should be used EVERYWHERE.
    // The corresponding Resource should NOT be used anywhere, except for inside this Repository.
    var DEFAULT_CACHE_TIMEOUT = 600;

    return ApiRepository;

    /**
     * API Repository
     *
     * These are the same arguments as $resource.
     *
     * @param url
     * @param paramDefaults
     * @param actions
     * @constructor
     */
    function ApiRepository(url, paramDefaults, actions) {
        var apiResource = ApiResourceFactory(url, paramDefaults, actions);

        // A cache of the find all results.
        // This gets cleared at the DEFAULT_CACHE_TIMEOUT interval.
        var findAllPromise;

        // After the first load from the server, this cache is populated.
        // While it is never forcible cleared, it is refreshed after any queries to the server.
        var synchronousCache;

        this.find = find;
        this.findBy = findBy;
        this.findSynchronous = findSynchronous;
        this.findSynchronousBy = findSynchronousBy;
        this.findAll = findAll;
        this.persist = persist;
        this.remove = remove;

        cacheTimeout();

        function cacheTimeout() {
            findAllPromise = null;
            $timeout(cacheTimeout, DEFAULT_CACHE_TIMEOUT * 1000)
        }

        function persist(entity) {
            if (!entity.id) {
                // Delete the cache because we're adding an entity.
                findAllPromise = null;

                return apiResource.post(entity).$promise.then(function (success) {
                    return success.data;
                });
            }

            // Patching an existing entity.
            return apiResource.patch(entity).$promise.then(function (success) {
                return success.data;
            });
        }

        function remove(entity) {
            // Delete the cache because we're deleting an entity.
            findAllPromise = null;

            if (!entity.id) {
                // For entities without IDs, there's no need to delete them from the server.
                return $q.resolve();
            }

            return apiResource.delete(entity).$promise;
        }

        function find(id) {
            return findOneBy({id: id});
        }

        function findOneBy(predicate) {
            return findAll().then(function (entities) {
                return _.find(entities, predicate);
            });
        }

        function findBy(predicate) {
            return findAll().then(function (entities) {
                return _.filter(entities, predicate);
            });
        }

        /**
         * Get Entity if Already Cached
         *
         * A false return means the cache is not warm.
         * A null return means the entity was not found.
         *
         * Used to instantly get an entity if already cached.
         * If not cached yet, this returns false, and triggers an asynchronous loading.
         *
         * Note: This cache does not time out or get cleared by triggers,
         * so it may return out-of-date or even deleted entities.
         * Use the asynchronous find() to reduce this risk.
         *
         * @param id
         * @return {object}|undefined|false
         */
        function findSynchronous(id) {
            if (!synchronousCache) {
                // Trigger a cache load.
                findAll();

                return false;
            }

            return synchronousCache[id];
        }

        function findSynchronousBy(predicate) {
            if (!synchronousCache) {
                // Trigger a cache load.
                findAll();

                return false;
            }

            return _.find(synchronousCache, predicate);
        }

        function findAll() {
            if (findAllPromise) {
                // This query has already been performed. That does not mean it has finished, but the promise is cached.
                return findAllPromise;
            }

            findAllPromise = apiResource.query().$promise.then(function (success) {
                synchronousCache = _.keyBy(success.data, 'id');

                return success.data;
            });

            return findAllPromise;
        }
    };
};
