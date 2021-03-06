// ColorMapTypeEnum
var ColorMapTypeEnum = {
    GRAY_SCALE: 1,
    JIT: 2
};

// SelectionModeEnum
var SelectionModeEnum = {
    ADD: 1,
    REMOVE: 2
}

// RegionInfoSourceEnum
var RegionInfoSourceEnum = {
    MANUAL: 1,
    LOADED: 2
}

// TextureID
class TextureID {
    constructor(ID, color = "red") {
        this.ID = ID;
        this.color = color;
        this.name = "";
    }
}

// RegionInfo
class RegionInfo {
    constructor() {
        this.color = "red";
        this.ID = "";
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.source = RegionInfoSourceEnum.MANUAL;
        this.sourceIndex = 0;
    }

    // normalize region
    normalize() {
        // horizontal normilize
        if (this.width < 0) {
            this.x += this.width;
            this.width = -this.width;
        }

        // vertical normilize
        if (this.height < 0) {
            this.y += this.height;
            this.height = -this.height;
        }
    }

    // scale region parameters
    scale(factor) {
        this.x *= factor;
        this.y *= factor;
        this.width *= factor;
        this.height *= factor;
    }

    // check intersection (regions MUST be normalized)
    checkIntersectionRegion(region) {
        return this.checkIntersection(region.x, region.y, region.width, region.height);
    }

    // check intersection (regions MUST be normalized)
    checkIntersection(x, y, w, h) {
        if ((this.x <= x + w) && (this.x + this.width >= x) &&
            (this.y <= y + h) && (this.y + this.height >= y)) {
            return true;
        } else {
            return false;
        }
    }

    // trim (regions MUST be normalized)
    trim(x0, y0, x1, y1) {
        // calc resulting coords
        var result_x0 = Math.max(x0, this.x);
        var result_y0 = Math.max(y0, this.y);
        var result_x1 = Math.min(x1, this.x + this.width - 1);
        var result_y1 = Math.min(y1, this.y + this.height - 1);

        // update fields
        this.x = result_x0;
        this.y = result_y0;
        this.width = result_x1 - result_x0;
        this.height = result_y1 - result_y0;
    }
}

// CurvePoint
class CurvePoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// Curve
class Curve {
    constructor() {
        this.imageFileName = ""; // used for holding image file name from the table
        this.color = "#ff0000";
        this.sourceIndex = 0;
        this.points = []; // CurvePoint
    }
}

// ImageInfo
class ImageInfo {
    constructor() {
        this.fileRef = null;
        this.image = null;
        this.regions = [];
        this.curves = [];
    }

    // load from file
    loadFromFile() {
        var fileReader = new FileReader();
        fileReader.imageInfo = this;
        fileReader.onload = function (event) {
            event.currentTarget.imageInfo.image = new Image();
            event.currentTarget.imageInfo.image.src = event.currentTarget.result;
        }
        fileReader.readAsDataURL(this.fileRef);
    }
}

// TextureIDListView
class TextureIDListView {
    constructor(textureIDList) {
        this.textureIDList = textureIDList;
        this.onchange = null;
        // get controls
        this.textureIDListContainer = document.getElementById("texture_id_list_container");
    }

    // drawImageList
    update() {
        // get checked textureID
        var textureID = this.findCheckedTextureID();

        // just clear
        this.clear();

        // add new items
        for (var i = 0; i < this.textureIDList.length; i++)
            this.addTextureIDItem(this.textureIDList[i]);

        // check first textureID not cheked
        if (textureID) {
            this.checkByTextureID(textureID);
        }
        else if ((!textureID) && (this.textureIDList.length > 0))
            document.getElementsByName('textureID')[0].checked = true;
    }

    // find checked texture ID
    checkByTextureID(textureID) {
        if (textureID) {
            var radios = document.getElementsByName('textureID');
            for (var i = 0, length = radios.length; i < length; i++) {
                if (radios[i].textureID == textureID) {
                    radios[i].checked = true;
                    return;
                }
            }
        }
    }

    // find checked texture ID
    findCheckedTextureID() {
        var radios = document.getElementsByName('textureID');
        for (var i = 0, length = radios.length; i < length; i++) {
            if (radios[i].checked) {
                return radios[i].textureID;
            }
        }
        return null;
    }

    // addItemInfoListItem
    addTextureIDItem(textureID) {
        if (textureID !== null) {
            var div = document.createElement("div");
            div.style = "display: flex; flex-direction: row";
            // create new radio button
            var radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "textureID";
            radio.textureID = textureID;
            radio.onchange = textureIDSelected;
            radio.style.background = textureID.color;
            div.appendChild(radio);
            // create ID label
            var item = document.createElement("a");
            item.innerText = textureID.ID;
            item.style.background = textureID.color;
            item.style.minWidth = "15px";
            item.style.fontWeight = "bold";
            div.appendChild(item);
            // create name
            var name = document.createElement("a");
            name.innerText = "Name:";
            div.appendChild(name);
            // create descr
            var descr = document.createElement("input");
            descr.type = "text";
            descr.value = textureID.name;
            descr.style.width = "100%";
            descr.textureID = textureID;
            descr.oninput = function (event) {
                event.target.textureID.name = event.target.value;
                imageInfoRegionsSelectorUpdate();
            }
            div.appendChild(descr);
            // append to list
            this.textureIDListContainer.appendChild(div);
            return radio;
        }
        return null;
    }

    // clear
    clear() {
        // clear childs
        while (this.textureIDListContainer.firstChild) {
            this.textureIDListContainer.removeChild(
                this.textureIDListContainer.firstChild
            );
        }
    }
}

// ImageInfoViewer
class ImageInfoViewer {
    constructor(parent) {
        this.imageInfo = null; // current raw image info
        this.imageBuffer = new Image(); // colored image buffer
        this.imageBuffer.imageInfoViewer = this;
        this.colorMapType = ColorMapTypeEnum.GRAY_SCALE;
        this.scale = 1.0;
        this.selectionStarted = false;
        this.selectionMode = SelectionModeEnum.ADD;
        this.source = RegionInfoSourceEnum.MANUAL;
        this.sourceIndex = 0;
        this.selectionRegionInfo = new RegionInfo();
        this.onchange = null;
        this.textureID = null;

        // create image canvas
        this.parent = parent;
        this.imageCanvas = document.createElement("canvas");
        this.imageCanvas.style.border = "1px solid orange";
        this.imageCanvasCtx = this.imageCanvas.getContext('2d');
        this.parent.appendChild(this.imageCanvas);

        // create curves canvas
        this.curvesCanvas = document.createElement("canvas");
        this.curvesCanvas.style.display = "none";
        this.curvesCanvas.style.border = "1px solid gray";
        this.curvesCanvasCtx = this.curvesCanvas.getContext('2d');
        this.parent.appendChild(this.curvesCanvas);

        this.parent.imageInfoViewer = this;

        // add event - mousemove
        this.parent.addEventListener("mousemove", function (event) {
            // get base data
            var imageInfoViewer = event.currentTarget.imageInfoViewer;

            // update selection region info
            if (imageInfoViewer.selectionStarted) {
                var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);
                imageInfoViewer.selectionRegionInfo.width = mouseCoords.x - imageInfoViewer.selectionRegionInfo.x;
                imageInfoViewer.selectionRegionInfo.height = mouseCoords.y - imageInfoViewer.selectionRegionInfo.y;

                // redraw stuff
                imageInfoViewer.redraw();
                imageInfoViewer.drawSelectionRegion();
            }
        });
        // add event - mouseup
        this.parent.addEventListener("mouseup", function (event) {
            // get base data
            var imageInfoViewer = event.currentTarget.imageInfoViewer;

            // proceed selection
            if (imageInfoViewer.selectionStarted) {
                var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);

                // celection region normalize and scale
                imageInfoViewer.selectionRegionInfo.normalize();
                imageInfoViewer.selectionRegionInfo.scale(1.0 / imageInfoViewer.scale);

                // add regions from list
                if (imageInfoViewer.selectionMode === SelectionModeEnum.ADD) {
                    if (imageInfoViewer.isRegionInfoInside(imageInfoViewer.selectionRegionInfo)) {
                        // add new region info 
                        var regionInfo = new RegionInfo();
                        regionInfo.color = imageInfoViewer.selectionRegionInfo.color;
                        regionInfo.ID = imageInfoViewer.selectionRegionInfo.ID;
                        regionInfo.x = imageInfoViewer.selectionRegionInfo.x;
                        regionInfo.y = imageInfoViewer.selectionRegionInfo.y;
                        regionInfo.width = imageInfoViewer.selectionRegionInfo.width;
                        regionInfo.height = imageInfoViewer.selectionRegionInfo.height;
                        regionInfo.trim(0, 0, imageInfoViewer.imageBuffer.width, imageInfoViewer.imageBuffer.height);

                        // check size restrictions for small images
                        if ((imageInfoViewer.imageBuffer.height < 200) &&
                            (imageInfoViewer.imageBuffer.width < 200)) {
                            imageInfoViewer.removeRegionsInArea(imageInfoViewer.selectionRegionInfo);
                            imageInfoViewer.imageInfo.regions.push(regionInfo);
                        }
                        else // check size restrictions for regular images
                            if ((regionInfo.width > 100) && (regionInfo.height > 200)) {
                                imageInfoViewer.removeRegionsInArea(imageInfoViewer.selectionRegionInfo);
                                imageInfoViewer.imageInfo.regions.push(regionInfo);
                            }
                            else {
                                if ((regionInfo.width <= 100) && (regionInfo.height <= 200)) {
                                    window.alert("Region is too small")
                                } else if (regionInfo.width <= 100) {
                                    window.alert("Width is too small")
                                } else if (regionInfo.height <= 200) {
                                    window.alert("Height is too small")
                                }
                            }
                    }
                } else if (imageInfoViewer.selectionMode === SelectionModeEnum.REMOVE) {
                    // remove regions from list
                    imageInfoViewer.removeRegionsInArea(imageInfoViewer.selectionRegionInfo);
                }

                // redraw all stuff
                imageInfoViewer.redraw();

                // call event
                if (imageInfoViewer.onchange)
                    imageInfoViewer.onchange(imageInfoViewer.imageInfo);
            }
            imageInfoViewer.selectionStarted = false;
        });
        // add event - mousedown
        this.parent.addEventListener("mousedown", function (event) {
            // get base data
            var imageInfoViewer = event.currentTarget.imageInfoViewer;

            // set selection state and setup selection region if preview mod is MANUAL
            if ((imageInfoViewer.source === RegionInfoSourceEnum.MANUAL) &&
                (imageInfoViewer.imageInfo !== null)) {
                var mouseCoords = getMousePosByElement(imageInfoViewer.imageCanvas, event);
                imageInfoViewer.selectionStarted = true;
                // check selection mode and set color
                if (imageInfoViewer.selectionMode === SelectionModeEnum.ADD) {
                    imageInfoViewer.selectionRegionInfo.color = imageInfoViewer.textureID.color;
                    imageInfoViewer.selectionRegionInfo.ID = imageInfoViewer.textureID.ID;
                } else if (imageInfoViewer.selectionMode === SelectionModeEnum.REMOVE) {
                    imageInfoViewer.selectionRegionInfo.color = "#FF0000";
                }
                // set base coords
                imageInfoViewer.selectionRegionInfo.x = mouseCoords.x;
                imageInfoViewer.selectionRegionInfo.y = mouseCoords.y;
                imageInfoViewer.selectionRegionInfo.width = 0;
                imageInfoViewer.selectionRegionInfo.height = 0;
            };
        });
    }

    // is region info inside
    isRegionInfoInside(regionInfo) {
        if (this.imageBuffer) {
            return regionInfo.checkIntersection(0, 0, this.imageBuffer.width, this.imageBuffer.height);
        }
        return false;
    }

    // remove regions from list by other region
    removeRegionsInArea(area) {
        area.normalize();
        // this is temporary solution. There will be previews
        for (var i = this.imageInfo.regions.length - 1; i >= 0; i--) {
            var region = this.imageInfo.regions[i];
            if (region.source === RegionInfoSourceEnum.MANUAL) {
                var intersected = region.checkIntersectionRegion(this.selectionRegionInfo);
                if (intersected) {
                    this.imageInfo.regions.splice(i, 1);
                }
            }
        }
    }

    // setImageInfo
    // NOTE: This is async function
    setImageInfo(imageInfo) {
        // check for null
        if (imageInfo === null) {
            this.imageInfo = null;
            this.imageBuffer = null;
            this.clear();
            return;
        }

        // check for same image info
        if (this.imageInfo === imageInfo)
            return;

        // setup new image info
        if (this.imageInfo != imageInfo) {
            this.imageInfo = imageInfo;
            this.updateImageBuffer();
            //this.drawImageBuffer();
            //this.drawImageRegions();
        }
    }

    // setColorMapType
    // NOTE: This is async function
    setColorMapType(colorMapType) {
        if (this.colorMapType !== colorMapType) {
            this.colorMapType = colorMapType;
            this.updateImageBuffer();
            //this.drawImageBuffer();
            //this.drawImageRegions();
        }
    }

    // setSelectionMode
    setSelectionMode(selectionMode) {
        if (this.selectionMode !== selectionMode) {
            this.selectionMode = selectionMode;
        }
    }

    // setScale
    setScale(scale) {
        if (this.scale !== scale) {
            this.scale = scale;
            this.updateImageBuffer();
            //this.drawImageBuffer();
            //this.drawImageRegions();
        }
    }

    // setSource
    setSource(source) {
        if (this.source !== source) {
            this.source = source;
            if (this.source === RegionInfoSourceEnum.MANUAL)
                this.curvesCanvas.style.display = "none";
            if (this.source === RegionInfoSourceEnum.LOADED)
                this.curvesCanvas.style.display = "inline";
            this.updateImageBuffer();
        }
    }

    // setSourceIndex
    setSourceIndex(sourceIndex) {
        if (this.sourceIndex !== sourceIndex) {
            this.sourceIndex = sourceIndex;
            if (this.source === RegionInfoSourceEnum.LOADED)
                this.updateImageBuffer();
        }
    }

    // updateImageBuffer
    // NOTE: This is async function
    updateImageBuffer() {
        // check for null
        if (this.imageInfo === null)
            return;

        // create canvas
        var canvas = document.createElement('canvas');
        canvas.width = this.imageInfo.image.width;
        canvas.height = this.imageInfo.image.height;

        // get context and draw original image
        var ctx = canvas.getContext('2d');
        ctx.drawImage(this.imageInfo.image, 0, 0);

        // calculate image buffer - JIT
        if (this.colorMapType == ColorMapTypeEnum.JIT)
            convertCanvasToJit(canvas);

        // copy img
        this.imageBuffer.onload = function (event) { event.currentTarget.imageInfoViewer.redraw(); };
        this.imageBuffer.src = canvas.toDataURL("image/png");
    }

    // drawImageBuffer
    drawImageBuffer() {
        // draw base image
        if (this.imageBuffer !== null) {
            this.imageCanvas.width = this.imageBuffer.width * this.scale;
            this.imageCanvas.height = this.imageBuffer.height * this.scale;
            this.imageCanvasCtx.drawImage(this.imageBuffer, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
        }
    }

    // drawImageRegions
    drawImageRegions() {
        if (this.imageInfo !== null) {
            // console.log(this.imageInfo.regions.length);
            for (var i = 0; i < this.imageInfo.regions.length; i++) {
                var region = this.imageInfo.regions[i];
                if (region.source === this.source) {
                    // draw manual regions
                    if (this.source === RegionInfoSourceEnum.MANUAL) {
                        this.imageCanvasCtx.globalAlpha = 0.5;
                        this.imageCanvasCtx.fillStyle = region.color;
                        this.imageCanvasCtx.fillRect(region.x * this.scale, region.y * this.scale, region.width * this.scale, region.height * this.scale);
                        this.imageCanvasCtx.globalAlpha = 1.0;
                    } else // draw loaded regions
                        if (this.source === RegionInfoSourceEnum.LOADED) {
                            if (region.sourceIndex === this.sourceIndex) {
                                this.imageCanvasCtx.globalAlpha = 0.5;
                                this.imageCanvasCtx.fillStyle = region.color;
                                this.imageCanvasCtx.fillRect(region.x * this.scale, region.y * this.scale, region.width * this.scale, region.height * this.scale);
                                this.imageCanvasCtx.globalAlpha = 1.0;
                            }
                        }
                }
            }
        }
    }

    // drawSelectionRegion
    drawSelectionRegion() {
        if (this.selectionStarted) {
            // check selection mode and set alpha
            if (this.selectionMode === SelectionModeEnum.ADD) {
                this.imageCanvasCtx.globalAlpha = 0.8;
            } else if (this.selectionMode === SelectionModeEnum.REMOVE) {
                this.imageCanvasCtx.globalAlpha = 0.85;
            }
            this.imageCanvasCtx.fillStyle = this.selectionRegionInfo.color;
            this.imageCanvasCtx.fillRect(this.selectionRegionInfo.x, this.selectionRegionInfo.y, this.selectionRegionInfo.width, this.selectionRegionInfo.height);
            this.imageCanvasCtx.globalAlpha = 1.0;
        }
    }

    // drawCurves
    drawCurves() {
        if (this.imageInfo !== null) {
            // set curves parameters
            this.curvesCanvas.width = this.imageBuffer.width * this.scale;
            this.curvesCanvas.height = this.imageBuffer.height * this.scale;
            this.curvesCanvasCtx.clearRect(0, 0, this.curvesCanvas.width, this.curvesCanvas.height);

            // draw curves
            for (var i = 0; i < this.imageInfo.curves.length; i++) {
                if (this.imageInfo.curves[i].sourceIndex === this.sourceIndex) {
                    this.curvesCanvasCtx.beginPath();
                    var x = this.imageInfo.curves[i].points[0].y * this.curvesCanvas.width;
                    var y = this.imageInfo.curves[i].points[0].x * this.scale;
                    this.curvesCanvasCtx.moveTo(x, y);
                    // move by points
                    for (var j = 1; j < this.imageInfo.curves[i].points.length; j++) {
                        var x = this.imageInfo.curves[i].points[j].y * this.curvesCanvas.width;
                        var y = this.imageInfo.curves[i].points[j].x * this.scale;
                        this.curvesCanvasCtx.lineTo(x, y);
                    }
                    this.curvesCanvasCtx.lineWidth = 3;
                    this.curvesCanvasCtx.strokeStyle = this.imageInfo.curves[i].color;
                    this.curvesCanvasCtx.stroke();
                }
            }
        }
    }

    // redraw
    redraw() {
        this.drawImageBuffer();
        this.drawImageRegions();
        this.drawCurves();
    }

    // clear
    clear() {
        this.imageCanvas.width = 300;
        this.imageCanvas.height = 150;
        this.imageCanvasCtx.rect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
    }
}

// ImageInfoListViewer
class ImageInfoListViewer {
    constructor(imageInfoList) {
        this.imageInfoList = imageInfoList;
        this.imageViewerContainer = document.getElementById("image_preview_canvas_panel");
        this.scale = 1.0;
        this.colorMapType = ColorMapTypeEnum.GRAY_SCALE;
    }

    // setScale
    setScale(scale) {
        this.scale = scale;
        this.redraw();
    }


    // clear
    clear() {
        // clear childs
        while (this.imageViewerContainer.firstChild) {
            this.imageViewerContainer.removeChild(
                this.imageViewerContainer.firstChild
            );
        }
    }

    // redraw
    redraw() {
        this.clear();

        // add all images to preview
        for (var i = 0; i < this.imageInfoList.length; i++) {
            // get image info
            var imageInfo = this.imageInfoList[i];
            this.appendImageItem(imageInfo)
        }
    }

    // appendImageItem
    appendImageItem(imageInfo) {
        // add div
        var div = document.createElement('div');
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.padding = "5px";
        div.style.border = "1px solid gray"

        // add label
        var filaNameLabel = document.createElement('a');
        filaNameLabel.innerText = imageInfo.fileRef.name;
        filaNameLabel.style.color = "white";
        filaNameLabel.style.fontSize = "16px";
        div.appendChild(filaNameLabel);

        // get ratio
        var ratio = imageInfo.image.width / imageInfo.image.height;
        var canvas_height = Math.min(imageInfo.image.height, 512) * this.scale;
        var canvas_width = canvas_height * ratio;

        // create div canvas
        var divCanvas = document.createElement('div');

        // create canvas
        var canvas = document.createElement('canvas');
        canvas.width = canvas_width;
        canvas.height = canvas_height;

        // get context and draw original image
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imageInfo.image,
            0, 0, imageInfo.image.width, imageInfo.image.height,
            0, 0, canvas.width, canvas.height
        );

        // calculate image buffer - JIT
        if (this.colorMapType == ColorMapTypeEnum.JIT)
            convertCanvasToJit(canvas);

        divCanvas.appendChild(canvas);
        div.appendChild(divCanvas);

        // append new canvas
        this.imageViewerContainer.appendChild(div);
    }

    // setColorMapType
    // NOTE: This is async function
    setColorMapType(colorMapType) {
        if (this.colorMapType !== colorMapType) {
            this.colorMapType = colorMapType;
            this.redraw();
        }
    }
}

// ImageRegionViewer
class ImageRegionViewer {
    constructor(imageInfoList) {
        this.imageInfoList = imageInfoList;
        this.textureID = null;
        this.colorMapType = ColorMapTypeEnum.GRAY_SCALE;
        this.source = RegionInfoSourceEnum.MANUAL;
        this.sourceIndex = 0;

        // get controls
        this.regionListContainer = document.getElementById("region_preview");
    }

    // setTextureID
    setTextureID(textureID) {
        // check for same image info
        if (this.textureID === textureID) {
            return;
        }

        // setup new image info
        if (this.textureID != textureID) {
            this.textureID = textureID;
            this.drawRegionList();
        }
    }

    // clear
    clear() {
        // clear childs
        while (this.regionListContainer.firstChild) {
            this.regionListContainer.removeChild(
                this.regionListContainer.firstChild
            );
        }
    }

    // setColorMapType
    // NOTE: This is async function
    setColorMapType(colorMapType) {
        if (this.colorMapType !== colorMapType) {
            this.colorMapType = colorMapType;
            this.drawRegionList();
        }
    }

    // setColorMapType
    // NOTE: This is async function
    setSource(source) {
        if (this.source !== source) {
            this.source = source;
            this.drawRegionList();
        }
    }

    // setColorMapType
    // NOTE: This is async function
    setSourceIndex(sourceIndex) {
        if (this.sourceIndex !== sourceIndex) {
            this.sourceIndex = sourceIndex;
            this.drawRegionList();
        }
    }

    // drawRegions
    drawRegionList() {
        // clear data
        this.clear();

        // check for null
        if (this.textureID === null)
            return;

        // this is temporary solution. There will be previews
        for (var i = 0; i < this.imageInfoList.length; i++) {
            // get image info
            var imageInfo = this.imageInfoList[i];
            for (var j = 0; j < imageInfo.regions.length; j++) {
                // get region info
                var regionInfo = imageInfo.regions[j];
                if ((regionInfo.ID === this.textureID.ID) &&
                    (regionInfo.source === this.source)) {
                    // draw manual regions
                    if (this.source === RegionInfoSourceEnum.MANUAL) {
                        this.appendRegionInfoItem(imageInfo, regionInfo)
                    } else // draw loaded regions
                        if (this.source === RegionInfoSourceEnum.LOADED) {
                            if (regionInfo.sourceIndex === this.sourceIndex) {
                                this.appendRegionInfoItem(imageInfo, regionInfo)
                            }
                        }
                }
            }
        }
    }

    // addRegionInfoItem
    appendRegionInfoItem(imageInfo, regionInfo) {
        // add div
        var div = document.createElement('div');
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.padding = "5px";

        // add label
        var filaNameLabel = document.createElement('a');
        filaNameLabel.innerText = imageInfo.fileRef.name;
        filaNameLabel.style.fontSize = "16px";
        div.appendChild(filaNameLabel);

        // get ratio
        var ratio = regionInfo.width / regionInfo.height;
        var canvas_width = Math.min(regionInfo.width, 256);
        var canvas_height = canvas_width / ratio;

        // create div canvas
        var divCanvas = document.createElement('div');
        divCanvas.width = canvas_width;
        divCanvas.height = canvas_height;

        // create canvas
        var canvas = document.createElement('canvas');
        canvas.width = canvas_width;
        canvas.height = canvas_height;

        // get context and draw original image
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imageInfo.image,
            regionInfo.x, regionInfo.y,
            regionInfo.width, regionInfo.height,
            0, 0,
            canvas.width, canvas.height
        );

        // calculate image buffer - JIT
        if (this.colorMapType == ColorMapTypeEnum.JIT)
            convertCanvasToJit(canvas);

        divCanvas.appendChild(canvas);
        div.appendChild(divCanvas);

        // append new canvas
        this.regionListContainer.appendChild(div);
    }
}

// color table for color IDs
var cColorTable = [
    "blue",
    "red",
    "green",
    "orange",
    "#006666",
];

// global classes
var gImageInfoList = [];
var gTextureIDList = [
    new TextureID("A", "blue"),
    new TextureID("B", "red"),
    new TextureID("C", "green"),
    new TextureID("D", "orange"),
    new TextureID("E", "#B0187B"),
    new TextureID("F", "#8B7DA3"),
    new TextureID("G", "#A545BB"),
    new TextureID("H", "#C7A248"),
    new TextureID("I", "#39F992"),
    new TextureID("J", "#324CF7"),
    new TextureID("K", "#D04D5E"),
    new TextureID("L", "#1E88E6"),
    new TextureID("M", "#92BFB3"),
    new TextureID("N", "#858D1A"),
    new TextureID("O", "#92E877"),
    new TextureID("P", "#1FDFD9"),
    new TextureID("Q", "#DD7488"),
    new TextureID("R", "#9DACBB"),
    new TextureID("S", "#934591"),
    new TextureID("T", "#FC9AA4"),
];

// global components
var gTextureIDListView = new TextureIDListView(gTextureIDList);
gTextureIDListView.update();
var gImageInfoViewer = new ImageInfoViewer(image_canvas_panel);
gImageInfoViewer.textureID = gTextureIDList[0];
gImageInfoViewer.onchange = imageInfoChange;
var gImageInfoListViewer = new ImageInfoListViewer(gImageInfoList);
var gImageRegionListViewer = new ImageRegionViewer(gImageInfoList);
// session
let gUsername = "";
let gSessionID = "";
let gSessionDesription = "";
imageInfoRegionsSelectorUpdate();

// global variables
var gRegionsFilesLoadedCount = 0;
var gCurvesFilesLoadedCount = 0;

//--------------------------------------------------------------------------
// events
//--------------------------------------------------------------------------

// setection mode click
function setectionModeClick() {
    if (document.getElementById("rbSetectionModeAdd").checked) {
        gImageInfoViewer.setSelectionMode(SelectionModeEnum.ADD);
    } else {
        gImageInfoViewer.setSelectionMode(SelectionModeEnum.REMOVE);
    }
}

// color map type click
function colorMapTypeClick() {
    if (document.getElementById("rbGrayScale").checked) {
        gImageInfoViewer.setColorMapType(ColorMapTypeEnum.GRAY_SCALE);
        gImageInfoListViewer.setColorMapType(ColorMapTypeEnum.GRAY_SCALE);
        gImageRegionListViewer.setColorMapType(ColorMapTypeEnum.GRAY_SCALE);
    } else {
        gImageInfoViewer.setColorMapType(ColorMapTypeEnum.JIT);
        gImageInfoListViewer.setColorMapType(ColorMapTypeEnum.JIT);
        gImageRegionListViewer.setColorMapType(ColorMapTypeEnum.JIT);
    }
}

// color map type click
function regionSourceClick() {
    if (document.getElementById("rbManual").checked) {
        gImageInfoViewer.setSource(RegionInfoSourceEnum.MANUAL);
        gImageRegionListViewer.setSource(RegionInfoSourceEnum.MANUAL);
    } else {
        gImageInfoViewer.setSource(RegionInfoSourceEnum.LOADED);
        gImageRegionListViewer.setSource(RegionInfoSourceEnum.LOADED);
    }
}

// view mode click
function viewModeClick() {
    if (document.getElementById("rbEdit").checked) {
        image_editor.style.display = "flex";
        image_preview.style.display = "none";
        //gImageInfoViewer.setSource(RegionInfoSourceEnum.MANUAL);
        //gImageRegionListViewer.setSource(RegionInfoSourceEnum.MANUAL);
    } else {
        gImageInfoListViewer.redraw();
        image_editor.style.display = "none";
        image_preview.style.display = "block";
        //gImageInfoViewer.setSource(RegionInfoSourceEnum.LOADED);
        //gImageRegionListViewer.setSource(RegionInfoSourceEnum.LOADED);
    }
}

// load images button event
function loadImageBtnClick() {
    if (invisible_file_input) {
        invisible_file_input.accept = '.jpg,.jpeg,.png,.bmp';
        invisible_file_input.onchange = function (event) {
            for (var i = 0; i < event.currentTarget.files.length; i++) {
                // create image info
                var imageInfo = new ImageInfo();
                imageInfo.fileRef = event.currentTarget.files[i];
                imageInfo.loadFromFile();
                // add image info
                gImageInfoList.push(imageInfo);
            }
            imageInfoRegionsSelectorUpdate();
            selectImageNumberUpdate();
            // image number input
            //if (gImageInfoList.length > 0)
            //    imageNumberInput.max = gImageInfoList.length - 1;
        }
        invisible_file_input.click();
    }
}

// image info list item click
function imageInfoListItemClick(event) {
    gImageInfoViewer.setImageInfo(event.currentTarget.imageInfo);
}

// image info list item click
function imageInfoChange(imageInfo) {
    gImageRegionListViewer.drawRegionList();
}

// scale down bnt click
function scaleDownBntClick(event) {
    gImageInfoViewer.setScale(gImageInfoViewer.scale / 2);
    scaleFactor.innerText = Math.round(gImageInfoViewer.scale * 100) + "%";
}

// scale up bnt click
function scaleUpBtnClick(event) {
    gImageInfoViewer.setScale(gImageInfoViewer.scale * 2);
    scaleFactor.innerText = Math.round(gImageInfoViewer.scale * 100) + "%";
}

// scale down preview bnt click
function scaleDownPreviewBntClick(event) {
    gImageInfoListViewer.setScale(gImageInfoListViewer.scale / 2);
}

// scale up preview bnt click
function scaleUpPreviewBtnClick(event) {
    gImageInfoListViewer.setScale(gImageInfoListViewer.scale * 2);
}

// imagesViewClick
function imagesViewClick(event) {
    trainAndPredict_view.style.display = "none";
    embedding_view.style.display = "none";
    image_view.style.display = "flex";
}

// embeddingViewClick
function embeddingViewClick(event) {
    trainAndPredict_view.style.display = "none";
    embedding_view.style.display = "flex";
    image_view.style.display = "none";
    updateEmbeddedRenderArea();
}

// trainAndPredictViewClick
function trainAndPredictViewClick(event) {
    trainAndPredict_view.style.display = "flex";
    embedding_view.style.display = "none";
    image_view.style.display = "none";
    updateTrainAndPredictRenderArea();
}

// selectImageNumberChange
function selectImageNumberChange(event) {
    gImageInfoViewer.setImageInfo(gImageInfoList[selectImageNumber.selectedIndex]);
}

// image info regions selector change
function imageInfoRegionsSelectorChange(event) {
    gImageRegionListViewer.setTextureID(gTextureIDList[imageInfoRegionsSelector.selectedIndex]);
}

// add texture ID button click
function addTextureIDButtonClick(event) {
    var id = nextChar(gTextureIDList[gTextureIDList.length - 1].ID);
    var color = generateRandomColor();
    gTextureIDList.push(new TextureID(id, color));
    gTextureIDListView.update();
    imageInfoRegionsSelectorUpdate();
}

// texture Is Selected
function textureIDSelected(event) {
    gImageInfoViewer.textureID = event.target.textureID;
}

// submit click
function submitClick(event) {
    var regionsString = '';
    for (var i = 0; i < gImageInfoList.length; i++) {
        var imageInfo = gImageInfoList[i];
        for (var j = 0; j < imageInfo.regions.length; j++) {
            var imageRegion = imageInfo.regions[j];
            if (imageRegion.source === RegionInfoSourceEnum.MANUAL) {
                regionsString +=
                    imageInfo.fileRef.name + ", " +
                    imageRegion.x + ", " +
                    imageRegion.y + ", " +
                    "1, " +
                    (imageRegion.x + imageRegion.width) + ", " +
                    (imageRegion.y + imageRegion.height) + ", " +
                    "1, " +
                    imageRegion.ID + ", " +
                    gTextureIDList.find(textureID => textureID.ID === imageRegion.ID).name + "\r\n";
                ;
            }
        }
    }

    downloadFile(regionsString, 'regions.txt', 'text/plain');
}

// load regions click
function loadRegionsClick(event) {
    if (invisible_text_file_input) {
        invisible_text_file_input.accept = '.txt';
        invisible_text_file_input.onchange = function (event) {
            //clearLoadedRegions();
            for (var i = 0; i < event.currentTarget.files.length; i++) {
                parseRegionFile(event.currentTarget.files[i]);
            }
        }
        invisible_text_file_input.click();
    }
}

// load curves click
function loadCurvesClick(event) {
    if (invisible_text_file_input) {
        invisible_text_file_input.accept = '.txt';
        invisible_text_file_input.onchange = function (event) {
            //clearLoadedCurves();
            for (var i = 0; i < event.currentTarget.files.length; i++) {
                parseCurveFile(event.currentTarget.files[i]);
            }
        }
        invisible_text_file_input.click();
    }
}

// onChangeSourceIndexTb
function onChangeSourceIndexTb(event) {
    gImageInfoViewer.setSourceIndex(parseInt(sourceIndexTb.value));
    gImageRegionListViewer.setSourceIndex(parseInt(sourceIndexTb.value));
    resultID.innerText = sourceIndexTb.value;
}

// parce text file
function parseRegionFile(f) {
    // parce text file
    var r = new FileReader();
    r.onload = function (e) {
        var strings = e.target.result.split('\n').forEach(
            str => parceRegionString(str)
        );
        // update trackbar
        sourceIndexTb.max = gRegionsFilesLoadedCount;
        gImageInfoViewer.redraw();
        gImageInfoListViewer.redraw();
        gImageRegionListViewer.drawRegionList();
        gRegionsFilesLoadedCount++;
    }
    r.readAsText(f);
}

// parce region string
function parceRegionString(s) {
    // chech for empty string
    if (s.length === 0) return;
    var params = s.split(',');
    params = params.map(param => param.trim());

    // add region to image info
    gImageInfoList.forEach(imageInfo => {
        if (imageInfo.fileRef.name === params[0]) {
            // add new region info 
            var regionInfo = new RegionInfo();
            var textureID = findOrDefaultTextureID(params[7]);
            regionInfo.ID = textureID.ID;
            regionInfo.color = textureID.color;
            regionInfo.x = params[1];
            regionInfo.y = params[2];
            regionInfo.width = params[4] - params[1];
            regionInfo.height = params[5] - params[2];
            regionInfo.source = RegionInfoSourceEnum.LOADED;
            regionInfo.sourceIndex = gRegionsFilesLoadedCount;
            imageInfo.regions.push(regionInfo);
        }
    });
}

// clearLoadedRegions
function clearLoadedRegions() {
    gImageInfoList.forEach(imageInfo => {
        for (var i = imageInfo.regions.length - 1; i >= 0; --i)
            if (imageInfo.regions[i].source === RegionInfoSourceEnum.LOADED)
                imageInfo.regions.splice(i, 1);
    })
}

// ImageCurveSet (ONLY FOR PARSING OF CURVE PCA FILES)
class ImageCurveSet {
    constructor() {
        this.imageFileName = "";
        this.curves = [];
    }
}
gImageCurveSetList = [];

// parseCurveFile
function parseCurveFile(f) {
    // parce text file
    var r = new FileReader();
    r.onload = function (e) {
        // create imageCurveSet
        gImageCurveSetList = [];

        // get strings list
        var strings = e.target.result.split('\n').forEach(str => parseCurveString(str));

        // append curves to images
        gImageCurveSetList.forEach(imageCurveSet => {
            gImageInfoList.forEach(imageInfo => {
                if (imageCurveSet.imageFileName === imageInfo.fileRef.name) {
                    imageCurveSet.curves.forEach(curve => {
                        imageInfo.curves.push(curve);
                    });
                }
            });
        });

        // redraw
        gImageInfoViewer.redraw();
        gImageInfoListViewer.redraw();
        gImageRegionListViewer.drawRegionList();
        gCurvesFilesLoadedCount++;
    }
    r.readAsText(f);
}

// parce region string
function parseCurveString(s) {
    // chech for empty string
    if (s.length === 0) return;
    var params = s.split(',');
    params = params.map(param => param.trim());
    var curvesCount = params.length - 3;

    // find imageCurveSet by image file name
    imageCurveSet = null;
    for (var i = 0; i < gImageCurveSetList.length; i++)
        if (gImageCurveSetList[i].imageFileName === params[0])
            imageCurveSet = gImageCurveSetList[i];

    // add new if not finded
    if (imageCurveSet === null) {
        imageCurveSet = new ImageCurveSet();
        imageCurveSet.imageFileName = params[0];
        gImageCurveSetList.push(imageCurveSet);
    }

    // create curves for ImageInfo
    for (var i = imageCurveSet.curves.length; i < curvesCount; i++) {
        var curve = new Curve();
        curve.sourceIndex = gCurvesFilesLoadedCount;
        curve.imageFileName = imageCurveSet.imageFileName;
        curve.color = cColorTable[i];
        imageCurveSet.curves.push(curve);
    }

    // add points to curves
    for (var i = 0; i < curvesCount; i++) {
        var x = params[1];
        var y = params[3 + i];
        imageCurveSet.curves[i].points.push(new CurvePoint(x, y));
    }
}

// clearLoadedCurves
function clearLoadedCurves() {
    gImageInfoList.forEach(imageInfo => {
        imageInfo.curves = [];
    })
}

// findOrDefaultTextureID
function findOrDefaultTextureID(textureID) {
    for (var i = 0; i < gTextureIDList.length; i++)
        if (textureID == gTextureIDList[i].ID)
            return gTextureIDList[i];
    return gTextureIDList[0];
}

//--------------------------------------------------------------------------
// utils
//--------------------------------------------------------------------------

// imageInfoRegionsSelectorUpdate
function imageInfoRegionsSelectorUpdate() {
    if (imageInfoRegionsSelector) {
        // store selected value
        var selectedIndex = imageInfoRegionsSelector.selectedIndex;
        // clear childs
        while (imageInfoRegionsSelector.firstChild) {
            imageInfoRegionsSelector.removeChild(
                imageInfoRegionsSelector.firstChild
            );
        }
        // add items
        for (var i = 0; i < gTextureIDList.length; i++) {
            // create new selector
            var textureIDOption = document.createElement('option');
            textureIDOption.value = gTextureIDList[i];
            textureIDOption.innerHTML = gTextureIDList[i].ID + ": " + gTextureIDList[i].name;
            imageInfoRegionsSelector.appendChild(textureIDOption);
        }
        // set selected value
        if ((selectedIndex < 0) && (gTextureIDList.length > 0)) {
            imageInfoRegionsSelector.value = gTextureIDList[0];
            gImageRegionListViewer.setTextureID(gTextureIDList[imageInfoRegionsSelector.selectedIndex])
        } else {
            imageInfoRegionsSelector.selectedIndex = selectedIndex;
        }
    }
}

// selectImageNumberUpdate
function selectImageNumberUpdate() {
    if (imageInfoRegionsSelector) {
        // get selected index
        var selectedIndex = selectImageNumber.selectedIndex;

        // clear childs
        while (selectImageNumber.firstChild) { selectImageNumber.removeChild(selectImageNumber.firstChild); }

        // add items
        for (var i = 0; i < gImageInfoList.length; i++) {
            // create new selector
            var imageIDOption = document.createElement('option');
            imageIDOption.value = gImageInfoList[i];
            imageIDOption.innerHTML = gImageInfoList[i].fileRef.name;
            selectImageNumber.appendChild(imageIDOption);
        }

        // set selected index
        selectImageNumber.selectedIndex = selectedIndex;
    }
}

function downloadFile(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], { type: type });
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

// gray scale to JIT
function grayscaleToJit(value) {
    var t = ((value - 127.0) / 255.0) * 2.0;
    var result = {};
    result.r = clamp(1.5 - Math.abs(2.0 * t - 1.0), 0, 1);
    result.g = clamp(1.5 - Math.abs(2.0 * t), 0, 1);
    result.b = clamp(1.5 - Math.abs(2.0 * t + 1.0), 0, 1);
    return result;
}

// convert canvas to Jit
function convertCanvasToJit(canvas) {
    // get image data
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // update image data
    for (var i = 0; i < imageData.data.length; i += 4) {
        var color = grayscaleToJit(imageData.data[i + 1]); // get green value
        imageData.data[i + 0] = color.r * 255;
        imageData.data[i + 1] = color.g * 255;
        imageData.data[i + 2] = color.b * 255;
        imageData.data[i + 3] = 255;
    }

    // update context
    ctx.putImageData(imageData, 0, 0);
}

// clamp, just clamp
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// get mause position for element
function getMousePosByElement(node, event) {
    var rect = node.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}

// generate random color
function generateRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// next char
function nextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

// generateSessionID
function generateSessionID() {
    return Math.random().toString(36).slice(2);
}

// window.onload
window.onload = event => {
    gSessionID = generateSessionID();
    inputSessionID.value = gSessionID;

    // events
    inputUsername.oninput = event => gUsername = inputUsername.value;
    inputDescription.oninput = event => gSessionDesription = inputDescription.value;
}