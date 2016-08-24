'use strict';

function WizardIntroStepViewModel() {
    var self = this;

    self.TEMPLATE_FILE = 'wizard_intro_step.tmpl';
    self.IDENTIFIER = 'WizardIntroStep';

    self.ready = ko.observable(false);

    /**
     * Results for this view model contain either a `PlayerType` field,
     * or an `import` field containing the character id.
     *
     * - Possible values of Player type are: player, dm, import.
     */
    self.results = ko.observable(null);
    self.wellOpen = ko.observable(false);

    self.fileContents = ko.observable();
    self.fileReader = new FileReader();

    // View Model Methods

    self.init = function() { };

    self.load = function() {
        //Initialize dropbox integrations.


        //Set default value to player atm.
        self.setPlayerType('player');
        self.ready(true);
    };

    self.unload = function() {};

    self.setPlayerType = function(type) {
        self.results({ PlayerType: type });
    };

    self.toggleWellOpen = function() {
        self.wellOpen(!self.wellOpen());
        var button = Dropbox.createChooseButton(Settings.dropboxConfigOptions);
        document.getElementById('dropbox-container').appendChild(button);
    };

    self.arrowIconClass = ko.pureComputed(function() {
        return self.wellOpen() ? 'fa fa-caret-up' : 'fa fa-caret-down';
    });

    self.importFromFile = function() {
        //The first comma in the result file string is the last
        //character in the string before the actual json data
        var length = self.fileReader.result.indexOf(',') + 1;
        var values = JSON.parse(atob(self.fileReader.result.substring(
            length, self.fileReader.result.length)));

        var character = Character.importCharacter(values);

        self._setImportReady(character.key());
    };

    WizardIntroStepViewModel.importRemoteFile = function(files) {
        $.getJSON(files[0].link).done(function(data) {
            CharacterManager.changeCharacter(character.key());
            self._setImportReady(character.key());
        }).error(function(err) {
            //TODO: Alert user of error
        });
    };

    // Private Methods

    /**
     * Given a character Id from an imported character, alert the
     * parent of a successful import.
     */
    self._setImportReady = function(characterId) {
        self.results({ 'import': characterId });
        self.ready(false);
        self.ready(true);
    };

}
