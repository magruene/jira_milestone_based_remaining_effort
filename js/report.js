/**
 * Default options used if no options object is explicitly set. Values are:
 *  - teams: Teams which should be looked for while generating the report
 *  - possibleMilestoneLabels: milestone labels that should be looked for on epics/stories/tasks
 *  - numberOfWeeksInTheFuture: how many weeks from now I should go
 *  - numberOfWeeksInThePast: how many weeks should I go back?
 */

var defaultOptions = {
    "teams": ["Skipper", "Catta", "Yankee", "Private", "Rico", "Kowalski"],
    "possibleMilestoneLabels": ["R-20", "R-19", "R-18", "R-17", "R-16", "R-15", "R-14", "R-13", "R-12", "R-11", "R-10", "R-9", "R-8", "R-7", "R-6", "R-5", "R-4", "R-3", "R-2", "R-1", "R-0", "R1"],
    "numberOfWeeksInTheFuture": 25,
    "numberOfWeeksInThePast": 8
};

var sumPerMileStone = {},
    currentMilestoneMainRelease,
    currentMilestoneNextRelease,
    options,
    samVersions,
    onJira;

var matchedMilestones = {};


// http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
Date.prototype.getWeekNumber = function () {
    var d = new Date(+this);
    d.setMilliseconds(0);
    d.setHours(0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
};

//if not on jira, we need to initialize this.
if (!AJS) {
    onJira = false;
    var AJS = {};
    AJS.$ = $;
} else {
    onJira = true;
}

/**
 * Init with an optional options object. If none is given, take defaultOptions
 * @param givenOptions
 */
function init(givenOptions) {
    if (givenOptions === undefined) {
        options = defaultOptions;
    } else {
        options = givenOptions;
    }

    AJS.$.ajax({
        url: "http://jira.swisscom.com/rest/api/2/project/SAM/versions",
        contentType: 'application/json',
        dataType: "json",
        success: function (data) {
            samVersions = data;

            AJS.$.each(samVersions, function (index, version) {
                if (!version.released) {
                    AJS.$("#versionChooserMain").append("<option value='" + version.name + "'>" + version.name + "</option>");
                    AJS.$("#versionChooserSmall").append("<option value='" + version.name + "'>" + version.name + "</option>");
                    AJS.$("#versionChooserMainSecond").append("<option value='" + version.name + "'>" + version.name + "</option>");
                }
            });
            AJS.$("button").click(startReportGeneration);
        }
    });
}

function getMilestoneForVersion(version) {
    var release = new Date(version.releaseDate);
    release.setDate(release.getDate() - 1); // release date is set to monday after release, for the correct calculation of the week we need the actual release which is sunday
    console.log(("" + release.getWeekNumber() - new Date().getWeekNumber()) + 1 + " weeks till " + version.name);

    return release.getWeekNumber() - new Date().getWeekNumber();
}

function getCurrentMilestones() {
    AJS.$.each(samVersions, function (index, version) {
        if (version.name === AJS.$("#versionChooserMain").val()) {
            currentMilestoneMainRelease = getMilestoneForVersion(version);
        }
        if (version.name === AJS.$("#versionChooserMainSecond").val()) {
            currentMilestoneNextRelease = getMilestoneForVersion(version);
        }
    });
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

function startReportGeneration() {
    getCurrentMilestones();

    matchMileStoneLabelsFromGivenReleases();

    resetTable();

    var getAllEpicsForTeams = "http://jira.swisscom.com/rest/api/2/search?maxResults=500&jql=project=SAM and team in (" + options.teams.join(",") + ") and status != Closed and issueType = Epic and fixVersion in ('" + AJS.$("#versionChooserMain").val() + "', '" + AJS.$("#versionChooserSmall").val() + "', '" + AJS.$("#versionChooserMainSecond").val() + "')";
    ajaxCall(getAllEpicsForTeams, consolidateFutureEffort);

    AJS.$.each(options.teams, function (index, team) {
        for (var i = options.numberOfWeeksInThePast; i > 0; i--) {
            AJS.$("#" + team).append('<td id="past' + i + '"></td>');
            var url = "http://jira.swisscom.com/rest/api/2/search?maxResults=500&jql=project=SAM and team=" + team + " and (issuetype=Story or issuetype=Task) and (resolutiondate >=-" + i + "w and (resolution=Done or resolution=Fixed))";
            ajaxCallUnique(url, team, i, consolidatePastEffort);
        }

        AJS.$("#" + team).append('<td id="zero">0</td>');
    });


    AJS.$(document).ajaxStop(function () {
        AJS.$.each(options.teams, function (index, team) {
            var currentSum = 0;
            AJS.$.each(matchedMilestones, function (index) {
                currentSum += sumPerMileStone[team][index];

                if (sumPerMileStone[team][index] > 0) {
                    AJS.$("#" + team + " #future" + (index)).empty();
                    AJS.$("#" + team + " #future" + (index)).text("<a href='" + matchedMilestones[index].url + team + "'>" + Math.round((currentSum / 28800) * 100) / 100 + "</a>");
                } else {
                    AJS.$("#" + team + " #future" + (index)).text(0);
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

    for (var i = options.numberOfWeeksInThePast; i > 0; i--) {
        AJS.$("#reportTable thead tr").append("<th>-" + i + "</th>");
    }
    AJS.$("#reportTable thead tr").append("<th>0</th>");

    AJS.$.each(options.teams, function (index, team) {
        sumPerMileStone[team] = {};
        AJS.$.each(matchedMilestones, function (index) {
            sumPerMileStone[team][index] = 0;
        });
    });

    AJS.$.each(matchedMilestones, function (index, mileStone) {
        AJS.$("#reportTable thead tr").append("<th>" + mileStone.mainRelease + " / " + mileStone.nextRelease + "</th>");
    });
}

function consolidatePastEffort(team, weeksInThePast, issues) {
    AJS.$("#" + team + " #past" + weeksInThePast).text("-" + calculateIssueSum(issues));
}

function consolidateFutureEffort(issues) {
    var groupedIssuesByTeam = _.groupBy(issues, function (issue) {
        return issue.fields.customfield_14850.value; //Team
    });

    AJS.$.each(_.keys(groupedIssuesByTeam), function (index, currentTeam) {
        AJS.$.each(matchedMilestones, function (index) {
            AJS.$("#" + currentTeam).append('<td id="future' + (index) + '">0</td>');
        });

        var issueGroup = groupedIssuesByTeam[currentTeam];

        var groupedIssuesByMileStone = _.groupBy(issueGroup, function (issue) {
            var label, fixVersion;
            AJS.$.each(issue.fields.fixVersions, function (index, currentFixVersion) {
                fixVersion = currentFixVersion.name;
            });

            if (fixVersion === AJS.$("#versionChooserSmall").val()) {
                issue.fields.labels = [AJS.$("#mainReleaseMS").val()];
            }

            AJS.$.each(issue.fields.labels, function (i, currentLabel) {
                AJS.$.each(matchedMilestones, function (index, futureWeek) {
                    if (fixVersion === AJS.$("#versionChooserMain").val() && futureWeek.mainRelease === currentLabel) {
                        label = "" + index;
                    }
                    if (fixVersion === AJS.$("#versionChooserMainSecond").val() || fixVersion === AJS.$("#versionChooserSmall").val()) {
                        if (futureWeek.mainRelease !== undefined && futureWeek.nextRelease !== undefined) {
                            if (futureWeek.nextRelease === currentLabel) {
                                label = "" + index;
                            }
                        } else if (futureWeek.mainRelease !== undefined) {
                            if (futureWeek.mainRelease === currentLabel) {
                                label = "" + index;
                            }
                        }
                    }
                });
            });

            //This is work that still has to be done even though the milestone is in the past
            if (label === undefined && fixVersion === AJS.$("#versionChooserMain").val() && issue.fields.labels.length > 0) {
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

        AJS.$.each(sortable, function (index, mileStone) {
            if (mileStone !== "NotSpecified") {
                var getIssuesForEpicsUrl = "http://jira.swisscom.com/rest/api/2/search?maxResults=500&jql='Epic Link' in (" + _.pluck(groupedIssuesByMileStone[mileStone], 'key').join(", ") + ") and status != Closed and status != R4Review";
                matchedMilestones[mileStone].url = "http://jira.swisscom.com/issues/?jql='Epic Link' in (" + _.pluck(groupedIssuesByMileStone[mileStone], 'key').join(", ") + ") and status != Closed and status != R4Review and team=";
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
        var label, fixVersion;
        var teamForIssue = issue.fields.customfield_14850 != undefined ? issue.fields.customfield_14850.value : team;

        AJS.$.each(issue.fields.fixVersions, function (index, currentFixVersion) {
            fixVersion = currentFixVersion.name;
        });

        AJS.$.each(issue.fields.labels, function (indexthingy, currentLabel) {
            AJS.$.each(matchedMilestones, function (index, futureWeek) {
                if (fixVersion === AJS.$("#versionChooserMain").val() && futureWeek.mainRelease === currentLabel) {
                    label = "" + index;
                }
                if (fixVersion === AJS.$("#versionChooserMainSecond").val()) {
                    if (futureWeek.mainRelease !== undefined && futureWeek.nextRelease !== undefined) {
                        if (futureWeek.nextRelease === currentLabel) {
                            label = "" + index;
                        }
                    } else if (futureWeek.mainRelease !== undefined) {
                        if (futureWeek.mainRelease === currentLabel) {
                            label = "" + index;
                        }
                    }
                }
            });
        });

        if (label && label !== mileStone) {
            sumPerMileStone[teamForIssue][label] += issue.fields.timeoriginalestimate;
        } else {
            sumPerMileStone[teamForIssue][mileStone] += issue.fields.timeoriginalestimate;
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

var Report = {};
Report.init = init;
window.Report = Report;
