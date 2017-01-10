import FutureIssuesCollector from "./futureIssuesCollector";
import PastIssuesCollector from "./pastIssuesCollector";
import ReportTable from "./reportTable";


export default class Report {
    constructor(matchingVersions) {
        this.matchingVersions = matchingVersions;
        this.future = new FutureIssuesCollector(this.matchingVersions).get();
        this.past = new PastIssuesCollector().get();
    }

    //due to a lot of ajax calls we will be working with promises most of the time
    generateReport() {
        let containerId = 'tableContainer';
        let reportTable = new ReportTable(containerId, reportOptions.teams);
        let that = this;

        //wait for both past and future, then add to table
        Promise.all(this.past).then((past) => {
            that.future.then((future) => {
                console.log(past, future);
                reportTable.addTableRows(past, future);

                //reenable button after we're done
                $("button").removeAttr('disabled');
            })
        });


    }
}