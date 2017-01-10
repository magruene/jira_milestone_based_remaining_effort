export function getMatchingFixVersions() {
    return new Promise((resolve, reject) => {
        jira.project.getVersions({projectIdOrKey: 'SAM'}, (error, versions) => {
            if (error) {
                reject();
                throw new Error("Could not retrieve versions. Cannot continue.");
            }

            let matchingFixVersions = [];
            let today = new Date();
            let future = today.addWeeks(reportOptions.weeksInFuture);

            versions.forEach((version) => {
                let releaseDate = new Date(version.releaseDate);

                if (!version.released && !version.overdue && (today <= releaseDate) && (releaseDate <= future)) {
                    matchingFixVersions.push(version);
                }
            });

            resolve(matchingFixVersions);
        });
    });
}