'use strict';

describe('SpellsViewModel', function(){
    PersistenceService._save = function(){};
    PersistenceService._delete = function(){};

    describe('Load', function() {
        it('should load the data from the spells db.', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            PersistenceService.findBy = function(key) { return [new Spell(), new Spell()]; };
            var spellsVM = new SpellbookViewModel();
            spellsVM.spellbook().length.should.equal(0);
            spellsVM.load();
            spellsVM.spellbook().length.should.equal(2);
        });
    });

    describe('Unload', function() {
        it('should unload the data to the spells db.', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var saved = [false, false];
            var spells = [new Spell(), new Spell()].map(function(e, i, _) {
                e.save = function() { saved[i] = true; };
                return e;
            });
            PersistenceService.findBy = function(key) { return spells; };

            saved.forEach(function(e, i, _) {
                e.should.equal(false);
            });
            //Test
            var spellsVM = new SpellbookViewModel();
            spellsVM.spellbook().length.should.equal(0);
            spellsVM.load();
            spellsVM.spellbook().length.should.equal(2);
            spellsVM.unload();
            spellsVM.spellbook().length.should.equal(2);

            saved.forEach(function(e, i, _) {
                e.should.equal(true);
            });
        });
    });

    describe('Add Spell', function() {
        it('should add a new spell to the SpellbookViewModel', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            book.clear();
            book.spellbook().length.should.equal(0);
            book.addSpell();
            book.spellbook().length.should.equal(1);
        });
    });

    describe('Edit Spell', function() {
        it('should select a spell for editing.', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();

            var spell = new Spell();
            spell.spellName('Magic missle');
            book.editSpell(spell);
            book.currentEditItem().spellName().should.equal(spell.spellName());
            book.modalOpen().should.equal(true);
        });
    });

    describe('Remove Item', function() {
        it('should remove a item from the SpellbookViewModel', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            book.clear();
            book.spellbook().length.should.equal(0);
            book.addSpell();
            book.spellbook().length.should.equal(1);
            book.removeSpell(book.spellbook().pop());
            book.spellbook().length.should.equal(0);
        });
    });

    describe('Clear', function() {
        it('should clear all the values in the SpellbookViewModel', function() {
            var book = new SpellbookViewModel();
            var spell = [new Spell()];
            book.spellbook(spell);
            book.spellbook().should.equal(spell);
            book.clear();
            book.spellbook().length.should.equal(0);
        });
    });

    describe('Sort By', function() {
        it('should sort the list of spells by given criteria', function() {
            var book = new SpellbookViewModel();
            book.sortBy('spellName');
            book.sort().should.equal(book.sorts['spellName desc']);
            book.sortBy('spellName');
            book.sort().should.equal(book.sorts['spellName asc']);
            book.sortBy('spellPrepared');
            book.sort().should.equal(book.sorts['spellPrepared asc']);
            book.sortBy('spellPrepared');
            book.sort().should.equal(book.sorts['spellPrepared desc']);
            book.sortBy('spellLevel');
            book.sort().should.equal(book.sorts['spellLevel asc']);
            book.sortBy('spellLevel');
            book.sort().should.equal(book.sorts['spellLevel desc']);
        });
    });

    describe('Sort Arrow', function() {
        it('should sort the list of skills by given criteria', function() {
            var book = new SpellbookViewModel();
            book.sortBy('spellName');
            book.sort().should.equal(book.sorts['spellName desc']);
            book.sortArrow('spellName').should.equal('fa fa-arrow-down fa-color');
            book.sortBy('spellPrepared');
            book.sort().should.equal(book.sorts['spellPrepared asc']);
            book.sortArrow('spellPrepared').should.equal('fa fa-arrow-up fa-color');
            book.sortArrow('spellLevel').should.equal('');
            book.sortBy('spellName');
            book.sort().should.equal(book.sorts['spellName asc']);
            book.sortArrow('spellName').should.equal('fa fa-arrow-up fa-color');
            book.sortArrow('spellLevel').should.equal('');
            //Numeric sort
            book.sortBy('spellLevel');
            book.sort().should.equal(book.sorts['spellLevel asc']);
            book.sortArrow('spellName').should.equal('');
            book.sortArrow('spellLevel').should.equal('fa fa-arrow-up fa-color');
            book.sortBy('spellLevel');
            book.sort().should.equal(book.sorts['spellLevel desc']);
            book.sortArrow('spellName').should.equal('');
            book.sortArrow('spellLevel').should.equal('fa fa-arrow-down fa-color');
        });
    });

    describe('Prepared Row Visible Add Modal', function() {
        it('should return true if the prepared row checkboxes should be visible', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            book.blankSpell().spellLevel(1);
            book.preparedRowVisibleAdd().should.equal(true);
        });
        it('should return true if the prepared row checkboxes should be visible', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            book.blankSpell().spellLevel(0);
            book.preparedRowVisibleAdd().should.equal(false);
        });
    });

    describe('Prepared Row Visible Edit Modal', function() {
        it('should return true if the prepared row checkboxes should be visible', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            var spell = new Spell();
            spell.spellLevel(1);
            book.spellbook([spell]);
            book.preparedRowVisibleEdit(spell).should.equal(true);
        });
        it('should return true if the prepared row checkboxes should be visible', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            var spell = new Spell();
            spell.spellLevel(0);
            book.spellbook([spell]);
            book.preparedRowVisibleEdit(spell).should.equal(false);
        });
    });

    describe('Prepared checkbox html', function() {
        it('should return the correct hmtl for prepared checkbox', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            var spell = new Spell();
            spell.spellAlwaysPrepared(true);
            book.spellbook([spell]);
            book.preparedCheckboxHTML(spell).should.equal('<input type="checkbox" disabled checked>');
        });
        it('should return the correct hmtl for prepared checkbox', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var book = new SpellbookViewModel();
            var spell = new Spell();
            spell.spellLevel(0);
            book.spellbook([spell]);
            book.preparedCheckboxHTML(spell).should.equal('');
        });
        it('should return the correct hmtl for prepared checkbox', function() {
            simple.mock(CharacterManager, 'activeCharacter').callFn(MockCharacterManager.activeCharacter);

            var expected = '<input data-bind="checked: spellPrepared" ' +
                           'type="checkbox" href="#"></input>';

            var book = new SpellbookViewModel();
            var spell = new Spell();
            book.spellbook([spell]);
            book.preparedCheckboxHTML(spell).should.equal(expected);
        });
    });

});
