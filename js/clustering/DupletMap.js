class DupletMap {
    constructor() {
        this.data = new Map();
    }

    add = function ([first, second, value]) {
        if (!this.data.has(first)) {
            this.data.set(first, new Map());
        }

        this.data.get(first).set(second, value);
        return this;
    };

    has = function ([first, second]) {
        return (
            this.data.has(first) &&
            this.data.get(first).has(second)
        );
    };

    get = function ([first, second]) {

        if (
            this.data.has(first) &&
            this.data.get(first).has(second)
        ) {
            return this.data.get(first).get(second)
        }

        return null
    };

    delete = function ([first, second]) {
        if (!this.data.has(first) ||
            !this.data.get(first).has(second)) return false;

        this.data.get(first).delete(second);
        if (this.data.get(first).size === 0) {
            this.data.delete(first);
        }

        return true;
    };

}

export { DupletMap }