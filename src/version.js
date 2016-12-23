export function render(versions, label) {
    return [
        '<div class="input-field col s4">',
        '<select id="select_' + label + '">',
        renderVersionOptions(versions),
        '</select>',
        '<label>Select ' + label + ' version:</label>',
        '</div>'
    ].join('');
}

function renderVersionOptions(versions) {
    let versionOptions = '';
    versions.forEach(function (value) {
        if (!value.released) {
            versionOptions += '<option value="' + value.name + '">' + value.name + '</option>';
        }
    });

    return versionOptions;
}