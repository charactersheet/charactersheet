'use strict';

function EncounterItem() {
    var self = new Item();

    self.ps = PersistenceService.register(EncounterItem, self);
    self.mapping.include.push('encounterId');
    self.mapping.include.push('treasureType');

    self.encounterId = ko.observable();
    self.treasureType = ko.observable();

    self.nameLabel = ko.pureComputed(function() {
        return self.itemName();
    });

    return self;
}
