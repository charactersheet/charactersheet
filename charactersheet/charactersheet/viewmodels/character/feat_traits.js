'use strict';

function FeaturesTraitsViewModel() {
    var self = this;

    self.featTraits = ko.observable(new FeaturesTraits());

    self.load = function() {
        Notifications.global.save.add(function() {
            self.featTraits().save();
        });
    };

    self.load = function() {
        var ft = PersistenceService.findBy(FeaturesTraits, 'characterId',
            CharacterManager.activeCharacter().key());
        if (ft.length > 0) {
            self.featTraits(ft[0]);
        } else {
            self.featTraits(new FeaturesTraits());
        }
        self.featTraits().characterId(CharacterManager.activeCharacter().key());
    };

    self.unload = function() {
        self.featTraits().save();
        Notifications.global.save.remove(function() {
            self.featTraits().save();
        });        
    };
}
