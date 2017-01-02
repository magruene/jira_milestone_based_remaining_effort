const getAllEpicsForTeams = JIRA_BASE_URL + "search?maxResults=500&jql=project=SAM and team in (" + options.teams.join(",") + ") and status != Closed and issueType = Epic and fixVersion in ('" + $("#versionChooserMain").val() + "', '" + $("#versionChooserSmall").val() + "', '" + $("#versionChooserMainSecond").val() + "')";

export default class EpicCollector {

    constructor(version, mileStone) {
        this.version = version;
        this.mileStone = mileStone;
    }

    get() {
        let jql = "project=SAM and team in (Skipper, Catta) and status != Closed and issueType = Epic and fixVersion in ('" + this.version + "')";

        return jira.search.search({jql: jql, maxResults: 500}, (error, epics) => {
            if (error) {
                throw new Error("Could not retrieve epics. Cannot continue.");
            }
            return epics;
        });
    }
}