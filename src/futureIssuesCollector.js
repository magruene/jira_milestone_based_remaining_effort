import Epic from "./epic";
import _map from "../node_modules/lodash.map/index.js";

export default class FutureIssuesCollector {

    constructor(matchingVersions) {
        this.matchingVersions = matchingVersions;
    }

    get() {
        let promises = [];
        this.result = {};
        this.result["NoTeam"] = {};
        reportOptions.teams.forEach((team) => {
            this.result[team] = {};
            promises.push(this.searchEpics(team).then((promises) => {
                return Promise.all(promises).then((epics) => {
                    this.getGroupedFutureWeeks(epics);
                });
            }));
        });

        return Promise.all(promises).then(() => {
            return this.result;
        });
    }

    /**
     * We go from {0: {key: someEpicKey, ..., stories: [...], ...}
     * to {0: {all_stories_for_futureweek_0}, 3: {all_stories_for_futureweek_3, ...}
     * 
     * @param epics
     * @returns {{}}
     */
    getGroupedFutureWeeks(epics) {
        let loadashMap = _map;
        let stories = [];
        let that = this;
        epics.forEach((epic) => {
            stories = stories.concat(epic.stories);
        });

        stories.forEach((story) => {
            //init
            if (that.result[story.team][story.futureWeek] === undefined) {
                that.result[story.team][story.futureWeek] = {sum: 0, issues: []};
            }

            that.result[story.team][story.futureWeek].sum += story.estimate;
            that.result[story.team][story.futureWeek].issues.push(story.key);
        });
    }

    /**
     * Search not yet closed epics for given team and wrap in more lightweight objects
     * @param team
     * @returns {Promise}
     */
    searchEpics(team) {
        return new Promise((resolve) => {
            let jql = "project=SAM and team=" + team + " and status != Closed and issueType = Epic and fixVersion in (" + this.getMatchedVersionsAsString() + ")";

            jira.search.search({method: 'GET', jql: jql, maxResults: 500}, (error, epics) => {
                let that = this;
                let promises = [];

                epics.issues.forEach(function (epic) {
                    promises.push(that.prepareEpic(epic));
                });

                resolve(promises);
            });
        });
    }

    /**
     * returns versions which are applicable in a coma-separated string for use in jql
     *
     * @returns E.g. "'2016.03 C', '2016.06 C', '2016.11 C'"
     */
    getMatchedVersionsAsString() {
        let matchedVersionsAsString = "";
        this.matchingVersions.forEach((version) => {
            matchedVersionsAsString += "'" + version.name + "',"
        });

        matchedVersionsAsString = matchedVersionsAsString.substring(0, matchedVersionsAsString.length - 1);

        return matchedVersionsAsString;
    }

    /**
     * Maps an epic from its jira response format to own domain model which is reduced to values actually needed
     * @param epic
     * @returns {Promise}
     */
    prepareEpic(epic) {
        return new Promise((resolve) => {
            let jql = '"Epic Link"=' + epic.key + ' and status != Closed and summary !~ "Business Review" and summary !~ "Ensure Documentation" and summary !~ "Review Testcases by DEV-Spoc with Tester and SD"';

            jira.search.search({method: 'GET', jql: jql, maxResults: 500}, (error, stories) => {
                let team = epic.fields.customfield_14850;
                let epicObject = new Epic(epic.key, epic.fields.fixVersions[0], team, epic.fields.labels);

                epicObject.prepareStories(stories);

                resolve(epicObject);
            });
        });
    }

    calculateIssueSum(issues) {
        var sumEstimate = 0;
        $.each(issues, function (index, issue) {
            sumEstimate += issue.estimate;
        });

        return sumEstimate;
    }
}