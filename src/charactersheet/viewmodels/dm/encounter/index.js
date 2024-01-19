import ko from 'knockout';
import template from './index.html';
import './edit';
import './view';
import './form';
import './import-form';

ko.components.register('encounter', {
    template: template
});
