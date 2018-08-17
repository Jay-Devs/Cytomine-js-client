import * as utils from "./utils.js";
import {Project, ProjectCollection, User, UserCollection} from "@";

describe("Project", function() {

    let ontology;
    let name = utils.randomString();

    let project = null;
    let id = 0;

    before(async function() {
        await utils.connect();
        ({id: ontology} = await utils.getOntology());
    });

    after(async function() {
        await utils.cleanData();
    });

    describe("Create", function() {
        it("Create", async function() {
            project = new Project({name, ontology});
            project = await project.save();
            id = project.id;
            expect(project).to.be.an.instanceof(Project);
            expect(project.name).to.equal(name);
        });
    });

    describe("Fetch", function() {
        it("Fetch with static method", async function() {
            let fetchedProject = await Project.fetch(id);
            expect(fetchedProject).to.be.an.instanceof(Project);
            expect(fetchedProject.name).to.equal(name);
        });

        it("Fetch with instance method", async function() {
            let fetchedProject = await new Project({id}).fetch();
            expect(fetchedProject).to.be.an.instanceof(Project);
            expect(fetchedProject.name).to.equal(name);
        });

        it("Fetch with wrong ID", function() {
            expect(Project.fetch(0)).to.be.rejected;
        });
    });

    describe("Specific operations", function() {
        let nbUsers;
        let nbAdmins;
        let idUser;

        before(async function() {
            ({id: idUser} = await utils.getUser());
        });

        it("Fetch creator", async function() {
            let user = await project.fetchCreator();
            expect(user).to.be.instanceof(User);
            let currentUser = await User.fetchCurrent();
            expect(user.id).to.equal(currentUser.id);
        });

        it("Fetch users", async function() {
            let users = await project.fetchUsers();
            expect(users).to.be.instanceof(UserCollection);
            nbUsers = users.length;
        });

        it("Fetch users activity", async function() {
            let users = await project.fetchUsersActivity();
            expect(users).to.be.instanceof(UserCollection);
        });

        it("Fetch connected users", async function() {
            let users = await project.fetchConnectedUsers();
            expect(users).to.be.instanceof(Array);
        });

        it("Fetch user layers", async function() {
            let userLayers = await project.fetchUserLayers();
            expect(userLayers).to.be.instanceof(UserCollection);
        });

        it("Fetch admins", async function() {
            let admins = await project.fetchAdministrators();
            expect(admins).to.be.instanceof(UserCollection);
            nbAdmins = admins.length;
        });

        it("Fetch representatives", async function() {
            let representatives = await project.fetchRepresentatives();
            expect(representatives).to.be.instanceof(UserCollection);
        });

        it("Add user", async function() {
            await project.addUser(idUser);
            let users = await project.fetchUsers();
            expect(users.length).to.equal(nbUsers + 1);
        });

        it("Delete user", async function() {
            await project.deleteUser(idUser);
            let users = await project.fetchUsers();
            expect(users.length).to.equal(nbUsers);
        });

        it("Add admin", async function() {
            await project.addAdmin(idUser);
            let admins = await project.fetchAdministrators();
            expect(admins.length).to.equal(nbAdmins + 1);
        });

        it("Delete admin", async function() {
            await project.deleteAdmin(idUser);
            let admins = await project.fetchAdministrators();
            expect(admins.length).to.equal(nbAdmins);
        });
    });

    describe("Update", function() {
        it("Update", async function() {
            let newName = utils.randomString();
            project.name = newName;
            project = await project.update();
            expect(project).to.be.an.instanceof(Project);
            expect(project.name).to.equal(newName);
        });
    });

    describe("Delete", function() {
        it("Delete", async function() {
            await Project.delete(id);
        });

        it("Fetch deleted", function() {
            expect(Project.fetch(id)).to.be.rejected;
        });
    });

    // --------------------

    describe("ProjectCollection", function() {

        let nbProjects = 3;
        let projects;
        let totalNb = 0;

        let currentUser;
        let software;

        before(async function() {

            currentUser = await User.fetchCurrent();

            async function createAndAccessProject() {
                let project = new Project({name: utils.randomString(), ontology});
                await project.save();
                await project.recordUserConnection();
                return project;
            }

            let projectPromises = [];
            for(let i = 0; i < nbProjects; i++) {
                projectPromises.push(createAndAccessProject());
            }
            projects = await Promise.all(projectPromises);

            ({software} = await utils.getSoftwareProject({project: projects[0].id}));
        });

        after(async function() {
            let deletionPromises = projects.map(project => Project.delete(project.id));
            await Promise.all(deletionPromises);
        });

        describe("Fetch", function() {
            it("Fetch (instance method)", async function() {
                let collection = await new ProjectCollection().fetch();
                expect(collection).to.be.an.instanceof(ProjectCollection);
                expect(collection).to.have.lengthOf.at.least(nbProjects);
                totalNb = collection.length;
            });

            it("Fetch (static method)", async function() {
                let collection = await ProjectCollection.fetch();
                expect(collection).to.be.an.instanceof(ProjectCollection);
                expect(collection).to.have.lengthOf(totalNb);
            });

            it("Fetch with several requests", async function() {
                let collection = await ProjectCollection.fetch(Math.ceil(totalNb/3));
                expect(collection).to.be.an.instanceof(ProjectCollection);
                expect(collection).to.have.lengthOf(totalNb);
            });

            it("Fetch last opened projects", async function() {
                let collection = await ProjectCollection.fetchLastOpened(nbProjects);
                expect(collection).to.have.lengthOf(nbProjects);
                let listId = collection.map(project => project.id);
                projects.forEach(project => {
                    expect(listId).to.include(project.id);
                });
            });
        });

        describe("Working with the collection", function() {
            it("Iterate through", async function() {
                let collection = await ProjectCollection.fetch();
                for(let project of collection) {
                    expect(project).to.be.an.instanceof(Project);
                }
            });

            it("Add item to the collection", function() {
                let collection = new ProjectCollection();
                expect(collection).to.have.lengthOf(0);
                collection.push(new Project());
                expect(collection).to.have.lengthOf(1);
            });

            it("Add arbitrary object to the collection", function() {
                let collection = new ProjectCollection();
                expect(collection.push.bind(collection, {})).to.throw();
            });
        });


        describe("Filtering", function() {
            it("Filter on user", async function() {
                let collection = await ProjectCollection.fetchWithFilter("user", currentUser.id);
                expect(collection).to.have.lengthOf.at.least(nbProjects);
            });

            it("Filter on software", async function() {
                let collection = new ProjectCollection();
                collection.setFilter("software", software);
                await collection.fetch();
                expect(collection).to.have.lengthOf(1);
            });

            it("Filter on ontology", async function() {
                let collection = new ProjectCollection(0, "ontology", ontology);
                await collection.fetch();
                expect(collection).to.have.lengthOf.at.least(nbProjects);
            });
        });

        describe("Pagination", function() {
            let nbPerPage = 1;
            
            it("Fetch arbitrary page", async function() {
                let collection = new ProjectCollection(nbPerPage);
                await collection.fetchPage(1);
                expect(collection).to.have.lengthOf(nbPerPage);
            });

            it("Fetch next page", async function() {
                let collection = new ProjectCollection(nbPerPage);
                await collection.fetchNextPage();
                expect(collection).to.have.lengthOf(nbPerPage);
            });

            it("Fetch previous page", async function() {
                let collection = new ProjectCollection(nbPerPage);
                collection.curPage = 2;
                await collection.fetchPreviousPage();
                expect(collection).to.have.lengthOf(nbPerPage);
            });
        });

    });

});