import Cytomine from "../cytomine.js";
import Model from "./model.js";

export default class AbstractAnnotationTerm extends Model {

    /** @inheritdoc */
    _initProperties() {
        super._initProperties();

        this.annotation = null;
        this.term = null;
        this.user = null;
    }

    /** @override */
    update() {
        throw new Error("An AnnotationTerm instance cannot be updated.");
    }

    /**
     * @override
     * @static Fetch an annotation term
     *
     * @param {number} annotation The identifier of the annotation
     * @param {number} term       The identifier of the term
     *
     * @returns {this} The fetched object
     */
    static async fetch(annotation, term) {
        return new this({id: 0, annotation, term}).fetch(); // ID set to 0 to bypass the isNew() verification
    }

    /** @inheritdoc */
    async fetch() {
        this.id = 0; // ID set to 0 to bypass the isNew() verification
        return super.fetch();
    }

    /**
     * @override
     * @static Delete an annotation term
     *
     * @param {number} annotation The identifier of the annotation
     * @param {number} term       The identifier of the term
     */
    static async delete(annotation, term) {
        return new this({id: 0, annotation, term}).delete(); // ID set to 0 to bypass the isNew() verification
    }

    /**
     * Add an annotation term and remove all other annotation terms
     *
     * @param {boolean} [clearForAllUsers=false] Whether the terms added by all users should be removed or only the current one
     */
    async saveAndClearPrevious(clearForAllUsers=false) {
        if(this.annotation == null || this.term == null) {
            throw new Error("Cannot add annotation term with no annotation ID or term ID.");
        }
        let {data} = await Cytomine.instance.api.post(`annotation/${this.annotation}/term/${this.term}/clearBefore.json`,
            {clearForAll: clearForAllUsers});

        this.populate(data[this.callbackIdentifier]);
        return this;
    }

    /** @inheritdoc */
    get uri() {
        if(this.annotation == null || this.term == null) {
            throw new Error("Impossible to construct Annotation Term URI with no annotation ID or term ID.");
        }
        return `annotation/${this.annotation}/term/${this.term}.json`;
    }
}