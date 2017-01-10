import Issue from "./issue";

export default class Story extends Issue {

    constructor(key, fixVersion, team, labels, estimate) {
        super(key, fixVersion, team, labels);
        this.estimate = estimate;
    }
}