'use strict';

module.exports = function ($apiResource) {
    return $apiResource('/document/:id', { id: '@id' }, {

    });
};
