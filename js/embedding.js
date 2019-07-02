//--------------------------------------------------------------------------
// base classes
//--------------------------------------------------------------------------

// EmbeddingView
class EmbeddingView {
    constructor(parentID) {
        this.scene = new THREE.Scene();
        // create axesHelper
        this.axesHelper = new THREE.AxesHelper(2);
        this.scene.add(this.axesHelper);

        // get render area
        this.renderArea = document.getElementById(parentID);

        // create renderer
        this.renderer = new THREE.WebGLRenderer(this.renderArea);
        this.renderer.setSize(this.renderArea.clientWidth, this.renderArea.clientHeight);
        this.renderArea.appendChild(this.renderer.domElement);

        // create camera
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.z = 5;

        // create orbit control
        this.controls = new THREE.OrbitControls(this.camera, this.renderArea);
    }

    // render
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    // updateRenderArea
    updateRenderArea() {
        // update 
        this.renderer.setSize(this.renderArea.clientWidth, this.renderArea.clientHeight);
        this.camera.aspect = this.renderArea.clientWidth / this.renderArea.clientHeight;
        this.camera.updateProjectionMatrix();
    }
}

// EmbeddedInfo
class EmbeddedInfo {
    constructor() {
        this.name = "";
        this.type = 0;
        this.x = 0.0;
        this.y = 0.0;
        this.z = 0.0;
    }

    // parseFromString
    parseFromString(str) {
        // chech for empty string
        if (str.length === 0) return;
        var params = str.split(',');
        params = params.map(param => param.trim());

        // set embedded info
        this.name = String(params[0]);
        this.type = parseInt(params[1]) || 0;
        this.x = Number(params[2]);
        this.y = Number(params[3]);
        this.z = Number(params[4]);
    }
}

// EmbeddedInfoList
class EmbeddedInfoList {
    constructor() {
        this.embeddedInfos = [];
        this.embeddedInfoTypeMax = 0;
    }

    // getEmbeddedInfoByName 
    getEmbeddedInfoByName(name) {
        for (var i = 0; i < this.embeddedInfos.length; i++) {
            var embeddedInfo = this.embeddedInfos[i];
            if (embeddedInfo.name === name)
                return embeddedInfo;
        }
        return null;
    }

    // isEmbeddedInfoExistsByName
    isEmbeddedInfoExistsByName(name) {
        for (var i = 0; i < this.embeddedInfos.length; i++) {
            var embeddedInfo = this.embeddedInfos[i];
            if (embeddedInfo.name === name)
                return true;
        }
        return false;
    }

    // loadFromFile
    loadFromFile(f, callback) {
        // parce text file
        var r = new FileReader();
        r.onload = function (e) {
            e.target.result.split('\n').forEach(str => {
                if (str.length === 0) return;

                // create and parse EmbeddedInfo
                var embeddedInfo = new EmbeddedInfo();
                embeddedInfo.parseFromString(str);

                // create new embedded info if null
                if (!this.embeddedInfoList.isEmbeddedInfoExistsByName(embeddedInfo.name))
                    this.embeddedInfoList.embeddedInfos.push(embeddedInfo);
            });
            this.embeddedInfoList.updateEmbeddedInfoTypeMax();
            if (callback)
                callback();
        }
        r.embeddedInfoList = this;
        r.readAsText(f);
    }

    // updateEmbeddedInfoTypeMinMax
    updateEmbeddedInfoTypeMax() {
        this.embeddedInfoTypeMax = 0;
        for (var i = 0; i < this.embeddedInfos.length; i++)
            if (this.embeddedInfoTypeMax < this.embeddedInfos[i].type)
                this.embeddedInfoTypeMax = this.embeddedInfos[i].type;
    }

    // getColorByType
    getColorByType(type) {
        var result = {};
        if (type !== NaN) {
            result.r = gEmbeddedColorTable[type][0]/255;
            result.g = gEmbeddedColorTable[type][1]/255;
            result.b = gEmbeddedColorTable[type][2]/255;
        }
        return result;
    }
}

// global classes
var gEmbeddingView = new EmbeddingView("embeddedRenderArea");
var gEmbeddedInfoList = new EmbeddedInfoList();
var gEmbeddedImagesLoaded = new Set(); // set of file names (strings)
var gEmbeddedColorTable = [
    [000,000,255], // 00
    [000,255,000], // 01
    [000,255,255], // 02
    [255,000,000], // 03
    [255,000,255], // 04
    [255,255,000], // 05

    [000,000,128], // 06
    [000,128,000], // 07
    [000,128,128], // 08
    [255,000,000], // 09
    [255,000,128], // 10
    [255,128,000], // 11

    [000,000,128], // 12
    [000,128,000], // 13
    [000,128,128], // 14
    [128,000,000], // 15
    [128,000,128], // 16
    [128,128,000], // 17
]

// renderEmbedded
var renderEmbedded = function () {
    gEmbeddingView.render();
    requestAnimationFrame(renderEmbedded);
};
renderEmbedded();

// updateEmbeddedRenderArea
function updateEmbeddedRenderArea() {
    gEmbeddingView.updateRenderArea();
    renderEmbedded();
}

//--------------------------------------------------------------------------
// utils and events
//--------------------------------------------------------------------------

// loadEmbeddedImageBtnClick
function loadEmbeddedImageBtnClick(event) {
    invisible_embedded_image_input.accept = '.jpg,.jpeg,.png,.bmp';
    invisible_embedded_image_input.onchange = function (event) {
        for (var i = 0; i < event.currentTarget.files.length; i++) {
            if (!gEmbeddedImagesLoaded.has(event.currentTarget.files[i].name)) {
                gEmbeddedImagesLoaded.add(event.currentTarget.files[i].name);

                // load image from file
                var fileReader = new FileReader();
                fileReader.onload = function (event) {
                    var image = new Image();
                    image.onload = function (event) {
                        var embeddedInfo = gEmbeddedInfoList.getEmbeddedInfoByName(event.currentTarget.fileName);
                        // check embedded info exists
                        if (embeddedInfo) {
                            var texture = new THREE.Texture(this);
                            texture.needsUpdate = true;

                            // get color
                            var embeddedColor = embeddedGrayscaleToJit(gEmbeddedInfoList.embeddedInfoTypeMax !== 0 ? embeddedInfo.type / gEmbeddedInfoList.embeddedInfoTypeMax * 255 : 127);

                            // create sprite
                            var spriteMaterial = new THREE.SpriteMaterial({ map: texture, color: new THREE.Color(embeddedColor.r, embeddedColor.g, embeddedColor.b) });
                            var sprite = new THREE.Sprite(spriteMaterial);
                            sprite.embeddedInfo = embeddedInfo;
                            sprite.position.set(
                                embeddedInfo.x * 5,
                                embeddedInfo.y * 5,
                                embeddedInfo.z * 5);
                            sprite.scale.set(0.4, 0.4, 0.4);
                            gEmbeddingView.scene.add(sprite);
                        }
                    };
                    //console.log(event.currentTarget.__fileName);
                    image.fileName = event.currentTarget.fileName;
                    image.src = event.currentTarget.result;
                }
                fileReader.fileName = event.currentTarget.files[i].name;
                fileReader.readAsDataURL(event.currentTarget.files[i]);
            }
        }
    }
    invisible_embedded_image_input.click();
}

//  loadEmbeddedInfoBtnClick
function loadEmbeddedInfoBtnClick(event) {
    invisible_embedded_info_file_input.accept = '.csv';
    invisible_embedded_info_file_input.onchange = function (event) {
        for (var i = 0; i < event.currentTarget.files.length; i++) {
            gEmbeddedInfoList.loadFromFile(event.currentTarget.files[i]);
        }
    }
    invisible_embedded_info_file_input.click();
}

// gray scale to JIT
function embeddedGrayscaleToJit(value) {
    var t = ((value - 127.0) / 255.0) * 2.0;
    var result = {};
    result.r = clamp((1.5 - Math.abs(2.0 * t - 1.0)) * 2, 0, 1);
    result.g = clamp((1.5 - Math.abs(2.0 * t + 0.0)) * 2, 0, 1);
    result.b = clamp((1.5 - Math.abs(2.0 * t + 1.0)) * 2, 0, 1);
    return result;
}