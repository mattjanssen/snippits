'use strict';

module.exports = function (SpeciesRepository) {
    var idToSpecies = function(speciesId) {
        if (!speciesId) {
            return null;
        }

        return SpeciesRepository.findSynchronous(speciesId).name;
    };

    idToSpecies.$stateful = true;

    return idToSpecies;
};
