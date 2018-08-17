import Cytomine from "../cytomine.js";
import Model from "./model.js";

export default class ImageInstance extends Model {
    /** @inheritdoc */
    static get callbackIdentifier() {
        return "imageinstance";
    }

    /** @inheritdoc */
    _initProperties() {
        super._initProperties();

        this.baseImage = null;
        this.project = null;
        this.user = null;

        this.filename = null;
        this.originalFilename = null;
        this.extension = null;
        this.instanceFilename = null;
        this.path = null;
        this.fullPath = null;

        this.mime = null;
        this.sample = null;

        this.width = null;
        this.height = null;
        this.resolution = null;
        this.magnification = null;
        this.depth = null;

        this.thumb = null;
        this.preview = null;
        this.macro = null;

        this.numberOfAnnotations = null;
        this.numberOfJobAnnotations = null;
        this.numberOfReviewedAnnotations = null;

        this.reviewStart = null;
        this.reviewStop = null;
        this.reviewUser = null;
        this.reviewed = null;
        this.inReview = null;
    }

    /** @inheritdoc */
    toString() {
        return `[${this.callbackIdentifier}] ${this.id}: ${this.instanceFilename}`;
    }

    /**
    * Fetch the next image instance of the project (first image created before)
    *
    * @returns {ImageInstance}
    */
    async fetchNext() {
        if(this.isNew()) {
            throw new Error("Cannot fext next image of an image instance with no ID.");
        }

        let {data} = await Cytomine.instance.api.get(`${this.callbackIdentifier}/${this.id}/next.json`);
        return new ImageInstance(data);
    }

    /**
    * Fetch the previous image instance of the project (first image created after)
    *
    * @returns {ImageInstance}
    */
    async fetchPrevious() {
        if(this.isNew()) {
            throw new Error("Cannot fext next image of an image instance with no ID.");
        }

        let {data} = await Cytomine.instance.api.get(`${this.callbackIdentifier}/${this.id}/previous.json`);
        return new ImageInstance(data);
    }

    /**
     * Record a consultation of the image by the current user
     *
     * @param {string} [mode=view] The consultation mode
     */
    async recordConsultation(mode="view") {
        if(this.isNew()) {
            throw new Error("Cannot record consultation of image with no ID.");
        }

        await Cytomine.instance.api.post(`${this.callbackIdentifier}/${this.id}/consultation.json`, {
            image: this.id,
            mode
        });
    }


    /**
     * Fetch the layers associated with the base abstract image in other projects
     *
     * @param {number} project  The identifier of the project to search. If not set, all projects will be considered.
     *
     * @returns {Array<{image, project, projectName, user, username, firstname, lastname, admin}>} the layers
     */
    async fetchLayersInOtherProjects(project) {
        if(this.isNew()) {
            throw new Error("Cannot record consultation of image with no ID.");
        }

        let params = {};
        if(project != null) {
            params.project = project;
        }

        let {data} = await Cytomine.instance.api.get(`${this.callbackIdentifier}/${this.id}/sameimagedata.json`, {params});
        return data.collection;
    }

    /**
     * Copy to the image instance the properties and description associated with the provided source image
     *
     * @param {number} idSource Identifier of the source image instance
     */
    async copyMetadata(idSource) {
        if(this.isNew()) {
            throw new Error("Cannot copy metadat to an image instance with no ID.");
        }

        if(idSource == null) {
            throw new Error("The ID of the source image was not provided.");
        }

        await Cytomine.instance.api.post(`${this.callbackIdentifier}/${this.id}/copymetadata.json?based=${idSource}`);
    }

    /**
    * Copy to the image instance all annotations from provided layers
    *
    * @param {Array<{image: Number, user: Number}>} layers  Layers to copy
    * @param {boolean} [giveMe=false]   If true, all copied annotations will be added to the current user layer
    */
    async copyData(layers, giveMe=false) {
        if(this.isNew()) {
            throw new Error("Cannot copy data to an image instance with no ID.");
        }

        if(layers == null || layers.length == 0) {
            throw new Error("At least one layer (characterized by image/user object) must be provided.");
        }

        let formattedLayers = layers.map(layer => `${layer.image}_${layer.user}`);
        let stringLayers = formattedLayers.join();

        await Cytomine.instance.api.post(`${this.callbackIdentifier}/${this.id}/copyimagedata.json?layers=${stringLayers}&giveMe=${giveMe}`);
    }

    /**
     * Start the review of the image instance
     *
     * @returns {this} The image instance as returned by backend
     */
    async review() {
        if(this.isNew()) {
            throw new Error("Cannot review animage with no ID.");
        }

        let {data} = await Cytomine.instance.api.put(`${this.callbackIdentifier}/${this.id}/review.json`);
        this.populate(data[this.callbackIdentifier]);
        return this;
    }

    /**
     * Stop the review of the image instance (either validates the image or cancel the review/the validation)
     *
     * @param {boolean} [cancel=false]  If true, cancels the review (if the image is under review) or the validation
     *                                  (if the image is validated)
     *                                  If false, stop the review and validate the image
     *
     * @returns {type} Description
     */
    async stopReview(cancel=false) {
        if(this.isNew()) {
            throw new Error("Cannot stop the review on an image with no ID.");
        }

        let {data} = await Cytomine.instance.api.delete(`${this.callbackIdentifier}/${this.id}/review.json?cancel=${cancel}`);
        this.populate(data[this.callbackIdentifier]);
        return this;
    }

}