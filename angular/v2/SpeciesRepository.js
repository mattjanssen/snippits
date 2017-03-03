'use strict';

module.exports = function ($q, ApiRepository) {
    var SpeciesRepository = new ApiRepository('/species/:id', { id: '@id' }, {
        query: {
            method: 'GET',
            cancellable: true,
            allowAnonymous: true
        }
    });

    SpeciesRepository.findByGenusId = findByGenusId;

    return SpeciesRepository;

    function findByGenusId(genusId) {
        return SpeciesRepository.findBy({genus: parseInt(genusId)});
    }
};
