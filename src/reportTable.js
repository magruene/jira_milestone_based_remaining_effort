export default class ReportTable {
    constructor(containerId, teams) {
        this.teams = teams;
        this.container = $("#" + containerId);
        this.initTable();
    }

    initTable() {
        //clear container
        this.container.empty();

        //table
        this.container.append('<table class="bordered"><thead><tr></tr></thead><tbody></tbody></table>');

        //team header
        this.addHeaderColumn('Team');

        //past weeks
        for (let i = reportOptions.weeksInPast; i > 0; i--) {
            this.addHeaderColumn('-' + i);
        }

        //"today" header
        this.addHeaderColumn('0');

        //future weeks
        for (let i = 1; i <= reportOptions.weeksInFuture; i++) {
            this.addHeaderColumn('+' + i);
        }

        //estimates for unknown milestone
        this.addHeaderColumn('Not specified');
    }

    addHeaderColumn(value) {
        $(this.getTable().find('thead')).append([
            '<th>' + value + '</th>'
        ].join(''));
    }

    addTableRows(past, future) {
        //init with given teams and zero values
        let teamsWithNoTeam = reportOptions.teams;
        $.each(teamsWithNoTeam, (index, team) => {
            let row = ['<tr id="id_' + team + '">',
                '<td>' + team + '</td>',
                this.addPastWeeks(past[index]),
                this.addRowColumn({sum: 0, issues: []}),
                this.addFutureWeeks(future[team]),
                this.addRowColumn(future[team]["NotSpecified"]),
                '</tr>'];

            $(this.getTable().find('tbody')).append(row.join(''));
        });
    }

    addPastWeeks(past) {
        let pastWeeks = [];
        for (let i = 0; i < reportOptions.weeksInPast; i++) {
            pastWeeks.push(this.addRowColumn(past[i]));
        }

        return pastWeeks.join('');
    }

    addFutureWeeks(future) {
        let sumRemainingEffort = 0;
        let futureWeeks = [];

        for (let i = 0; i < reportOptions.weeksInFuture; i++) {
            let futureWeek = future[i] !== undefined ? future[i] : {sum: 0, issues: []};
            if (futureWeek.sum > 0) {
                futureWeek.sum = sumRemainingEffort += futureWeek.sum;
            }

            futureWeeks.push(this.addRowColumn(futureWeek));
        }

        return futureWeeks.join('');
    }

    addRowColumn(value) {
        if (value === undefined) {
            return '';
        }

        return '<td><a target="_blank" href="http://jira.swisscom.com/issues/?jql=issuekey in (' + value.issues.join(",") + ')">' + Math.round((value.sum / 28800) * 100) / 100 + '</a></td>';
    }

    getTable() {
        return $(this.container.find('table'));
    }
}