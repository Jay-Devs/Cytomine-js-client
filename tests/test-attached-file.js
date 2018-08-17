import * as utils from "./utils.js";
import {AttachedFile, AttachedFileCollection} from "@";

describe("AttachedFile", function() {

    let file = new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/xml"});
    let filename = "test_file.xml";
    let abstractImage;

    let attachedFile = null;
    let id = 0;

    before(async function() {
        this.timeout(10000);
        await utils.connect();
        abstractImage = await utils.getAbstractImage();
    });

    after(async function() {
        await utils.cleanData();
    });

    describe("Create", function() {
        it("Create", async function() {
            attachedFile = new AttachedFile({file, filename}, abstractImage);
            await attachedFile.save();
            id = attachedFile.id;
            expect(attachedFile).to.be.an.instanceof(AttachedFile);
            expect(attachedFile.id).to.be.above(0);
        });

        it("Create without providing associated object", async function() {
            function fcn() {
                new AttachedFile({file});
            }
            expect(fcn).to.throw();
        });

        it("Create without providing file", async function() {
            let attachedFile = new AttachedFile({}, abstractImage);
            expect(attachedFile.save()).to.be.rejected;
        });
    });

    describe("Fetch", function() {
        it("Fetch with static method", async function() {
            let fetchedFile = await AttachedFile.fetch(id, abstractImage);
            expect(fetchedFile).to.be.an.instanceof(AttachedFile);
            expect(fetchedFile.domainIdent).to.equal(abstractImage.id);
            // expect(fetchedFile.filename).to.equal(filename);
        });

        it("Fetch with instance method", async function() {
            let fetchedFile = await new AttachedFile({id}, abstractImage).fetch();
            expect(fetchedFile).to.be.an.instanceof(AttachedFile);
            expect(fetchedFile.domainIdent).to.equal(abstractImage.id);
            // expect(fetchedFile.filename).to.equal(filename);
        });

        it("Fetch without providing associated object", function() {
            expect(AttachedFile.fetch({id})).to.be.rejected;
        });
    });

    describe("Update", function() {
        it("Update", function() {
            attachedFile.filename = "new_filename.xml";
            expect(attachedFile.update.bind(attachedFile, {})).to.throw();
        });
    });

    describe("Delete", function() {
        it("Delete", function() {
            expect(attachedFile.delete.bind(attachedFile, {})).to.throw();
        });
    });

    // --------------------

    describe("AttachedFileCollection", function() {
        let nbAttachedFiles = 3;
        let attachedFiles;
        let totalNb = 0;

        before(async function() {
            let attachedFilePromises = [];
            for(let i = 0; i < nbAttachedFiles; i++) {
                attachedFilePromises.push(new AttachedFile({file}, abstractImage).save());
            }
            attachedFiles = await Promise.all(attachedFilePromises);
        });

        after(async function() {
            // TODO: uncomment once delete operation implemented in core
            //let deletionPromises = attachedFiles.map(attachedFile => AttachedFile.delete(attachedFile.id));
            //await Promise.all(deletionPromises);
        });

        describe("Fetch", function() {
            it("Fetch (instance method)", async function() {
                let collection = await new AttachedFileCollection(abstractImage).fetch();
                expect(collection).to.be.an.instanceof(AttachedFileCollection);
                expect(collection).to.have.lengthOf.at.least(nbAttachedFiles);
                totalNb = collection.length;
            });

            it("Fetch (static method)", async function() {
                let collection = await AttachedFileCollection.fetch(abstractImage);
                expect(collection).to.be.an.instanceof(AttachedFileCollection);
                expect(collection).to.have.lengthOf(totalNb);
            });

            it("Fetch with several requests", async function() {
                let collection = await AttachedFileCollection.fetch(abstractImage, Math.ceil(totalNb/3));
                expect(collection).to.be.an.instanceof(AttachedFileCollection);
                expect(collection).to.have.lengthOf(totalNb);
            });

            it("Fetch without associated object", async function() {
                expect(AttachedFileCollection.fetch()).to.be.rejected;
            });
        });

        describe("Working with the collection", function() {
            it("Iterate through", async function() {
                let collection = await AttachedFileCollection.fetch(abstractImage);
                for(let attachedFile of collection) {
                    expect(attachedFile).to.be.an.instanceof(AttachedFile);
                }
            });

            it("Add item to the collection", function() {
                let collection = new AttachedFileCollection(abstractImage);
                expect(collection).to.have.lengthOf(0);
                collection.push(new AttachedFile({file}, abstractImage));
                expect(collection).to.have.lengthOf(1);
            });

            it("Add arbitrary object to the collection", function() {
                let collection = new AttachedFileCollection(abstractImage);
                expect(collection.push.bind(collection, {})).to.throw();
            });
        });

        describe("Pagination", function() {
            let nbPerPage = 1;

            it("Fetch arbitrary page", async function() {
                let collection = new AttachedFileCollection(abstractImage, nbPerPage);
                await collection.fetchPage(2);
                expect(collection).to.have.lengthOf(nbPerPage);
            });

            it("Fetch next page", async function() {
                let collection = new AttachedFileCollection(abstractImage, nbPerPage);
                await collection.fetchNextPage();
                expect(collection).to.have.lengthOf(nbPerPage);
            });

            it("Fetch previous page", async function() {
                let collection = new AttachedFileCollection(abstractImage, nbPerPage);
                collection.curPage = 2;
                await collection.fetchPreviousPage();
                expect(collection).to.have.lengthOf(nbPerPage);
            });
        });

    });

});