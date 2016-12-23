'use_strict';

Object.defineProperty(exports, '__esModule', {value: true});

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
        $("#testId").append(version.render(returnValue, 'main'));
        $("#testId").append(version.render(returnValue, 'small'));
        $("#testId").append(version.render(returnValue, 'next'));
        $('select').material_select();
    });

    let report = new Report();

    $("button").click(() => {
        report.generateReport();
    });
});

