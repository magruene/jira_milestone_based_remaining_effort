import Issue from "./issue";
import Story from "./story";

export default class Epic extends Issue {

    constructor(key, fixVersion, team, labels) {
        super(key, fixVersion, team, labels);
    }

    /**
     * see Issue.getMileStoneIndex.
     *
     * The epic overrides this to print epics which are falsely or not at all labeled
     * @returns {*}
     */
    getMileStoneIndex() {
        let mileStone = super.getMileStoneIndex();

        if (mileStone === "NotSpecified") {
            console.warn("Could not find suitable 'R-' label on epic: " + this.key);
        }

        return mileStone;
    }

    /**
     * Map given stories from jira response to own domain object which is more lightweight.
     * A story can override both version and milestone. It will default to the epic values if none are set.
     * @param stories
     */
    prepareStories(stories) {
        let storyObjects = [];
        let that = this;
        stories.issues.forEach(function (issue) {
            let team = issue.fields.customfield_14850;
            let estimate = issue.fields.timeoriginalestimate;
            let fixVersion;

            // take fixVersion of story if available or default to epic fixVersion
            if (issue.fields.fixVersions.length > 0) {
                fixVersion = issue.fields.fixVersions[0];
            } else {
                fixVersion = that.fixVersion;
            }

            let story = new Story(issue.key, fixVersion, team, issue.fields.labels, estimate);
            //if futureWeek for story cannot be determined, we take the one from the epic
            story.futureWeek = that.getMileStoneIndexForStory(story);

            storyObjects.push(story);
        });

        this.stories = storyObjects;
    }

    getMileStoneIndexForStory(story) {
        let index = story.futureWeek;

        if (index === "NotSpecified") {
            return this.futureWeek;
        }

        return index;
    }
}