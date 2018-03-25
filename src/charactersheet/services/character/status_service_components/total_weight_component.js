import {
    CoreManager,
    Notifications
} from 'charactersheet/utilities';
import { AbilityScores } from 'charactersheet/models/character/ability_scores';
import { Armor } from 'charactersheet/models/common/armor';
import { Item } from 'charactersheet/models/common/item';
import { KeyValuePredicate } from 'charactersheet/services/common/persistence_service_components/persistence_service_predicates';
import { MagicItem } from 'charactersheet/models/common/magic_item';
import { PersistenceService } from 'charactersheet/services/common/persistence_service';
import { SharedServiceManager } from 'charactersheet/services/common/shared_service_manager';
import { Status } from 'charactersheet/models/common/status';
import { StatusWeightPair } from 'charactersheet/models/common/status_weight_pair';
import { Treasure } from 'charactersheet/models/common/treasure';
import { Weapon } from 'charactersheet/models/common/weapon';
import ko from 'knockout';

/**
 * A Status Service Component that tracks the total weight that a character
 * is carrying, and any modifiers that are applied due to this weight.
 */
export function TotalWeightStatusServiceComponent() {
    var self = this;

    self.statusIdentifier = 'Status.Encumbrance';

    self.init = function() {
        Notifications.profile.changed.add(self.dataHasChanged);
        Notifications.armor.changed.add(self.dataHasChanged);
        Notifications.weapon.changed.add(self.dataHasChanged);
        Notifications.item.changed.add(self.dataHasChanged);
        Notifications.magicItem.changed.add(self.dataHasChanged);
        Notifications.treasure.changed.add(self.dataHasChanged);
        self.dataHasChanged();  //Calculate the first one.
    };

    /**
     * This method generates and persists a status that reflects
     * the character's encumbrance.
     */
    self.dataHasChanged = function() {
        var key = CoreManager.activeCore().uuid();
        var scores = PersistenceService.findBy(AbilityScores, 'characterId', key)[0];
        if (!scores || !scores.str()) {
            self._removeStatus();
        } else {
            self._updateStatus();
        }
    };

    self.getDescription = function(weight) {
        if (weight === 0) {
            return 'carrying nothing';
        }
        return 'carrying ~' + String(weight) + 'lbs';
    };

    self.getType = function(strength, weight) {
        if (weight === 0) {
            return 'default';
        } else if (weight < strength * 5) {
            return 'info';
        } else if (weight < strength * 10) {
            return 'warning';
        } else {
            return 'danger';
        }
    };

    /* Private Methods */

    self._updateStatus = function() {
        var key = CoreManager.activeCore().uuid();
        var scores = PersistenceService.findBy(AbilityScores, 'characterId', key)[0];

        var weight = 0;

        weight += self._getWeightFor(Armor, 'armorWeight');
        weight += self._getWeightFor(Weapon, 'totalWeight');
        weight += self._getWeightFor(Item, 'totalWeight');
        weight += self._getWeightFor(MagicItem, 'magicItemWeight');
        weight += self._getWeightFor(Treasure, 'totalWeight');

        var status = PersistenceService.findByPredicates(Status,
            [new KeyValuePredicate('characterId', key),
            new KeyValuePredicate('identifier', self.statusIdentifier)])[0];
        if (!status) {
            status = new Status();
            status.characterId(key);
            status.identifier(self.statusIdentifier);
        }

        status.name(self.getDescription(weight));
        status.type(self.getType(scores.str(), weight));

        status.save();
        Notifications.status.changed.dispatch();
    };

    self._removeStatus = function() {
        var key = CoreManager.activeCore().uuid();
        var status = PersistenceService.findByPredicates(Status,
            [new KeyValuePredicate('characterId', key),
            new KeyValuePredicate('identifier', self.statusIdentifier)])[0];
        if (status) {
            status.delete();
            Notifications.status.changed.dispatch();
        }
    };

    self._getWeightFor = function(model, property) {
        var weight = 0;
        var key = CoreManager.activeCore().uuid();
        PersistenceService.findBy(model, 'characterId', key).forEach(function(instance, idx, _) {
            var weightValue = parseFloat(ko.unwrap(instance[property]));
            if (weightValue) {
                weight += weightValue;
            }
        });
        return weight;
    };

}
