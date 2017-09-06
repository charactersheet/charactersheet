import { PersistenceService } from 'charactersheet/services/common/persistence_service.js'

/**
 * Sets weaponhandedness to '' if 'light'.
 */
export var migration_120_1_weapons = {
    name: 'Weapon Light Handedness to Blank Migration',
    version: '1.2.0',
    migration: function() {
        var weapons = PersistenceService.findAllObjs('Weapon');
        for (var i in weapons) {
            var id = weapons[i].id;
            var weapon = weapons[i].data;

            if (weapon.weaponHandedness.toLowerCase().trim() === 'light') {
                weapon.weaponHandedness = '';
            }

            PersistenceService.saveObj('Weapon', id, weapon);
        }
    }
};
