import EpicCollector from 'epicCollector';

const defaultOptions = {
    "teams": ["Skipper", "Catta"],
    "possibleMilestoneLabels": ["R-20", "R-19", "R-18", "R-17", "R-16", "R-15", "R-14", "R-13", "R-12", "R-11", "R-10", "R-9", "R-8", "R-7", "R-6", "R-5", "R-4", "R-3", "R-2", "R-1", "R-0", "R1"],
    "numberOfWeeksInTheFuture": 25,
    "numberOfWeeksInThePast": 8
};

export default class Report {

    constructor(mainVersion, nextVersion) {
        this.currentMilestoneMainRelease = getMilestoneForVersion(mainVersion);
        this.currentMilestoneNextRelease = getMilestoneForVersion = nextVersion;
        this.epicsForMainRelease = new EpicCollector(mainVersion, this.currentMilestoneMainRelease).get();
        this.epicsForNextRelease = new EpicCollector(nextVersion, this.currentMilestoneNextRelease).get();
    }

    generateReport() {
        console.log("test");
    }

    getMilestoneForVersion(version) {
        let release = new Date(version.releaseDate);
        release.setDate(release.getDate() - 1); // release date is set to monday after release, for the correct calculation of the week we need the actual release which is sunday
        let today = new Date();
        let dif = Math.round(release - today);
        let weeksTillRelease = today.getDay() < 3 ? Math.round((dif / 1000 / 60 / 60 / 24 / 7) - 1) : Math.round(dif / 1000 / 60 / 60 / 24 / 7);
        console.log("" + weeksTillRelease + " weeks till " + version.name);

        return weeksTillRelease;
    }
}