'use strict';

module.exports = function ($q, $apiResource, RepositoryAbstract) {
    var speciesResource = $apiResource('/species/:id', { id: '@id' }, {

    });

    var SpeciesRepository = new RepositoryAbstract(speciesResource);

    return SpeciesRepository;
};
