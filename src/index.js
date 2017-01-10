import JiraClient from "../node_modules/jira-connector/index.js";
import * as version from "./version";
import Report from "./report";

Date.prototype.addWeeks = function (weeks) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + weeks * 7);
    return date;
};

window.reportOptions = {
    teams: ['Skipper', 'Catta'],
    weeksInFuture: 25,
    weeksInPast: 8
};

window.jira = new JiraClient({
    host: 'jira.swisscom.com',
    basic_auth: {
        base64: 'U0EtUEYwMC1TQU1KZW5raW5zOlNzWUc5VzhkTHdSdFJCRks='
    }
});

$(function () {
    let $button = $("button");
    $button.attr('disabled', ''); //prevent clicking before versions are loaded
    version.getMatchingFixVersions().then((versions) => {
        $button.click(() => {
            $button.attr('disabled', ''); //prevent user from clicking multiple times
            let report = new Report(versions);
            report.generateReport();
        });

        $button.removeAttr('disabled'); //versions are loaded and handler is registered. User may click
    });
});