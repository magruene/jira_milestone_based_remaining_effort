var teams = ["Skipper", "Catta", "Yankee", "Private", "Rico", "Kowalski"],
    possibleMilestoneLabels = ["R-20", "R-19", "R-18", "R-17", "R-16", "R-15", "R-14", "R-13", "R-12", "R-11", "R-10", "R-9", "R-8", "R-7", "R-6", "R-5", "R-4", "R-3", "R-2", "R-1", "R-0", "R1"],
    numberOfWeeksInThePast = 8,
    selectedMilestoneLabels,
    sumPerMileStone = {},
    onJira;

//if not on jira, we need to initialize this.
if (!AJS) {
    onJira = false;
    var AJS = {};
    AJS.$ = $;
} else {
    onJira = true;
}


function init() {
    AJS.$('#labelChooser').val(possibleMilestoneLabels.join(", "));

    AJS.$('#labelChooser').select2({
        // specify tags
        tags: possibleMilestoneLabels,
        width: "100%"
    });

    AJS.$.ajax({
        url: "http://jira.swisscom.com/rest/api/2/project/SAM/versions",
        contentType: 'application/json',
        dataType: "json",
        success: function (data) {
            AJS.$.each(data, function (index, version) {
                if (!version.released) {
                    AJS.$("#versionChooser").append("<option value='" + version.name + "'>" + version.name + "</option>")
                }
            });
            AJS.$("button").click(startReportGeneration);
        }
    });
}

function startReportGeneration() {
    resetTable();

    var getAllEpicsForTeams = "http://jira.swisscom.com/rest/api/2/search?maxResults=500&jql=project=SAM and team in (Skipper, Catta, Yankee, Private, Rico, Kowalski) and (status != Closed or status != R4Review) and issueType = Epic and fixVersion='" + AJS.$("#versionChooser").val() + "'";
    ajaxCall(getAllEpicsForTeams, consolidateFutureEffort);

    AJS.$.each(teams, function (index, team) {
        for (var i = numberOfWeeksInThePast; i > 0; i--) {
            AJS.$("#" + team).append('<td id="past' + i + '"></td>');
            var url = "http://jira.swisscom.com/rest/api/2/search?maxResults=500&jql=project=SAM and team=" + team + " and issuetype=Story and (resolutiondate >=-" + i + "w or status=R4Review)";
            ajaxCallUnique(url, team, i, consolidatePastEffort);
        }
        
        AJS.$("#" + team).append('<td id="zero">0</td>');
    });
    
    

    AJS.$(document).ajaxStop(function () {
        AJS.$.each(teams, function (index, team) {
            var currentSum = 0;
            AJS.$.each(selectedMilestoneLabels, function (index, mileStone) {
                currentSum += sumPerMileStone[team][mileStone];

                if (sumPerMileStone[team][mileStone] > 0) {
                    AJS.$("#" + team + " #" + mileStone).text(Math.round((currentSum / 28800) * 100) / 100);
                } else {
                    AJS.$("#" + team + " #" + mileStone).text(0);
                }
            });
        });
        if (onJira) {
            gadget.resize();
        }
    });

}

function resetTable() {
    AJS.$("thead tr").empty();
    AJS.$("tbody").empty();

    AJS.$("#reportTable thead tr").append("<th>Team</th>th>");
    AJS.$("tbody").append('<tr id="Skipper"><td>Skipper</td></tr>');
    AJS.$("tbody").append('<tr id="Catta"><td>Catta</td></tr>');
    AJS.$("tbody").append('<tr id="Yankee"><td>Yankee</td></tr>');
    AJS.$("tbody").append('<tr id="Private"><td>Private</td></tr>');
    AJS.$("tbody").append('<tr id="Rico"><td>Rico</td></tr>');
    AJS.$("tbody").append('<tr id="Kowalski"><td>Kowalski</td></tr>');

    for (var i = numberOfWeeksInThePast; i > 0; i--) {
        AJS.$("#reportTable thead tr").append("<th>-" + i + "</th>");
    }
     AJS.$("#reportTable thead tr").append("<th>0</th>");

    selectedMilestoneLabels = AJS.$('#labelChooser').val().split(",");


    selectedMilestoneLabels.sort(function (a, b) {
        if (parseInt(a.slice(1)) > parseInt(b.slice(1))) return 1;
        if (parseInt(a.slice(1)) < parseInt(b.slice(1))) return -1;
        return 0;
    });

    AJS.$.each(teams, function (index, team) {
        sumPerMileStone[team] = {};
        AJS.$.each(selectedMilestoneLabels, function (index, mileStone) {
            sumPerMileStone[team][mileStone] = 0;
        });
    });

    AJS.$.each(selectedMilestoneLabels, function (index, mileStone) {
        AJS.$("#reportTable thead tr").append("<th>" + mileStone + "</th>");
    });
}

function consolidatePastEffort(team, weeksInThePast, issues) {
    AJS.$("#" + team + " #past" + weeksInThePast).text("-" + calculateIssueSum(issues));
}

function consolidateFutureEffort(issues) {

    var groupedIssuesByTeam = _.groupBy(issues, function (issue) {
        return issue.fields.customfield_14850.value;
    });


    AJS.$.each(_.keys(groupedIssuesByTeam), function (index, currentTeam) {
        AJS.$.each(selectedMilestoneLabels, function (index, mileStoneLabel) {
            AJS.$("#" + currentTeam).append('<td id="' + mileStoneLabel + '"></td>');
            AJS.$("#" + currentTeam + " #" + mileStoneLabel).text("0");
        });

        var issueGroup = groupedIssuesByTeam[currentTeam];

        var groupedIssuesByMileStone = _.groupBy(issueGroup, function (issue) {
            var label = _.find(issue.fields.labels, function (label) {
                return _.contains(selectedMilestoneLabels, label);
            });
            if (label != undefined) {
                return label;
            } else {
                return "NotSpecified";
            }
        });

        var sortable = [];
        for (var mileStone in groupedIssuesByMileStone) {
            sortable.push(mileStone);
        }
        sortable.sort(function (a, b) {
            if (a < b) return 1;
            if (a > b) return -1;
            return 0;
        });

        AJS.$.each(sortable, function (index, mileStone) {
            if (mileStone !== "NotSpecified") {
                var getIssuesForEpicsUrl = "http://jira.swisscom.com/rest/api/2/search?maxResults=500&jql='Epic Link' in (" + _.pluck(groupedIssuesByMileStone[mileStone], 'key').join(", ") + ") and status != Closed and status != R4Review";

                AJS.$.ajax({
                    url: getIssuesForEpicsUrl,
                    async: false,
                    contentType: 'application/json',
                    dataType: "json",
                    success: function (data) {
                        calculateRemainingEstimateForMileStone(currentTeam, mileStone, data.issues);
                    }
                });
            }
        });
    });
}

function calculateRemainingEstimateForMileStone(team, mileStone, issues) {
    var sum = 0;
    AJS.$.each(issues, function (index, issue) {
        var label = _.find(issue.fields.labels, function (label) {
            return _.contains(selectedMilestoneLabels, label);
        });
        if (label && label !== mileStone) {
            sumPerMileStone[team][label] += issue.fields.timeoriginalestimate;
        } else {
            sumPerMileStone[team][mileStone] += issue.fields.timeoriginalestimate;
        }
    });


    var onlyFields = _.pluck(issues, "fields");
    var onlyEstimate = _.pluck(onlyFields, "timeoriginalestimate");
    return _.reduce(onlyEstimate, function (memo, num) {
        return num !== null ? memo + num : memo;
    }, 0);
}

function ajaxCall(url, successFunction) {
    return AJS.$.ajax({
        url: url,
        contentType: 'application/json',
        dataType: "json",
        success: function (data) {
            successFunction(data.issues);
        }
    });
}

function ajaxCallUnique(url, team, specialIdentifier, successFunction) {
    return AJS.$.ajax({
        url: url,
        contentType: 'application/json',
        dataType: "json",
        success: function (data) {
            successFunction(team, specialIdentifier, data.issues);
        }
    });
}

function calculateIssueSum(issues) {
    var sumEstimate = 0;

    AJS.$.each(issues, function (index, issue) {
        sumEstimate += issue.fields.timeoriginalestimate / 28800; //from millis to PT
    });

    return Math.round(sumEstimate * 100) / 100;
}

/* For a given date, get the ISO week number
 *
 * Based on information at:
 *
 *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 *
 * Note that dates in one year can be weeks of previous
 * or next year, overlap is up to 3 days.
 *
 * e.g. 2014/12/29 is Monday in week  1 of 2015
 *      2012/1/1   is Sunday in week 52 of 2011
 */
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0, 0, 0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(), 0, 1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1) / 7);
    // Return array of year and week number
    return [d.getFullYear(), weekNo];
}

var Report = {};
Report.possibleMilestones = possibleMilestoneLabels;
Report.init = init;
window.Report = Report;
