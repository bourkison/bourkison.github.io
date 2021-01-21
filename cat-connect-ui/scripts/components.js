/*

    product:
    {
        productName: "",
        currentPrice: "",
        previousPrice: "",
        discountAmount: "", // Usually equal to previousPrice - currentPrice. Seperate value in case of rounding.
        imgURL: ""
    }

*/

Vue.component("Home", {
    data: function() {
        return {
        }
    },

    template: `
        <div class="home">
            <h1>Catalogue Connect Feed Builder</h1>

            <NewFeed></NewFeed>
        </div>
    `
});


Vue.component("NewFeed", {
    data: function() {
        return {
            stepOneCompleted: false,
            stepTwoCompleted: false,
            isLoading: false,
            feed: {},
            products: [],
            finalJson: "",
            inputJson: "",
            advertiserName: "",
            imageUploadIncrementor: 0,
            productIncrementor: 0
        }
    },

    methods: {
        createProductTemplates: function() {
            this.stepOneCompleted = true;
        },

        editFeed: function() {
            this.products = JSON.parse(this.inputJson).data.products;
            this.products.forEach(p => {
                p.id = this.productIncrementor;
                this.productIncrementor++;
            })

            this.feed = JSON.parse(this.inputJson).data.feed;

            this.stepOneCompleted = true;
        },

        handleHeroFileChangeCreate: function(e) {
            this.feed.heroImageFile = e.target.files[0];
            this.feed.heroImageUrl = URL.createObjectURL(this.feed.heroImageFile);
        },

        handleLogoFileChangeCreate: function(e) {
            this.feed.logoImageFile = e.target.files[0];
            this.feed.logoImageUrl = URL.createObjectURL(this.feed.logoImageFile);
        },

        handleFileChangeCreate: function(e) {
            this.products = [];
            
            Array.prototype.forEach.call(e.target.files, f => {
                this.products.push({ id: this.productIncrementor, imgFile: f, imgUrl: URL.createObjectURL(f) });
                this.productIncrementor++
            })
        },

        handleFileChangeUpdate: function(e) {
            Array.prototype.forEach.call(e.target.files, f => {
                this.products.push({ id: this.productIncrementor, imgFile: f, imgUrl: URL.createObjectURL(f) });
                this.productIncrementor++
            })
        },

        buildJson: function() {
            if (this.products.length > 0) {
                this.isLoading = true;

                let imageRef = storage.ref(this.advertiserName + "/logo_" + Number(new Date()) + ".jpg");
                imageRef.put(this.feed.logoImageFile).then(logo => {
                    imageRef.getDownloadURL().then(logoUrl => {
                        this.feed.logoImageUrl = logoUrl;
                        delete this.feed.logoImageFile;

                        imageRef = storage.ref(this.advertiserName + "/hero_" + Number(new Date()) + ".jpg");
                        imageRef.put(this.feed.heroImageFile).then(heroUrl => {
                            imageRef.getDownloadURL().then(heroUrl => {
                                this.feed.heroImageUrl = heroUrl;
                                delete this.feed.heroImageFile;

                                Array.prototype.forEach.call(this.products, p => {
                                    // Check for p.imgFile to differentiate between already uploaded products
                                    // And products to upload.
                                    if (p.imgFile) {
                                        let imageRef = storage.ref(this.advertiserName + "/products/" + Number(new Date()) + ".jpg");
                                        imageRef.put(p.imgFile).then(f => {
                                            // Uploaded to storage. Now retrieve URL.
                                            imageRef.getDownloadURL().then(url => {
                                                p.imgUrl = url;
                                                delete p.imgFile;
                                                delete p.id;
                                                this.imageUploadIncrementor++;
                                            }).catch(e => {
                                                console.log("Error retrieving download URL.", e);
                                            })
                                        }).catch(e => {
                                            console.log("Error uploading file.", e);
                                        })
                                    } else {
                                        this.imageUploadIncrementor++;
                                    }
                                })
                            }).catch(e => {
                                console.log("Error retrieving hero download URL", e);
                            })
                        }).catch(e => {
                            console.log("Error uploading hero", e);
                        })  
                    }).catch(e => {
                        console.log("Error retrieving logo download URL.", e);
                    })
                }).catch(e => {
                    console.log("Error uploading logo", e);
                })
            } else {
                alert("Please add products before continuing.");
            }
        },

        copyToClipboard: function() {
            let dummy = document.createElement("textArea");
            document.body.appendChild(dummy);
            dummy.value = this.finalJson;
            dummy.select();
            document.execCommand("copy");
            document.body.removeChild(dummy);
        },

        restart: function() {
            this.stepOneCompleted = false;
            this.stepTwoCompleted = false;
            this.isLoading = false;
            this.feed = {};
            this.products = [];
            this.finalJson = "";
            this.inputJson = "";
            this.advertiserName = "";
            this.imageUploadIncrementor = 0;
            this.productIncrementor = 0;
        }
    },

    watch: {
        imageUploadIncrementor: function(n, o) {
            if (n == this.products.length) {
                this.finalJson = JSON.stringify({ advertiser: this.advertiserName, data: { feed: this.feed, products: this.products } })
                this.isLoading = false;
                this.stepTwoCompleted = true;
            }

            console.log(n, this.products.length);
        }
    },

    template: `
        <div class="newFeed">
            <div v-if="!stepOneCompleted && !isLoading">
                <h2><i>First step: Upload an image for each product you plan on adding (more images/products cam be added later).</i></h2>
                <form v-on:submit.prevent="createProductTemplates">
                    <input type="text" v-model.trim="advertiserName" placeholder="Advertiser ID" required /><br>
                    <label for="logoImage">Logo Image:</label>
                    <input type="file" accept="image/*" id="logoImage" v-bind:file="feed" v-on:input="handleLogoFileChangeCreate($event)" required /><br>
                    <label for="heroImage">Hero Image:</label>
                    <input type="file" accept="image/*" id="heroImage" v-bind:file="feed" v-on:input="handleHeroFileChangeCreate($event)" required /><br>
                    <label for="productImage">Product Images(can add multiple):</label>
                    <input type='file' accept='image/*' id='productImage' v-bind:file='products' v-on:input="handleFileChangeCreate($event)" multiple required /><br>
                    <input type="submit" />
                </form><br><br>     

                <h2><i>Alternatively input a current feed to edit</i></h2>
                <textarea placeholder="Input Feed" v-model="inputJson"></textarea>
                <button v-on:click="editFeed">Edit Feed</button>
            </div>

            <div v-if="stepOneCompleted && !stepTwoCompleted && !isLoading">
                <h2><i>Second step: Add in details for each product. Press "Build JSON" when finished.</i></h2>
                <button v-on:click="buildJson">Build JSON!</button><br><br> 
                <img v-bind:src="feed.logoImageUrl" style="width:300px;"/><br>
                <img v-bind:src="feed.heroImageUrl" style="width:300px;" /><br>
                <Product v-for="product in products"  v-bind:pInc="productIncrementor" v-bind:productArr="products" v-bind:productObj="product" :key=product.id /><br>
                <span>Add more: </span><input type='file' accept='image/*' id='productImage' v-bind:file='products' v-on:input="handleFileChangeUpdate($event)" multiple /><br>
            </div>

            <div v-if="stepOneCompleted && stepTwoCompleted && !isLoading">
                <h2><i>JSON</i></h2>
                <button v-on:click="copyToClipboard">Copy to Clipboard</button>
                <button v-on:click="restart">Make a New Feed</button>
                <p id="finalJson">{{ finalJson }}</p>
            </div>

            <div v-if="isLoading" class="loader"></div>
        </div>
    `
});

Vue.component(("Product"), {
    data: function() {
        return {

        }
    },
    props: ["productObj", "productArr", "pInc"],
    methods: {
        deleteProduct: function() {
            this.$props.productArr.splice(this.$props.productObj.id, 1);
            // Need to reset up IDs of elements.
            this.$props.pInc = 0;

            this.$props.productArr.forEach(p => {
                p.id = this.$props.pInc;
                this.$props.pInc++;
            })
        },

        handleImageEdit: function(e) {
            console.log(this.$props.productObj);
            this.$props.productObj.imgFile = e.target.files[0];
            this.$props.productObj.imgUrl = URL.createObjectURL(this.$props.productObj.imgFile);
            console.log(this.$props.productObj);
        }
    },
    template: `
        <div class="product">
            <img v-bind:src="productObj.imgUrl" />
            <div class="textCont">
                <label for="pName">Name:</label>
                <input type="text" id="pName" v-model="productObj.name" /><br>

                <label for="pCurrentPrice">New Price:</label>
                <input type="text" id="pCurrentPrice" v-model="productObj.currentPrice" /><br>

                <label for="pOldPrice">Old Price</label>
                <input type="text" id="pOldPrice" v-model="productObj.previousPrice" /><br>

                <label for="pDiscountAmount">Discount Amount (Old Price - New Price):</label>
                <input type="text" id="pDiscountAmount" v-model="productObj.discountAmount" /><br>

                <input type="file" v-bind:file="productObj.imgFile" accept="image/*" v-on:input="handleImageEdit($event)" />
                <button v-on:click="deleteProduct">Delete</button>
            </div>
        </div>
    `
})
