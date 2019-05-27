import 'bin/popover_bind';
import {
    AbilityScore,
    SavingThrow
} from 'charactersheet/models/character';

import {
    ACTableFormModel
} from 'charactersheet/components/table-form-component';

import {
    Notifications
} from 'charactersheet/utilities';

import autoBind from 'auto-bind';
import { find } from 'lodash';

import ko from 'knockout';
import template from './form.html';

export class ScoreSaveFormViewModel extends ACTableFormModel {
    constructor(params) {
        super(params);
        this.order = params.order;
        this.showSaves = ko.observable(false);
        this.abilityScoresChanged = ko.observableArray([]);
        autoBind(this);
    }

    modelClass = () => {
        return SavingThrow;
    }

    refresh = async () => {
        await super.refresh();
        await this.updateSavingThrowValues();
    };

    updateSavingThrowValues = async () => {
        // By telling each savingThrow to update their labels, we're implicitly
        // making a networking call. This should not be this way, but because
        // the fix is too time consuming, at time of writing, I'm just leaving
        // it and documenting the weirdness.
        const saveUpdates = this.entities().map(async (savingThrow) => {
            await savingThrow.updateAbilityScore();
        });
        await Promise.all(saveUpdates);
    };

    saveFormHasFocus = ko.computed(()=>(this.formElementHasFocus() && this.showSaves()), this);
    scoreFormHasFocus = ko.computed(()=>(this.formElementHasFocus() && !this.showSaves()), this);

    toggleSaves = (newValue) => {
        this.showSaves(!this.showSaves());
        this.forceCardResize();
    };

    findSaveByName = (name) => find(this.entities(), (savingthrow) => savingthrow.name() === name);

    updateEntity = async (entity) => {
        entity.markedForSave = true;
    }

    async save () {
        const updates = this.entities().map(async (entity) => {
            if (entity.abilityScoreObject().markedForSave) {
                delete entity.abilityScoreObject().markedForSave;
                await entity.abilityScoreObject().ps.save();
                this.abilityScoresChanged().push(entity.abilityScoreObject().name());
            }
            if (entity.markedForSave) {
                delete entity.markedForSave;
                await entity.ps.save();
                this.savingThrowsChanged(true);
            }
        });
        await Promise.all(updates);
    }

    notify = () => {
        if (this.abilityScoresChanged().length > 0) {
            this.abilityScoresChanged().map((name) => {
                Notifications.abilityScores[name.toLowerCase()].changed.dispatch();
            });
            Notifications.abilityScores.changed.dispatch();
            this.abilityScoresChanged([]);
        }
    }


    validation = {
        ...AbilityScore.validationConstraints,
        ...SavingThrow.validationConstraints
    }
}

ko.components.register('score-save-form', {
    viewModel: ScoreSaveFormViewModel,
    template: template
});
