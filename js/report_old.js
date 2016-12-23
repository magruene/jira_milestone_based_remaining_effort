/**
 * Default options used if no options object is explicitly set. Values are:
 *  - teams: Teams which should be looked for while generating the report
 *  - possibleMilestoneLabels: milestone labels that should be looked for on epics/stories/tasks
 *  - numberOfWeeksInTheFuture: how many weeks from now I should go
 *  - numberOfWeeksInThePast: how many weeks should I go back?
 */

var defaultOptions = {
    "teams": ["Skipper", "Catta"],
    "possibleMilestoneLabels": ["R-20", "R-19", "R-18", "R-17", "R-16", "R-15", "R-14", "R-13", "R-12", "R-11", "R-10", "R-9", "R-8", "R-7", "R-6", "R-5", "R-4", "R-3", "R-2", "R-1", "R-0", "R1"],
    "numberOfWeeksInTheFuture": 25,
    "numberOfWeeksInThePast": 8
};

var sumPerMileStone = {},
    currentMilestoneMainRelease,
    currentMilestoneNextRelease,
    options,
    samVersions;

var matchedMilestones = {};

const JIRA_BASE_URL = "https://jira.swisscom.com/rest/api/2/";

/**
 * ID of the text-gadget this report.js is used. Something like "gadget-50750".
 */
var gadgetId;


// http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
Date.prototype.getWeekNumber = function () {
    var d = new Date(+this);
    d.setMilliseconds(0);
    d.setHours(0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
};

/**
 * Init with an optional options object. If none is given, take defaultOptions
 * @param givenGadgetId
 * @param givenOptions
 */
function init(givenGadgetId, givenOptions) {
    gadgetId = givenGadgetId;
    if (givenOptions === undefined) {
        options = defaultOptions;
    } else {
        options = givenOptions;
    }

    $.ajax({
        url: JIRA_BASE_URL + "project/SAM/versions",
        contentType: 'application/json',
        dataType: "json",
        success: function (data) {
            samVersions = data;

            $.each(samVersions, function (index, version) {
                if (!version.released) {
                    $("#versionChooserMain").append("<option value='" + version.name + "'>" + version.name + "</option>");
                    $("#versionChooserSmall").append("<option value='" + version.name + "'>" + version.name + "</option>");
                    $("#versionChooserMainSecond").append("<option value='" + version.name + "'>" + version.name + "</option>");
                }
            });
            $("button").click(startReportGeneration);
            AJS.$("#" + gadgetId + " iframe").css("height", $("html").css("height"));
            AJS.$.each(parent.AG.DashboardManager.activeLayout.getGadgets(), function (index, gadget) {
                gadget.resize();
            });
        }
    });
}

function getCurrentMilestones() {
    $.each(samVersions, function (index, version) {
        if (version.name === $("#versionChooserMain").val()) {
            currentMilestoneMainRelease = getMilestoneForVersion(version);
        }
        if (version.name === $("#versionChooserMainSecond").val()) {
            currentMilestoneNextRelease = getMilestoneForVersion(version);
        }
    });
}

function getMilestoneForVersion(version) {
    var release = new Date(version.releaseDate);
    release.setDate(release.getDate() - 1); // release date is set to monday after release, for the correct calculation of the week we need the actual release which is sunday
    var today = new Date();
    var dif = Math.round(release - today);
    var weeksTillRelease = today.getDay() < 3 ? Math.round((dif / 1000 / 60 / 60 / 24 / 7) - 1) : Math.round(dif / 1000 / 60 / 60 / 24 / 7);
    console.log("" + weeksTillRelease + " weeks till " + version.name);

    return weeksTillRelease;
}

function matchMileStoneLabelsFromGivenReleases() {
    for (var i = 1; i <= options.numberOfWeeksInTheFuture; i++) {
        matchedMilestones[i] = {
            mainRelease: "",
            nextRelease: ""
        };

        if (currentMilestoneMainRelease >= 0) {
            matchedMilestones[i].mainRelease = "R-" + currentMilestoneMainRelease;
        }
        if (currentMilestoneNextRelease >= 0) {
            matchedMilestones[i].nextRelease = "R-" + currentMilestoneNextRelease;
        }
        if (currentMilestoneMainRelease === -1) {
            matchedMilestones[i].mainRelease = "R+1";
        }
        if (currentMilestoneNextRelease === -1) {
            matchedMilestones[i].nextRelease = "R+1";
        }

        currentMilestoneMainRelease--;
        currentMilestoneNextRelease--;
    }
}

function resize() {
    AJS.$("#" + gadgetId + " iframe").css("height", $("html").css("height"));
    AJS.$.each(parent.AG.DashboardManager.activeLayout.getGadgets(), function (index, gadget) {
        gadget.resize();
    });
}
function startReportGeneration() {
    getCurrentMilestones();

    matchMileStoneLabelsFromGivenReleases();

    resetTable();

    var getAllEpicsForTeams = JIRA_BASE_URL + "search?maxResults=500&jql=project=SAM and team in (" + options.teams.join(",") + ") and status != Closed and issueType = Epic and fixVersion in ('" + $("#versionChooserMain").val() + "', '" + $("#versionChooserSmall").val() + "', '" + $("#versionChooserMainSecond").val() + "')";
    ajaxCall(getAllEpicsForTeams, consolidateFutureEffort);

    $.each(options.teams, function (index, team) {
        for (var i = options.numberOfWeeksInThePast; i > 0; i--) {
            $("#" + team).append('<td id="past' + i + '"></td>');
            var url = JIRA_BASE_URL + "search?maxResults=500&jql=project=SAM and team=" + team + " and (issuetype=Story or issuetype=Task) and (resolutiondate >=-" + i + "w and (resolution=Done or resolution=Fixed))";
            ajaxCallUnique(url, team, i, consolidatePastEffort);
        }

        $("#" + team).append('<td id="zero">0</td>');
    });


    $(document).ajaxStop(function () {
        $.each(options.teams, function (index, team) {
            var currentSum = 0;
            $.each(matchedMilestones, function (index) {
                currentSum += sumPerMileStone[team][index].sum;

                if (sumPerMileStone[team][index].sum > 0) {
                    $("#" + team + " #future" + (index)).empty();
                    $("#" + team + " #future" + (index)).append("<a target='_blank' href='http://jira.swisscom.com/issues/?jql=issuekey in (" + sumPerMileStone[team][index].issues.join(",") + ")'>" + Math.round((currentSum / 28800) * 100) / 100 + "</a>");
                } else {
                    $("#" + team + " #future" + (index)).text(0);
                }
            });
        });
        resize();
    });
}

function resetTable() {
    $("thead tr").empty();
    $("tbody").empty();

    $("#reportTable thead tr").append("<th>Team</th>th>");
    $("tbody").append('<tr id="Skipper"><td>Skipper</td></tr>');
    $("tbody").append('<tr id="Catta"><td>Catta</td></tr>');
    $("tbody").append('<tr id="Private"><td>Private</td></tr>');
    $("tbody").append('<tr id="Rico"><td>Rico</td></tr>');
    $("tbody").append('<tr id="Kowalski"><td>Kowalski</td></tr>');

    for (var i = options.numberOfWeeksInThePast; i > 0; i--) {
        $("#reportTable thead tr").append("<th>-" + i + "</th>");
    }
    $("#reportTable thead tr").append("<th>0</th>");

    $.each(options.teams, function (index, team) {
        sumPerMileStone[team] = {};
        $.each(matchedMilestones, function (index) {
            sumPerMileStone[team][index] = {sum: 0, issues: []};
        });
    });

    $.each(matchedMilestones, function (index, mileStone) {
        $("#reportTable thead tr").append("<th>" + mileStone.mainRelease + " / " + mileStone.nextRelease + "</th>");
    });

    resize();
}

function consolidatePastEffort(team, weeksInThePast, issues) {
    $("#" + team + " #past" + weeksInThePast).text("-" + calculateIssueSum(issues));
}

function consolidateFutureEffort(issues) {
    var groupedIssuesByTeam = _.groupBy(issues, function (issue) {
        return issue.fields.customfield_14850.value; //Team
    });

    $.each(_.keys(groupedIssuesByTeam), function (index, currentTeam) {
        $.each(matchedMilestones, function (index, mileStone) {
            $("#" + currentTeam).append('<td data-main="' + mileStone.mainRelease + '" data-next="' + mileStone.nextRelease + '" id="future' + (index) + '">0</td>');
        });

        var issueGroup = groupedIssuesByTeam[currentTeam];

        var groupedIssuesByMileStone = _.groupBy(issueGroup, function (issue) {
            var label, fixVersion;
            $.each(issue.fields.fixVersions, function (index, currentFixVersion) {
                fixVersion = currentFixVersion.name;
            });

            if (fixVersion === $("#versionChooserSmall").val()) {
                issue.fields.labels = [$("#mainReleaseMS").val()];
            }

            $.each(issue.fields.labels, function (i, currentLabel) {
                $.each(matchedMilestones, function (index, futureWeek) {
                    if ((fixVersion === $("#versionChooserMain").val() || fixVersion === $("#versionChooserSmall").val()) && futureWeek.mainRelease === currentLabel) {
                        label = "" + index;
                    }
                    if (fixVersion === $("#versionChooserMainSecond").val() && futureWeek.nextRelease === currentLabel) {
                        label = "" + index;
                    }
                });
            });

            //This is work that still has to be done even though the milestone is in the past
            if (label === undefined && fixVersion === $("#versionChooserMain").val() && issue.fields.labels.length > 0) {
                console.log("Epic with number: " + issue.key + " with labels: " + issue.fields.labels + " is not yet done or wrongly labeled and will be added to next weeks work");
                label = "" + 1;
            }
            if (label !== undefined) {
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

        $.each(sortable, function (index, mileStone) {
            if (mileStone !== "NotSpecified") {
                var getIssuesForEpicsUrl = JIRA_BASE_URL + "search?maxResults=5000&jql='Epic Link' in (" + _.pluck(groupedIssuesByMileStone[mileStone], 'key').join(", ") + ") and status != Closed and summary !~ 'Business Review' and summary !~ 'Ensure Documentation' and summary !~ 'Review Testcases by DEV-Spoc with Tester and SD'";
                matchedMilestones[mileStone][currentTeam] = "http://jira.swisscom.com/issues/?jql='Epic Link' in (" + _.pluck(groupedIssuesByMileStone[mileStone], 'key').join(", ") + ") and status != Closed and team=" + currentTeam;
                $.ajax({
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
    $.each(issues, function (index, issue) {
        var label, fixVersion;
        var teamForIssue = issue.fields.customfield_14850 != undefined ? issue.fields.customfield_14850.value : team;

        $.each(issue.fields.fixVersions, function (index, currentFixVersion) {
            fixVersion = currentFixVersion.name;
        });

        $.each(issue.fields.labels, function (indexthingy, currentLabel) {
            $.each(matchedMilestones, function (index, futureWeek) {
                if (fixVersion === $("#versionChooserMain").val() && futureWeek.mainRelease === currentLabel) {
                    label = "" + index;
                }
                if (fixVersion === $("#versionChooserMainSecond").val()) {
                    if (futureWeek.nextRelease === currentLabel) {
                        label = "" + index;
                    }
                }
            });
        });

        if (label && label !== mileStone) {
            sumPerMileStone[teamForIssue][label].sum += issue.fields.timeoriginalestimate;
            sumPerMileStone[teamForIssue][label].issues.push(issue.key);
        } else {
            sumPerMileStone[teamForIssue][mileStone].sum += issue.fields.timeoriginalestimate;
            sumPerMileStone[teamForIssue][mileStone].issues.push(issue.key);
        }
        if (label === 1) {
            console.log(sumPerMileStone[teamForIssue][label])
        }
    });


    var onlyFields = _.pluck(issues, "fields");
    var onlyEstimate = _.pluck(onlyFields, "timeoriginalestimate");
    return _.reduce(onlyEstimate, function (memo, num) {
        return num !== null ? memo + num : memo;
    }, 0);
}

function ajaxCall(url, successFunction) {
    return $.ajax({
        url: url,
        contentType: 'application/json',
        dataType: "json",
        success: function (data) {
            successFunction(data.issues);
        }
    });
}

function ajaxCallUnique(url, team, specialIdentifier, successFunction) {
    return $.ajax({
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

    $.each(issues, function (index, issue) {
        sumEstimate += issue.fields.timeoriginalestimate / 28800; //from millis to PT
    });

    return Math.round(sumEstimate * 100) / 100;
}

var Report = {};
Report.init = init;
window.Report = Report;
