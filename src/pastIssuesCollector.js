import Story from "./story";
import _map from "../node_modules/lodash.map/index.js";

export default class PastIssuesCollector {

    constructor() {
    }

    get() {
        let pastWeeksPerTeam = {};
        let that = this;
        let teamPromises = [];

        reportOptions.teams.forEach((team) => {
            let promises = [];

            pastWeeksPerTeam[team] = {};
            for (var i = reportOptions.weeksInPast; i > 0; i--) {
                promises.push(that.getEstimateSum(team, i))
            }

            teamPromises.push(Promise.all(promises).then((stories) => {
                return stories;
            }));
        });

        return teamPromises;
    }

    getEstimateSum(team, pastWeekIndex) {
        let that = this;

        return new Promise((resolve) => {
            let jql = "project=SAM and team=" + team + " and (issuetype=Story or issuetype=Task) and (resolutiondate >=-" + pastWeekIndex + "w and (resolution=Done or resolution=Fixed))";

            jira.search.search({method: 'GET', jql: jql, maxResults: 500}, (error, issues) => {
                let stories = that.prepareStories(issues);
                resolve({sum: that.calculateIssueSum(stories), issues: _map(stories, 'key')});
            });
        });
    }

    prepareStories(issues) {
        let stories = [];
        issues.issues.forEach(function (issue) {
            let team = issue.fields.customfield_14850;
            stories.push(new Story(issue.key, issue.fields.fixVersions, team, issue.fields.labels, issue.fields.timeoriginalestimate));
        });

        return stories;
    }

    calculateIssueSum(issues) {
        var sumEstimate = 0;
        //as this is closed work, we want this as a negative number
        $.each(issues, function (index, issue) {
            sumEstimate -= issue.estimate;
        });

        return sumEstimate;
    }
}