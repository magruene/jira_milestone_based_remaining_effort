'use_strict';

Object.defineProperty(exports, '__esModule', {value: true});

// http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
Date.prototype.getWeekNumber = function () {
    let d = new Date(+this);
    d.setMilliseconds(0);
    d.setHours(0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
};

import JiraClient from "../node_modules/jira-connector/index.js";
import * as version from "./version";
import Report from "./report";

const jira = new JiraClient({
    host: 'jira.swisscom.com',
    basic_auth: {
        base64: 'U0EtUEYwMC1TQU1KZW5raW5zOlNzWUc5VzhkTHdSdFJCRks='
    }
});

$(function () {
    let versions;

    jira.project.getVersions({projectIdOrKey: 'SAM'}, (error, returnValue) => {
        if (error) {
            throw new Error("Could not retrieve versions. Cannot continue.");
        }

        versions = returnValue;
        $('#testId').append(version.render(returnValue, 'main'));
        $('#testId').append(version.render(returnValue, 'small'));
        $('#testId').append(version.render(returnValue, 'next'));
        $('select').material_select();

        let report = new Report(versions);

        $("button").click(() => {
            report.generateReport($('#select_main').val(), $('#next').val());
        });
    });
});

