export default class Issue {

    constructor(key, fixVersion, team, labels) {
        this.key = key;
        this.fixVersion = fixVersion;
        this.team = team !== null && team !== undefined ? team.value : "NoTeam";
        this.labels = labels;
        this.weeksTillRelease = this.getWeeksTillRelease(this.fixVersion);
        this.futureWeek = this.getMileStoneIndex();
    }

    /**
     * Translate milestone index to index for future week
     * E.g. Epic for release 2016.03 C has label with R-8 and weeksTillRelease is 10
     * So we retrieve 8 from the "R-" label and then calculate that the issue is due in two weeks from now (10-8)
     * that value is the index we return. It will later be used to add the issue to the correct column in the table,
     * in this examples case "+2"
     *
     * @returns {*}
     */
    getMileStoneIndex() {
        let mileStone = this.getMileStoneAsInt();

        if (mileStone === "NotSpecified") {
            return mileStone;
        } else {
            let index = this.weeksTillRelease - mileStone;

            if (index < 0) {
                console.warn("Issue with key: " + this.key + " is not yet done and will be added to next weeks work");
                index = 0;
            }

            return index;
        }
    }

    /**
     * Iterate over issue labels and try to find a "R-" label. If none is found,
     * the issue will be added to the "NotSpecified" category
     * @returns {string}
     */
    getMileStoneAsInt() {
        let index = "NotSpecified";

        this.labels.forEach((label) => {
            let parsedValue = parseInt(label.replace(/^R-/g, ""));
            if (!isNaN(parsedValue)) {
                index = parsedValue;
            }
        });

        return index;
    }

    /**
     * Utility method to retrieve number of weeks till given release
     * @param version
     * @returns {number}
     */
    getWeeksTillRelease(version) {
        let release = new Date(version.releaseDate);
        release.setDate(release.getDate() - 1); // release date is set to monday after release, for the correct calculation of the week we need the actual release which is sunday
        let today = new Date();
        let dif = Math.round(release - today);
        return today.getDay() < 6 ? Math.round((dif / 1000 / 60 / 60 / 24 / 7) - 1) : Math.round(dif / 1000 / 60 / 60 / 24 / 7);
    }
}