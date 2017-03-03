'use strict';

module.exports = function ($q, $timeout) {
    // A Repository is a caching wrapper for a Resource.
    // Because it keeps a cache, it needs to be able to invalidate that cache as entities are added and removed.
    // So if a Repository is being used for an entity ANYWHERE in the application, it should be used EVERYWHERE.
    // The corresponding Resource should NOT be used anywhere, except for inside this Repository.
    var DEFAULT_CACHE_TIMEOUT = 600;

    return RepositoryAbstract;

    function RepositoryAbstract(Resource, cacheTimeoutSeconds) {
        cacheTimeoutSeconds = cacheTimeoutSeconds || DEFAULT_CACHE_TIMEOUT;

        // A cache of the find all results.
        // This gets cleared at the cacheTimeoutSeconds interval.
        var findAllPromise;

        // After the first load from the server, this cache is populated.
        // While it is never forcible cleared, it is refreshed after any queries to the server.
        var synchronousCache;

        this.find = find;
        this.findSynchronous = findSynchronous;
        this.findSynchronousBy = findSynchronousBy;
        this.findAll = findAll;
        this.persist = persist;
        this.remove = remove;

        cacheTimeout();

        function cacheTimeout() {
            findAllPromise = null;
            $timeout(cacheTimeout, cacheTimeoutSeconds * 1000)
        }

        function persist(entity) {
            if (!entity.id) {
                // Delete the cache because we're adding an entity.
                findAllPromise = null;

                return $q(function(resolve, reject) {
                    Resource.save(entity).$promise.then(function (success) {
                        resolve(success.data);
                    });
                });
            }

            // Patching an existing entity.
            return $q(function(resolve, reject) {
                Resource.patch(entity).$promise.then(function (success) {
                    resolve(success.data);
                });
            });
        }

        function remove(entity) {
            // Delete the cache because we're deleting an entity.
            findAllPromise = null;

            if (entity.id) {
                return $q(function(resolve, reject) {
                    Resource.delete(entity).$promise.then(function (success) {
                        resolve();
                    });
                });
            }

            return $q.resolve();
        }

        function find(id) {
            var promise = $q(function (resolve, reject) {
                findAll().then(function (entities) {
                    return resolve(_.find(entities, {id: id}));
                });
            });

            return promise;
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

            findAllPromise = $q(function (resolve, reject) {
                Resource.query().$promise.then(function (response) {
                    synchronousCache = _.keyBy(response.data, 'id');
                    resolve(response.data);
                });
            });

            return findAllPromise;
        }
    };
};
