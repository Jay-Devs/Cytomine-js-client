import * as cytomine from "@";
import randomstring from "randomstring";
import config from "./config.js";

let createdModels = [];

export async function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export async function connect(adminSession=false) {
    let cytomineInstance = new cytomine.Cytomine(config.host, config.basePath);
    await cytomineInstance.login(config.username, config.password);
    if(adminSession) {
        await cytomineInstance.openAdminSession();
    }
}

export function randomString() {
    return `TEST_JS_${randomstring.generate(10)}`;
}

async function getModel(model, collection, forceCreation) {
    if(!forceCreation) {
        await collection.fetchPage();
        if(collection.length > 0) {
            return collection.get(0);
        }
    }
    // if no model was found or if a new model is explicitly required with the forceCreation parameter
    await model.save();
    createdModels.push(model);
    console.log("Created " + model);
    return model;
}

// WARNING: issue prevents from creating abstract image => ensure one is available on test instance and leave
// forceCreation to false
export async function getAbstractImage({filename=randomString(), path, mime="image/tiff", forceCreation=false} = {}) {
    if(path == null) {
        path = "path/" + filename;
    }
    let abstractImage = new cytomine.AbstractImage({filename, path, mime});
    let abstractImageCollection = new cytomine.AbstractImageCollection(1);
    return getModel(abstractImage, abstractImageCollection, forceCreation);
}

// WARNING: no creation, the instances must exist
export async function getMultipleAbstractImages(nb) {
    let collection = new cytomine.AbstractImageCollection(nb);
    await collection.fetchPage();
    if(collection.length < nb) {
        throw new Error(`Not able to retrieve ${nb} abstract images. You may need to upload some on test instance.`);
    }
    let ids = [];
    for(let item of collection) {
        ids.push(item.id);
    }
    return ids;
}

export async function getAnnotation({location="POINT(5 5)", image, forceCreation=true, cascadeForceCreation} = {}) {
    let annotationCollection = new cytomine.AnnotationCollection({image});
    if(image == null) {
        if(!forceCreation) {
            throw new Error("Cannot retrieve annotation without base image. Either set forceCreation to true or provide an image");
        }
        ({id: image} = await getImageInstance({forceCreation: cascadeForceCreation, cascadeForceCreation}));
    }

    let annotation = new cytomine.Annotation({location, image});
    return getModel(annotation, annotationCollection, forceCreation);
}

export async function getGroup({name=randomString(), forceCreation=true} = {}) {
    let group = new cytomine.Group({name});
    let groupCollection = new cytomine.GroupCollection(1);
    return getModel(group, groupCollection, forceCreation);
}

export async function getImageInstance({baseImage, project, forceCreation=true, cascadeForceCreation} = {}) {
    if(!forceCreation && baseImage != null) {
        throw new Error("Cannot retrieve image instance of a given base image. Either set forceCreation to true or remove baseImage");
    }

    if(baseImage == null) {
        ({id: baseImage} = await getAbstractImage({forceCreation: cascadeForceCreation}));
    }

    let imageCollection = new cytomine.ImageInstanceCollection(1);
    if(project == null) {
        ({id: project} = await getProject({forceCreation: cascadeForceCreation, cascadeForceCreation}));
    }
    else {
        imageCollection.setFilter("project", project);
    }

    let image = new cytomine.ImageInstance({baseImage, project});
    return getModel(image, imageCollection, forceCreation);
}

export async function getJob({software, project, forceCreation=true, cascadeForceCreation} = {}) {
    if(software == null) {
        ({id: software} = await getSoftware({forceCreation: cascadeForceCreation}));
    }

    if(project == null) {
        ({id: project} = await getProject({forceCreation: cascadeForceCreation, cascadeForceCreation}));
    }

    let job = new cytomine.Job({software, project});
    let jobCollection = new cytomine.JobCollection({software, project}, 1);
    return getModel(job, jobCollection, forceCreation);
}

export async function getJobTemplate({software, project, name=randomString(), forceCreation=true, cascadeForceCreation} = {}) {
    if(!forceCreation && software != null) {
        throw new Error("Cannot retrieve job template of a given software. Either set forceCreation to true or remove software.");
    }

    if(software == null) {
        ({id: software} = await getSoftware({forceCreation: true})); // force creation because we need to add a software parameter
        await getSoftwareParameter({software, name: "annotation", forceCreation: true});
    }

    let jobTemplateCollection = new cytomine.JobTemplateCollection(1);
    if(project == null) {
        ({id: project} = await getProject({forceCreation: cascadeForceCreation, cascadeForceCreation}));
    }
    else {
        jobTemplateCollection.setFilter("project", project);
    }

    let jobTemplate = new cytomine.JobTemplate({software, project, name});
    return getModel(jobTemplate, jobTemplateCollection, forceCreation);
}

// WARNING: if an ontology is created, it may not be possible to delete it afterwards (bug in core preventing deletion
// if ontology used in deleted project) => leave forceCreation to false if possible
export async function getOntology({name=randomString(), forceCreation=false} = {}) {
    let ontology = new cytomine.Ontology({name});
    let ontologyCollection = new cytomine.OntologyCollection(1);
    return getModel(ontology, ontologyCollection, forceCreation);
}

export async function getProject({name=randomString(), ontology, forceCreation=true, cascadeForceCreation} = {}) {
    let projectCollection = new cytomine.ProjectCollection(1);
    if(ontology == null) {
        ({id: ontology} = await getOntology({forceCreation: cascadeForceCreation}));
    }
    else {
        projectCollection.setFilter("ontology", ontology);
    }
    let project = new cytomine.Project({name, ontology});
    return getModel(project, projectCollection, forceCreation);
}

export async function getRole() {
    let collection = new cytomine.RoleCollection(1);
    return getModel(null, collection, false);
}

export async function getMultipleRoles(nb) {
    let collection = new cytomine.RoleCollection(nb);
    await collection.fetchPage();
    if(collection.length < nb) {
        throw new Error(`Not able to retrieve ${nb} roles.`);
    }
    let ids = [];
    for(let item of collection) {
        ids.push(item.id);
    }
    return ids;
}

export async function getSoftware({name=randomString(), serviceName="createRabbitJobService", executeCommand="clear", forceCreation=true} = {}) {
    let software = new cytomine.Software({name, serviceName, executeCommand});
    let softwareCollection = new cytomine.SoftwareCollection(1);
    return getModel(software, softwareCollection, forceCreation);
}

export async function getSoftwareParameter({name=randomString(), software, type="String", forceCreation=true, cascadeForceCreation} = {}) {
    let softwareParameterCollection = new cytomine.SoftwareParameterCollection(1);
    if(software == null) {
        ({id: software} = await getSoftware({forceCreation: cascadeForceCreation}));
    }
    else {
        softwareParameterCollection.setFilter("software", software);
    }
    let softwareParameter = new cytomine.SoftwareParameter({software, name, type});
    return getModel(softwareParameter, softwareParameterCollection, forceCreation);
}

export async function getSoftwareProject({software, project, forceCreation=true, cascadeForceCreation} = {}) {
    if(!forceCreation && software != null) {
        throw new Error("Cannot retrieve software project of a given software. Either set forceCreation to true or remove software.");
    }

    if(software == null) {
        ({id: software} = await getSoftware({forceCreation: cascadeForceCreation}));
    }

    let softwareProjectCollection = new cytomine.SoftwareProjectCollection(1);
    if(project == null) {
        ({id: project} = await getProject({forceCreation: cascadeForceCreation, cascadeForceCreation}));
    }
    else {
        softwareProjectCollection.setFilter("project", project);
    }
    let softwareProject = new cytomine.SoftwareProject({software, project});
    return getModel(softwareProject, softwareProjectCollection, forceCreation);
}

// WARNING: bug in core prevents the deletion of storage => it is advised to leave user field to null, so that the
// deletion of the user during clean-up triggers the deletion of the storage
export async function getStorage({user, name=randomString(), basePath, forceCreation=true, cascadeForceCreation} = {}) {
    if(!forceCreation && user != null) {
        throw new Error("Cannot retrieve storage of a given user. Either set forceCreation to true or remove user.");
    }

    let storageCollection = new cytomine.StorageCollection(1);
    if(user == null) {
        ({id: user} = await getUser({forceCreation: cascadeForceCreation}));
    }

    basePath = basePath || name;
    let storage = new cytomine.Storage({user, name, basePath});
    return getModel(storage, storageCollection, forceCreation);
}

export async function getTerm({name=randomString(), ontology, color="#ffffff", forceCreation=true, cascadeForceCreation} = {}) {
    let termCollection = new cytomine.TermCollection(1);
    if(ontology == null) {
        ({id: ontology} = await getOntology({forceCreation: cascadeForceCreation}));
    }
    else {
        termCollection.setFilter("ontology", ontology);
    }
    let term = new cytomine.Term({name, ontology, color});
    return getModel(term, termCollection, forceCreation);
}

export async function getUser({username=randomString(), password, email, firstname, lastname, forceCreation=true} = {}) {
    password = password || username;
    firstname = firstname || username;
    lastname = lastname || username;
    email = email || (username + "@cytomine.coop");

    let userCollection = new cytomine.UserCollection(1);
    let user = new cytomine.User({username, password, firstname, lastname, email});
    return getModel(user, userCollection, forceCreation);
}

export async function cleanData() {
    await cytomine.Cytomine.instance.openAdminSession();

    // delete models sequentially and in reverse order to ensure there is no foreign key constraint issues
    for(let i = createdModels.length - 1; i >= 0; i--) {
        let model = createdModels[i];
        try {
            await model.delete();
            console.log("Deleted " + model);
        }
        catch(err) {
            console.log(`Failed to delete ${model}`);
        }
    }
    createdModels = [];
}